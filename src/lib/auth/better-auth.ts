import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { lastLoginMethod } from "better-auth/plugins";
import { createAuthMiddleware } from "better-auth/api";
import { createId } from "@paralleldrive/cuid2";
import { Prisma } from "@/generated/prisma/client";
import type { PrismaClient } from "@/generated/prisma/client";
import { encryptTokens, decryptTokens } from "./encryption";

/**
 * Prisma Client Extension for Token Encryption
 *
 * Automatically encrypts OAuth tokens before storing in database
 * and decrypts them when retrieving from database.
 *
 * Uses AES-256-GCM encryption with:
 * - Random IV per encryption
 * - Random salt per encryption
 * - PBKDF2 key derivation (100,000 iterations)
 * - Authentication tag verification
 *
 * Prisma v7: Extends singleton client from client.ts
 * IMPORTANT: Always use the singleton to avoid multiple connection pools
 */
import { prisma as basePrisma } from "@/infrastructure/database/prisma/client";

const authDebugEnabled = process.env.AUTH_DEBUG_LOGS === "true";

type AuthLogLevel = "info" | "warn" | "error";

const authDebugLog = (
  level: AuthLogLevel,
  message: string,
  meta?: Record<string, unknown>,
) => {
  if (!authDebugEnabled) return;
  const payload = meta
    ? Object.fromEntries(
        Object.entries(meta).map(([key, value]) => {
          if (key.toLowerCase().includes("email")) return [key, "[REDACTED]"];
          if (key.toLowerCase().includes("password"))
            return [key, "[REDACTED]"];
          return [key, value];
        }),
      )
    : undefined;

  const prefix = "[Auth Debug]";
  switch (level) {
    case "info":
      console.info(prefix, message, payload);
      break;
    case "warn":
      console.warn(prefix, message, payload);
      break;
    case "error":
      console.error(prefix, message, payload);
      break;
    default:
      console.log(prefix, message, payload);
  }
};

type AdminAssignmentResult =
  | { assigned: true; reason: "assigned" }
  | { assigned: false; reason: "has-role" | "not-first" | "missing-role" };

const assignAdminRoleToFirstUser = async (
  userId: string,
): Promise<AdminAssignmentResult> => {
  try {
    return await prismaWithEncryption.$transaction(
      async (tx) => {
        const existingRoles = await tx.userRole.count({
          where: { userId },
        });

        if (existingRoles > 0) {
          return { assigned: false, reason: "has-role" };
        }

        const userCount = await tx.user.count();
        if (userCount !== 1) {
          return { assigned: false, reason: "not-first" };
        }

        const adminRole = await tx.role.findUnique({
          where: { name: "admin" },
        });

        if (!adminRole) {
          return { assigned: false, reason: "missing-role" };
        }

        await tx.userRole.create({
          data: {
            id: createId(),
            userId,
            roleId: adminRole.id,
            createdAt: new Date(),
          },
        });

        await tx.auditLog.create({
          data: {
            id: createId(),
            userId,
            action: "user_role.assign",
            entityType: "UserRole",
            changes: {
              role: "admin",
              reason: "first-user-auto-admin",
            },
            createdAt: new Date(),
          },
        });

        return { assigned: true, reason: "assigned" };
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      },
    );
  } catch (error) {
    console.error(
      "⚠️ Failed to assign admin role within transaction",
      error instanceof Error ? error : new Error(String(error)),
    );
    return { assigned: false, reason: "missing-role" };
  }
};

