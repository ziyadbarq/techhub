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
  | {
      assigned: false;
      reason: "has-admin" | "not-first" | "missing-role";
    };

const SYSTEM_ADMIN_ROLE_NAME = "system-administrator";

type PersonLinkResult =
  | { status: "already-linked"; personId: string }
  | { status: "linked-existing"; personId: string }
  | { status: "created"; personId: string }
  | {
      status: "blocked";
      reason: "missing-org-unit" | "missing-viewer-role" | "conflict";
      message: string;
    };

const assignAdminRoleToFirstUser = async (
  userId: string,
): Promise<AdminAssignmentResult> => {
  try {
    return await prismaWithEncryption.$transaction(
      async (tx) => {
        const userCount = await tx.user.count();
        if (userCount !== 1) {
          return { assigned: false, reason: "not-first" };
        }

        const adminRole = await tx.role.findUnique({
          where: { name: SYSTEM_ADMIN_ROLE_NAME },
        });

        if (!adminRole) {
          return { assigned: false, reason: "missing-role" };
        }

        const hasAdminRole = await tx.userRole.findUnique({
          where: {
            userId_roleId: {
              userId,
              roleId: adminRole.id,
            },
          },
        });

        if (hasAdminRole) {
          return { assigned: false, reason: "has-admin" };
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
              role: SYSTEM_ADMIN_ROLE_NAME,
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
      "⚠️ Failed to assign system administrator role within transaction",
      error instanceof Error ? error : new Error(String(error)),
    );
    return { assigned: false, reason: "missing-role" };
  }
};

const parseName = (name?: string | null) => {
  if (!name) return { firstName: "New", lastName: "User" };
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return { firstName: parts[0] || "New", lastName: "User" };
  }
  const [first, ...rest] = parts;
  return { firstName: first || "New", lastName: rest.join(" ") || "User" };
};

const ensurePersonLinkedToUser = async (user: {
  id: string;
  email?: string | null;
  name?: string | null;
}): Promise<PersonLinkResult> => {
  try {
    return await prismaWithEncryption.$transaction(async (tx) => {
      // Already linked
      const existingPerson = await tx.person.findFirst({
        where: { userId: user.id },
      });
      if (existingPerson) {
        return { status: "already-linked", personId: existingPerson.id };
      }

      const normalizedEmail = user.email?.toLowerCase() ?? null;

      // Try to link by email if a person exists without a userId
      if (normalizedEmail) {
        const personByEmail = await tx.person.findFirst({
          where: {
            email: { equals: normalizedEmail, mode: "insensitive" },
          },
        });

        if (personByEmail) {
          if (personByEmail.userId && personByEmail.userId !== user.id) {
            return {
              status: "blocked",
              reason: "conflict",
              message:
                "Person record already linked to a different user. Manual cleanup required.",
            };
          }

          const updated = await tx.person.update({
            where: { id: personByEmail.id },
            data: { userId: user.id },
          });

          return { status: "linked-existing", personId: updated.id };
        }
      }

      // Create a new person using defaults
      const orgUnit = await tx.organizationUnit.findFirst({
        orderBy: { createdAt: "asc" },
      });
      if (!orgUnit) {
        return {
          status: "blocked",
          reason: "missing-org-unit",
          message: "No organization units found – seed foundation data first.",
        };
      }

      const viewerRole = await tx.role.findUnique({
        where: { name: "viewer" },
      });
      if (!viewerRole) {
        return {
          status: "blocked",
          reason: "missing-viewer-role",
          message: "Viewer role not found – seed RBAC data first.",
        };
      }

      const { firstName, lastName } = parseName(user.name ?? user.email);
      const email =
        normalizedEmail ??
        // Fallback email for environments without identity provider email
        `${user.id}@local.barq`;

      const createdPerson = await tx.person.create({
        data: {
          id: createId(),
          userId: user.id,
          firstName,
          lastName,
          email,
          orgUnitId: orgUnit.id,
          primaryRoleId: viewerRole.id,
          isActive: true,
        },
      });

      // Ensure the user has at least the viewer role for permissions
      const existingViewerRole = await tx.userRole.findUnique({
        where: {
          userId_roleId: {
            userId: user.id,
            roleId: viewerRole.id,
          },
        },
      });

      if (!existingViewerRole) {
        await tx.userRole.create({
          data: {
            id: createId(),
            userId: user.id,
            roleId: viewerRole.id,
            createdAt: new Date(),
          },
        });
      }

      return { status: "created", personId: createdPerson.id };
    });
  } catch (error) {
    console.error(
      "[Auth Debug] Failed to ensure person linkage",
      error instanceof Error ? error.message : String(error),
    );
    return {
      status: "blocked",
      reason: "conflict",
      message: "Unexpected error linking user to person.",
    };
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

  // First-user system administrator hook
  // Automatically assigns system administrator role to the first user who signs in
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
      const user = ctx.context.newSession?.user;
      if (!user?.id) return;

      const linkResult = await ensurePersonLinkedToUser(user);
      if (linkResult.status === "blocked") {
        console.error(
          "⚠️ Failed to auto-link user to person",
          linkResult.message,
          linkResult.reason,
        );
        return;
      }

      if (linkResult.status === "created") {
        authDebugLog("info", "Person created and linked for user", {
          userId: user.id,
          personId: linkResult.personId,
        });
      } else if (linkResult.status === "linked-existing") {
        authDebugLog("info", "Person linked for user", {
          userId: user.id,
          personId: linkResult.personId,
        });
      }

      // Check if user already has roles
      const result = await assignAdminRoleToFirstUser(user.id);

      if (result.assigned) {
        console.log(
          `✅ First user ${user.id} automatically assigned admin role`,
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
