import type { IEmailService } from "@/core/services/email.service.interface";
import type { ILoggerService } from "@/core/services/logger.service.interface";
import type { IIdGenerator } from "@/core/services/id-generator.service.interface";
import { getContainer } from "@/di/container";
import { DI_TOKENS } from "@/di/types";
import type { PrismaClient } from "@/generated/prisma/client";
import { decryptTokens, encryptTokens } from "@/lib/auth/encryption";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { APIError, createAuthMiddleware } from "better-auth/api";
import { lastLoginMethod, twoFactor } from "better-auth/plugins";
import { nextCookies } from "./plugins/next-cookies";

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
// Auth Prisma provider lives in infrastructure; we resolve via DI to avoid direct client imports.
import { PrismaAuthService } from "@/infrastructure/services/auth/prisma-auth.service";

const authDebugEnabled = process.env.AUTH_DEBUG_LOGS === "true";
const BOOTSTRAP_BYPASS_HEADER = "x-techhub-setup-bootstrap";
const SYSTEM_ADMIN_ROLE_NAME = "system-administrator";

type AuthLogLevel = "info" | "warn" | "error";

/**
 * Get logger from DI container
 * Lazy initialization to avoid circular dependencies
 */
let _logger: ILoggerService | null = null;
function getLogger(): ILoggerService {
  if (!_logger) {
    _logger = getContainer().get<ILoggerService>(DI_TOKENS.ILoggerService);
  }
  return _logger;
}

/**
 * Get ID generator from DI container
 * Lazy initialization to avoid circular dependencies
 */
let _idGenerator: IIdGenerator | null = null;
function getIdGenerator(): IIdGenerator {
  if (!_idGenerator) {
    _idGenerator = getContainer().get<IIdGenerator>(DI_TOKENS.IIdGenerator);
  }
  return _idGenerator;
}

/**
 * Get extended Prisma client with encryption middleware
 * Lazy initialization to avoid circular dependencies and build-time container resolution
 */
let _prismaWithEncryption: PrismaClient | null = null;
function getPrismaWithEncryption(): PrismaClient {
  if (!_prismaWithEncryption) {
    _prismaWithEncryption = getContainer()
      .get<PrismaAuthService>(PrismaAuthService)
      .prisma.$extends({
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
                args.data.emailVerified = args.data.emailVerified
                  ? new Date()
                  : null;
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
                    error instanceof Error
                      ? error.constructor.name
                      : typeof error,
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
                  accessToken: args.data.accessToken as
                    | string
                    | null
                    | undefined,
                  refreshToken: args.data.refreshToken as
                    | string
                    | null
                    | undefined,
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
                if (
                  account.accessToken ||
                  account.refreshToken ||
                  account.idToken
                ) {
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
      }) as unknown as PrismaClient;
  }
  return _prismaWithEncryption;
}

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

  // Use structured logging via ILoggerService
  const logger = getLogger();
  switch (level) {
    case "info":
      logger.info(`[Auth Debug] ${message}`, payload);
      break;
    case "warn":
      logger.warn(`[Auth Debug] ${message}`, payload);
      break;
    case "error":
      logger.error(`[Auth Debug] ${message}`, new Error(message), payload);
      break;
    default:
      logger.debug(`[Auth Debug] ${message}`, payload);
  }
};

type PersonLinkResult =
  | { status: "already-linked"; personId: string }
  | { status: "linked-existing"; personId: string }
  | { status: "created"; personId: string }
  | {
      status: "blocked";
      reason:
        | "missing-org-unit"
        | "missing-viewer-role"
        | "conflict"
        | "person-not-found"
        | "person-inactive"
        | "person-excluded";
      message: string;
    };

/**
 * Validates that a Person record exists and is eligible for login.
 * Used for SSO (Microsoft OAuth) to restrict login to pre-synced employees.
 *
 * @param email - The email to check
 * @returns Validation result with Person ID if valid, or error reason if blocked
 */
const validatePersonForSSO = async (
  email: string,
): Promise<
  | {
      valid: true;
      personId: string;
      person: { firstName: string; lastName: string };
    }
  | {
      valid: false;
      reason: "person-not-found" | "person-inactive" | "person-excluded";
      message: string;
    }