// Extend singleton Prisma client with encryption and emailVerified transformation middleware
const prismaWithEncryption = basePrisma.$extends({
  query: {
    // User model: Transform emailVerified boolean to DateTime
    user: {
      async create({ args, query }) {
        authDebugLog("info", "User.create invoked", {
          hasEmailVerified: args.data.emailVerified !== undefined,
          emailVerifiedType: typeof args.data.emailVerified,
        });

        // Transform emailVerified from boolean to DateTime or null
        if (typeof args.data.emailVerified === "boolean") {
          args.data.emailVerified = args.data.emailVerified ? new Date() : null;
        }

        try {
          const result = await query(args);
          authDebugLog("info", "User.create succeeded", {
            id: result.id,
          });
          return result;
        } catch (error) {
          authDebugLog("error", "User.create failed", {
            error: error instanceof Error ? error.message : String(error),
          });
          throw error;
        }
      },

      async update({ args, query }) {
        // Transform emailVerified from boolean to DateTime or null
        if (args.data.emailVerified !== undefined) {
          if (typeof args.data.emailVerified === "boolean") {
            args.data.emailVerified = args.data.emailVerified
              ? new Date()
              : null;
          }
        }
        return query(args);
      },

      async upsert({ args, query }) {
        // Transform emailVerified in both create and update
        if (typeof args.create.emailVerified === "boolean") {
          args.create.emailVerified = args.create.emailVerified
            ? new Date()
            : null;
        }
        if (
          args.update.emailVerified !== undefined &&
          typeof args.update.emailVerified === "boolean"
        ) {
          args.update.emailVerified = args.update.emailVerified
            ? new Date()
            : null;
        }
        return query(args);
      },
    },

    // Account model: Encrypt/decrypt tokens
    account: {
      // Encrypt tokens before creating
      async create({ args, query }) {
        const data = args.data as Record<string, unknown>; // Type assertion for password field compatibility
        authDebugLog("info", "Account.create invoked", {
          provider: data.provider,
          hasPassword: Boolean(data.password),
          type: data.type,
        });

        if (
          args.data.accessToken ||
          args.data.refreshToken ||
          args.data.idToken
        ) {
          authDebugLog("info", "Account.create encrypting OAuth tokens");
          const encrypted = encryptTokens({
            accessToken: args.data.accessToken,
            refreshToken: args.data.refreshToken,
            idToken: args.data.idToken,
          });

          args.data = {
            ...args.data,
            ...encrypted,
          };
        }

        authDebugLog("info", "Account.create final payload keys", {
          keys: Object.keys(args.data),
        });

        try {
          const result = await query(args);
          authDebugLog("info", "Account.create succeeded", {
            id: result.id,
            provider: result.provider,
          });
          return result;
        } catch (error) {
          authDebugLog("error", "Account.create failed", {
            error: error instanceof Error ? error.message : String(error),
            errorName:
              error instanceof Error ? error.constructor.name : typeof error,
          });
          throw error;
        }
      },

      // Encrypt tokens before updating
      async update({ args, query }) {
        if (
          args.data.accessToken ||
          args.data.refreshToken ||
          args.data.idToken
        ) {
          const encrypted = encryptTokens({
            accessToken: args.data.accessToken as string | null | undefined,
            refreshToken: args.data.refreshToken as string | null | undefined,
            idToken: args.data.idToken as string | null | undefined,
          });

          args.data = {
            ...args.data,
            ...encrypted,
          };
        }

        const result = await query(args);

        // Decrypt tokens in result
        if (
          result &&
          (result.accessToken || result.refreshToken || result.idToken)
        ) {
          const decrypted = decryptTokens({
            accessToken: result.accessToken,
            refreshToken: result.refreshToken,
            idToken: result.idToken,
          });

          return {
            ...result,
            ...decrypted,
          };
        }

        return result;
      },

      // Decrypt tokens after finding unique
      async findUnique({ args, query }) {
        const result = await query(args);

        if (
          result &&
          (result.accessToken || result.refreshToken || result.idToken)
        ) {
          const decrypted = decryptTokens({
            accessToken: result.accessToken,
            refreshToken: result.refreshToken,
            idToken: result.idToken,
          });

          return {
            ...result,
            ...decrypted,
          };
        }

        return result;
      },

      // Decrypt tokens after finding first
      async findFirst({ args, query }) {
        const result = await query(args);

        if (
          result &&
          (result.accessToken || result.refreshToken || result.idToken)
        ) {
          const decrypted = decryptTokens({
            accessToken: result.accessToken,
            refreshToken: result.refreshToken,
            idToken: result.idToken,
          });

          return {
            ...result,
            ...decrypted,
          };
        }

        return result;
      },

      // Decrypt tokens after finding many
      async findMany({ args, query }) {
        const results = await query(args);

        return results.map((account) => {
          if (account.accessToken || account.refreshToken || account.idToken) {
            const decrypted = decryptTokens({
              accessToken: account.accessToken,
              refreshToken: account.refreshToken,
              idToken: account.idToken,
            });

            return {
              ...account,
              ...decrypted,
            };
          }

          return account;
        });
      },
    },

    // Session model: Add logging for session creation
    session: {
      async create({ args, query }) {
        authDebugLog("info", "Session.create invoked", {
          hasSessionToken: !!args.data.sessionToken,
        });

        try {
          const result = await query(args);
          authDebugLog("info", "Session.create succeeded", {
            id: result.id,
            expires: result.expires,
          });
          return result;
        } catch (error) {
          authDebugLog("error", "Session.create failed", {
            error: error instanceof Error ? error.message : String(error),
          });
          throw error;
        }
      },
    },
  },
});