> => {
  const normalizedEmail = email.toLowerCase();

  const person = await getPrismaWithEncryption().person.findFirst({
    where: {
      email: { equals: normalizedEmail, mode: "insensitive" },
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      isActive: true,
      isExcluded: true,
    },
  });

  if (!person) {
    return {
      valid: false,
      reason: "person-not-found",
      message:
        "No employee record found for this email. Please contact IT to be added to the system.",
    };
  }

  if (!person.isActive) {
    return {
      valid: false,
      reason: "person-inactive",
      message:
        "Your employee account has been deactivated. Please contact IT for assistance.",
    };
  }

  if (person.isExcluded) {
    return {
      valid: false,
      reason: "person-excluded",
      message:
        "This account is not permitted to access the system. Please contact IT for assistance.",
    };
  }

  return {
    valid: true,
    personId: person.id,
    person: { firstName: person.firstName, lastName: person.lastName },
  };
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

/**
 * Get the email service from DI container
 * Uses lazy resolution to avoid circular dependencies during module initialization
 */
const getEmailService = (): IEmailService => {
  const container = getContainer();
  return container.get<IEmailService>(DI_TOKENS.IEmailService);
};

const ensurePersonLinkedToUser = async (
  user: {
    id: string;
    email?: string | null;
    name?: string | null;
  },
  options: { allowCreation?: boolean } = { allowCreation: true },
): Promise<PersonLinkResult> => {
  const { allowCreation = true } = options;
  const normalizedEmail = user.email?.toLowerCase() ?? null;

  try {
    return await getPrismaWithEncryption().$transaction(
      async (
        tx: Omit<
          PrismaClient,
          "$extends" | "$transaction" | "$disconnect" | "$connect" | "$on"
        >,
      ): Promise<PersonLinkResult> => {
        // Already linked
        const existingPerson = await tx.person.findFirst({
          where: { userId: user.id },
        });
        if (existingPerson) {
          return { status: "already-linked", personId: existingPerson.id };
        }

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

        // If creation is not allowed (SSO), return blocked
        if (!allowCreation) {
          return {
            status: "blocked",
            reason: "person-not-found",
            message:
              "No employee record found for this email. SSO requires an existing Person record.",
          };
        }

        // Create a new person using defaults (only for email/password auth)
        const orgUnit = await tx.organizationUnit.findFirst({
          orderBy: { createdAt: "asc" },
        });
        if (!orgUnit) {
          return {
            status: "blocked",
            reason: "missing-org-unit",
            message:
              "No organization units found – seed foundation data first.",
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

        // Use upsert to handle race conditions where person with email already exists
        const createdPerson = await tx.person.upsert({
          where: { email },
          create: {
            id: getIdGenerator().generateId(),
            userId: user.id,
            firstName,
            lastName,
            email,
            orgUnitId: orgUnit.id,
            isActive: true,
          },
          update: {
            // If person already exists, link to user
            userId: user.id,
            firstName,
            lastName,
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
              id: getIdGenerator().generateId(),
              userId: user.id,
              roleId: viewerRole.id,
              createdAt: new Date(),
            },
          });
        }

        return { status: "created", personId: createdPerson.id };
      },
    );
  } catch (error) {
    getLogger().error(
      "Failed to ensure person linkage",
      error instanceof Error ? error : new Error(String(error)),
      {
        userId: user.id,
        userEmail: normalizedEmail ?? user.email ?? "unknown",
      },
    );
    return {
      status: "blocked",
      reason: "conflict",
      message: "Unexpected error linking user to person.",
    };
  }
};

/**
 * Better Auth instance - lazy initialization
 * Avoids DI container resolution during module evaluation.
 */
const createAuth = () =>
  betterAuth({
    baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
    basePath: "/api/auth",

    database: prismaAdapter(
      getPrismaWithEncryption() as unknown as PrismaClient,
      {
        provider: "postgresql",
      },
    ),

    account: {
      fields: {
        accountId: "providerAccountId",
        providerId: "provider",
        accessTokenExpiresAt: "expiresAt",
      },
    },

    // Email/Password authentication (always enabled to allow login)
    // Registration is controlled via UI (NEXT_PUBLIC_ENABLE_EMAIL_REGISTRATION)
    // This ensures existing users can still log in even when registration is disabled
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 8,
      requireEmailVerification: false, // Keep false - verification is optional (badge indicator only)
      resetPasswordTokenExpiresIn: 60 * 60, // 1 hour
      sendResetPassword: async ({ user, url }) => {
        const emailService = getEmailService();
        await emailService.sendTemplatedEmail(user.email, "password-reset", {
          name: user.name || "User",
          resetLink: url,
          expiresIn: "1 hour",
        });
      },
    },

    // Email verification configuration (optional - doesn't block access)
    // Auto-sends on signup, users can resend from profile
    emailVerification: {
      sendOnSignUp: true,
      autoSignInAfterVerification: true,
      expiresIn: 60 * 60 * 24, // 24 hours
      sendVerificationEmail: async ({ user, url }) => {
        const emailService = getEmailService();
        await emailService.sendTemplatedEmail(
          user.email,
          "email-verification",
          {
            name: user.name || "User",
            verificationLink: url,
            expiresIn: "24 hours",
          },
        );
      },
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
        maxAge: 10 * 60, // 10 minutes (increased for internal enterprise app)
      },
    },

    // Rate limiting configuration - relaxed for internal enterprise app
    // Default: 100 req/10s is too restrictive for SSR + client session checks
    rateLimit: {
      enabled: true,
      window: 60, // 60 seconds window
      max: 500, // 500 requests per minute globally
      storage: "memory", // Memory storage for single-server PM2 deployment
      customRules: {
        // Session endpoint - high limit for SSR/client needs
        "/get-session": {
          window: 60,
          max: 2000, // Very generous for internal app
        },
        // Auth endpoints - keep restrictive for security
        "/sign-in/*": {
          window: 60,
          max: 20, // 20 sign-in attempts per minute
        },
        "/sign-up/*": {
          window: 60,
          max: 10, // 10 sign-up attempts per minute
        },
        "/reset-password/*": {
          window: 300, // 5 minutes
          max: 5, // 5 reset attempts per 5 minutes
        },
        "/callback/*": {
          window: 60,
          max: 50, // OAuth callbacks
        },
      },
    },

    advanced: {
      database: {
        generateId: () => {
          // Use cuid2 for better collision resistance and sortability
          return getIdGenerator().generateId();
        },
      },
    },

    trustedOrigins: process.env.TRUSTED_ORIGINS
      ? process.env.TRUSTED_ORIGINS.split(",").map((o) => o.trim())
      : [process.env.BETTER_AUTH_URL || "http://localhost:3000"],

    plugins: [
      nextCookies(),
      lastLoginMethod({
        // Use default logic to track login methods
        customResolveMethod: () => null,
      }),
      twoFactor({
        issuer: "TechHub.barq",
        skipVerificationOnEnable: false,
      }),
    ],

    // Person entity linkage hook
    // Automatically creates/links Person entity for authenticated users
    // SSO (Microsoft OAuth) requires Person to exist, be active, and not excluded
    hooks: {
      before: createAuthMiddleware(async (ctx) => {
        const path = ctx.path || "";
        const isBootstrapSignUp = path.includes("/sign-up/email");
        const isSocialSignIn = path.includes("/sign-in/social");

        if (!isBootstrapSignUp && !isSocialSignIn) {
          return;
        }

        if (
          isBootstrapSignUp &&
          ctx.headers?.get(BOOTSTRAP_BYPASS_HEADER) === "true"
        ) {
          return;
        }

        const hasAssignedAdmin =
          await getPrismaWithEncryption().userRole.findFirst({
            where: { role: { name: SYSTEM_ADMIN_ROLE_NAME } },
            select: { id: true },
          });

        if (hasAssignedAdmin) {
          return;
        }

        throw new APIError("FORBIDDEN", {
          message: isSocialSignIn
            ? "Complete initial setup at /setup before using Microsoft sign-in."
            : "Complete initial setup at /setup before creating the first account.",
        });
      }),
      after: createAuthMiddleware(async (ctx) => {
        const path = ctx.path || "";
        const isOAuthCallback = path.includes("/callback/microsoft");
        const isEmailAuth =
          path.includes("/sign-in/email") || path.includes("/sign-up/email");

        authDebugLog("info", "Better Auth hook fired", {
          path,
          isOAuthCallback,
          isEmailAuth,
          hasNewSession: !!ctx.context.newSession,
          hasUser: !!ctx.context.newSession?.user,
        });

        // Only process authentication events
        if (
          !path.includes("/sign-in") &&
          !path.includes("/sign-up") &&
          !path.includes("/callback")
        ) {
          authDebugLog("info", "Skipping hook - path not an auth event", {
            path,
          });
          return;
        }

        // Get user from context
        const user = ctx.context.newSession?.user;
        if (!user?.id) {
          authDebugLog(
            "warn",
            "Skipping hook - no user in newSession context",
            {
              path,
            },
          );
          return;
        }

        // For OAuth (Microsoft SSO), validate Person exists and is eligible
        if (isOAuthCallback && user.email) {
          authDebugLog("info", "Validating Person for SSO login", {
            userId: user.id,
            userEmail: user.email,
          });

          const validation = await validatePersonForSSO(user.email);

          if (!validation.valid) {
            // Person not found, inactive, or excluded - block access
            getLogger().warn("SSO login blocked - Person validation failed", {
              userEmail: user.email,
              reason: validation.reason,
              message: validation.message,
            });
            authDebugLog(
              "warn",
              "SSO login blocked - Person validation failed",
              {
                userId: user.id,
                userEmail: user.email,
                reason: validation.reason,
              },
            );

            // Clean up: Delete the session, account, and user that were just created
            try {
              // Delete session first (foreign key constraint)
              await getPrismaWithEncryption().session.deleteMany({
                where: { userId: user.id },
              });

              // Delete account (OAuth provider link)
              await getPrismaWithEncryption().account.deleteMany({
                where: { userId: user.id },
              });

              // Delete the user record
              await getPrismaWithEncryption().user.delete({
                where: { id: user.id },
              });

              authDebugLog("info", "Cleaned up unauthorized SSO user records", {
                userId: user.id,
              });
            } catch (cleanupError) {
              getLogger().error(
                "Failed to clean up unauthorized SSO user records",
                cleanupError instanceof Error
                  ? cleanupError
                  : new Error(String(cleanupError)),
                { userId: user.id },
              );
            }

            // Redirect to error page with encoded message
            const errorUrl = new URL(
              "/auth/blocked",
              process.env.BETTER_AUTH_URL || "http://localhost:3000",
            );
            errorUrl.searchParams.set("reason", validation.reason);
            errorUrl.searchParams.set("message", validation.message);

            return ctx.redirect(errorUrl.toString());
          }

          // Person is valid - proceed to link
          authDebugLog("info", "SSO Person validation passed", {
            userId: user.id,
            personId: validation.personId,
            personName: `${validation.person.firstName} ${validation.person.lastName}`,
          });
        }

        authDebugLog("info", "Processing person linkage for user", {
          userId: user.id,
          userEmail: user.email,
        });

        // For OAuth: only link existing Person (no creation)
        // For Email/Password: allow creation (for initial admin setup)
        const linkResult = await ensurePersonLinkedToUser(user, {
          allowCreation: !isOAuthCallback,
        });

        if (linkResult.status === "blocked") {
          // For OAuth, this shouldn't happen as we validated above
          // For email/password, log and continue (don't block login, just Person linkage)
          getLogger().error(
            "Failed to auto-link user to person",
            new Error(linkResult.message ?? "Unknown error"),
            {
              userId: user.id,
              userEmail: user.email,
              reason: linkResult.reason,
            },
          );
          return;
        }

        if (linkResult.status === "created") {
          getLogger().info("Person created and linked for user", {
            userId: user.id,
            userEmail: user.email,
            personId: linkResult.personId,
          });
          authDebugLog("info", "Person created and linked for user", {
            userId: user.id,
            personId: linkResult.personId,
          });
        } else if (linkResult.status === "linked-existing") {
          getLogger().info("Person linked for user", {
            userId: user.id,
            userEmail: user.email,
            personId: linkResult.personId,
          });
          authDebugLog("info", "Person linked for user", {
            userId: user.id,
            personId: linkResult.personId,
          });
        } else if (linkResult.status === "already-linked") {
          authDebugLog("info", "Person already linked for user", {
            userId: user.id,
            personId: linkResult.personId,
          });
        }
      }),
    },
  });

type AuthInstance = ReturnType<typeof createAuth>;
let _auth: AuthInstance | null = null;
export function getAuth(): AuthInstance {
  if (!_auth) {
    _auth = createAuth();
  }

  return _auth;
}

export type Session = AuthInstance["$Infer"]["Session"];
export type User = AuthInstance["$Infer"]["Session"]["user"];