// Export type-safe Prisma client
const prisma = prismaWithEncryption as unknown as PrismaClient;

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
  basePath: "/api/auth",

  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),

  account: {
    fields: {
      accountId: "providerAccountId",
      providerId: "provider",
      accessTokenExpiresAt: "expiresAt",
    },
  },

  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    requireEmailVerification: false,
  },

  socialProviders: {
    microsoft: {
      clientId: process.env.MICROSOFT_CLIENT_ID as string,
      clientSecret: process.env.MICROSOFT_CLIENT_SECRET as string,
      tenantId: process.env.MICROSOFT_TENANT_ID || "common",

      // Microsoft Graph API scopes
      scope: [
        "openid",
        "email",
        "profile",
        "offline_access", // Critical for refresh tokens
      ],

      // Store additional data from Microsoft
      mapProfileToUser: (profile) => ({
        email: profile.email || profile.userPrincipalName,
        name: profile.displayName,
        image: profile.picture || "",
        // Better Auth will convert boolean true to a timestamp when persisting
        emailVerified: true,
      }),
    },
  },

  session: {
    fields: {
      token: "sessionToken",
      expiresAt: "expires",
    },
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // 5 minutes
    },
  },

  advanced: {
    database: {
      generateId: () => {
        // Use cuid2 for better collision resistance and sortability
        return createId();
      },
    },
  },

  trustedOrigins: [process.env.BETTER_AUTH_URL || "http://localhost:3000"],

  plugins: [
    nextCookies(),
    lastLoginMethod({
      // Use default logic to track login methods
      customResolveMethod: () => null,
    }),
  ],

  // First-user admin hook
  // Automatically assigns admin role to the first user who signs in
  hooks: {
    after: createAuthMiddleware(async (ctx) => {
      const path = ctx.path || "";

      // Only process authentication events
      if (
        !path.includes("/sign-in") &&
        !path.includes("/sign-up") &&
        !path.includes("/callback")
      ) {
        return;
      }

      // Get user from context
      const userId = ctx.context.newSession?.user?.id;
      if (!userId) return;

      // Check if user already has roles
      const result = await assignAdminRoleToFirstUser(userId);

      if (result.assigned) {
        console.log(
          `✅ First user ${userId} automatically assigned admin role`,
        );
        return;
      }

      if (result.reason === "missing-role") {
        console.error("⚠️ Admin role not found. Run: npm run db:seed");
      }
    }),
  },
});

export type Session = typeof auth.$Infer.Session;
export type User = typeof auth.$Infer.Session.user;
