/**
 * Setup Controller
 * Server actions for first-time setup (System Administrator role assignment)
 */

"use server";

import { getContainer, ensureModuleLoaded } from "@/di/container";
import { DI_TOKENS } from "@/di/types";
import type { ActionResponse } from "./types";
import { handleControllerError } from "./error-handler";
import type { CheckFirstAdminUseCase } from "@/core/use-cases/rbac/check-first-admin.use-case";
import { type CheckFirstAdminResult } from "@/core/use-cases/rbac/check-first-admin.use-case";
import type { AssignFirstAdminUseCase } from "@/core/use-cases/rbac/assign-first-admin.use-case";
import { type AssignFirstAdminResult } from "@/core/use-cases/rbac/assign-first-admin.use-case";
import { getCurrentUserId } from "@/lib/auth/session";
import { revalidatePath } from "next/cache";
// eslint-disable-next-line @typescript-eslint/no-restricted-imports -- Setup actions run before DI container is initialized; direct Prisma access is intentional
import { prisma } from "@/infrastructure/database/prisma/client";
import { registerSchema, type RegisterInput } from "@/lib/auth/validation";
import { EMAIL_VERIFICATION_SUCCESS_PATH } from "@/lib/auth/constants";
import { getAuth } from "@/interface-adapters/auth/better-auth";
import type { CheckSystemHealthUseCase } from "@/core/use-cases/system-setup/check-system-health.use-case";
import type { GetMigrationStatusUseCase } from "@/core/use-cases/system-setup/get-migration-status.use-case";
import type { ResetDatabaseUseCase } from "@/core/use-cases/system-setup/reset-database.use-case";
import type { GetSystemInfoUseCase } from "@/core/use-cases/system-setup/get-system-info.use-case";
import type {
  SendTestEmailUseCase,
  SendTestEmailDto,
  SendTestEmailResultDto,
} from "@/core/use-cases/system-setup/send-test-email.use-case";
import type {
  SystemHealthCheckDto,
  MigrationStatusDto,
  SystemInfoDto,
} from "@/interface-adapters/dtos/system-setup.dto";
import type { ResetDatabaseResult } from "@/core/use-cases/system-setup";

const SYSTEM_ADMIN_ROLE_NAME = "system-administrator";

async function ensureSystemHealthIntegrationModulesLoaded(): Promise<void> {
  getContainer();

  await ensureModuleLoaded("microsoft-graph");
}

/**
 * Check if first system admin setup is needed
 */
export async function checkFirstAdminAction(): Promise<
  ActionResponse<CheckFirstAdminResult>
> {
  try {
    const container = getContainer();
    const checkFirstAdmin = container.get<CheckFirstAdminUseCase>(
      DI_TOKENS.CheckFirstAdminUseCase,
    );

    const result = await checkFirstAdmin.execute();

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "checkFirstAdminAction" },
      "Failed to check system administrator status",
    );
  }
}

/**
 * Assign System Administrator role to current user (first-time setup)
 */
export async function assignFirstAdminAction(): Promise<
  ActionResponse<AssignFirstAdminResult>
> {
  try {
    // Get current user ID
    const userId = await getCurrentUserId();
    if (!userId) {
      return {
        success: false,
        error: "Not authenticated",
      };
    }

    const container = getContainer();
    const assignFirstAdmin = container.get<AssignFirstAdminUseCase>(
      DI_TOKENS.AssignFirstAdminUseCase,
    );

    const result = await assignFirstAdmin.execute({
      userId,
      metadata: {
        // You could add IP/UA tracking here if needed
      },
    });

    if (result.success) {
      // Revalidate to update permissions
      revalidatePath("/");
      revalidatePath("/setup");
      revalidatePath("/admin");
    }

    if (result.success) {
      return { success: true as const, data: result };
    }

    const errorMessage =
      result.message === "System Administrator already exists."
        ? "Admin already exists"
        : result.message;

    return { success: false as const, error: errorMessage };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "assignFirstAdminAction" },
      "Failed to assign System Administrator role",
    );
  }
}

export interface CreateFirstAdminResult {
  userId: string;
  email: string;
  adminAssigned: boolean;
}

/**
 * Atomic first-admin creation: signup + admin role assignment in one server action.
 *
 * Guards:
 * - Refuses if any users already exist (unless exactly 1 user exists with no admin — recovery path)
 * - Validates input with registerSchema
 * - Creates user via Better Auth server API
 * - Assigns system-administrator role via DI use case
 * - If role assignment fails after user creation, deletes the user (rollback)
 *
 * The client only needs to call signIn.email() after this succeeds to establish a session.
 */
export async function createFirstAdminAction(
  input: RegisterInput,
): Promise<ActionResponse<CreateFirstAdminResult>> {
  try {
    // Validate input server-side
    const parsed = registerSchema.safeParse(input);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message || "Invalid input";
      return { success: false, error: firstError };
    }

    const { email, password, name } = parsed.data;
    const normalizedEmail = email.toLowerCase();

    // Check current state
    const [userCount, existingAdmin] = await Promise.all([
      prisma.user.count(),
      prisma.userRole.findFirst({
        where: { role: { name: SYSTEM_ADMIN_ROLE_NAME } },
      }),
    ]);

    // If admin already exists, refuse
    if (existingAdmin) {
      return {
        success: false,
        error: "System administrator already exists.",
      };
    }

    // Recovery path: exactly 1 user exists but has no admin role
    // This handles the case where signup succeeded but admin assignment failed previously
    if (userCount === 1) {
      const existingUser = await prisma.user.findFirst({
        select: { id: true, email: true },
      });
      if (existingUser) {
        if (existingUser.email.toLowerCase() !== normalizedEmail) {
          return {
            success: false,
            error: "Use the existing account email to complete setup recovery.",
          };
        }

        // Assign admin role to the existing user
        const adminResult = await assignAdminRole(existingUser.id);
        if (!adminResult.success) {
          return {
            success: false,
            error:
              adminResult.error ||
              "Failed to assign admin role to existing user.",
          };
        }

        return {
          success: true,
          data: {
            userId: existingUser.id,
            email: existingUser.email,
            adminAssigned: true,
          },
        };
      }
    }

    // Normal path: no users exist
    if (userCount > 0) {
      return {
        success: false,
        error: "Setup is no longer available. Users already exist.",
      };
    }

    // Step 1: Create user via Better Auth server API
    // This handles password hashing and account record creation properly
    let userId: string;
    try {
      const auth = getAuth();
      const signUpResult = await auth.api.signUpEmail({
        body: {
          email: normalizedEmail,
          password,
          name: name || "",
          callbackURL: EMAIL_VERIFICATION_SUCCESS_PATH,
        },
        headers: new Headers({
          "x-techhub-setup-bootstrap": "true",
        }),
      });

      if (!signUpResult?.user?.id) {
        return {
          success: false,
          error: "Failed to create user account.",
        };
      }
      userId = signUpResult.user.id;
    } catch (signUpError) {
      const message =
        signUpError instanceof Error
          ? signUpError.message
          : "Failed to create user account.";
      return { success: false, error: message };
    }

    // Step 2: Assign admin role
    const adminResult = await assignAdminRole(userId);

    if (!adminResult.success) {
      // Rollback: delete the user since admin assignment failed
      try {
        await prisma.session.deleteMany({ where: { userId } });
        await prisma.account.deleteMany({ where: { userId } });
        await prisma.user.delete({ where: { id: userId } });
      } catch {
        // Best-effort cleanup — if this fails, recovery path handles it on retry
      }

      return {
        success: false,
        error:
          adminResult.error ||
          "Account created but admin role assignment failed. Please try again.",
      };
    }

    revalidatePath("/");
    revalidatePath("/setup");

    return {
      success: true,
      data: {
        userId,
        email: normalizedEmail,
        adminAssigned: true,
      },
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "createFirstAdminAction" },
      "Failed to create first administrator",
    );
  }
}

/**
 * Internal helper: assign system-administrator role to a user via DI use case.
 */
async function assignAdminRole(
  userId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const container = getContainer();
    const assignFirstAdmin = container.get<AssignFirstAdminUseCase>(
      DI_TOKENS.AssignFirstAdminUseCase,
    );

    const result = await assignFirstAdmin.execute({
      userId,
      metadata: {},
    });

    if (result.success) {
      revalidatePath("/");
      revalidatePath("/setup");
      revalidatePath("/admin");
      return { success: true };
    }

    return { success: false, error: result.message };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to assign admin role.";
    return { success: false, error: message };
  }
}

// ============================================================================
// Initial Setup Wizard Actions (Public - no auth required)
// ============================================================================

export interface SetupStatus {
  needsSetup: boolean;
  hasAssignedAdmin: boolean;
  userCount: number;
  recoveryMode: boolean;
  canSeed: boolean;
  canCreateAdmin: boolean;
  existingUserEmail: string | null;
  rolesSeeded: boolean;
  foundationSeeded: boolean;
  featureFlagsSeeded: boolean;
}

async function getSetupStatus(): Promise<SetupStatus> {
  const [userCount, adminRole, orgUnitCount, featureFlagCount, assignedAdmin] =
    await Promise.all([
      prisma.user.count(),
      prisma.role.findUnique({ where: { name: SYSTEM_ADMIN_ROLE_NAME } }),
      prisma.organizationUnit.count(),
      prisma.featureFlag.count(),
      prisma.userRole.findFirst({
        where: { role: { name: SYSTEM_ADMIN_ROLE_NAME } },
        select: { id: true },
      }),
    ]);

  const hasAssignedAdmin = assignedAdmin !== null;
  const recoveryMode = userCount === 1 && !hasAssignedAdmin;
  let existingUserEmail: string | null = null;

  if (recoveryMode) {
    const existingUser = await prisma.user.findFirst({
      select: { email: true },
    });
    existingUserEmail = existingUser?.email ?? null;
  }

  return {
    needsSetup: !hasAssignedAdmin,
    hasAssignedAdmin,
    userCount,
    recoveryMode,
    canSeed: userCount === 0,
    canCreateAdmin: userCount === 0 || recoveryMode,
    existingUserEmail,
    rolesSeeded: adminRole !== null,
    foundationSeeded: orgUnitCount > 0,
    featureFlagsSeeded: featureFlagCount > 0,
  };
}

/**
 * Check setup prerequisites status (no auth required)
 * Returns whether the system needs initial setup and what prerequisites are met
 */
export async function checkSetupStatusAction(): Promise<
  ActionResponse<SetupStatus>
> {
  try {
    return {
      success: true,
      data: await getSetupStatus(),
    };
  } catch (error) {
    // Surface a helpful message for DB connection failures
    const isConnectionError =
      error instanceof Error &&
      /Can't reach|connect|ECONNREFUSED|ETIMEDOUT/i.test(error.message);

    const message = isConnectionError
      ? "Could not connect to the database. Please check your DATABASE_URL and ensure PostgreSQL is running."
      : "Failed to check setup status";

    return handleControllerError(
      error,
      { function: "checkSetupStatusAction" },
      message,
    );
  }
}

export type SeedPresetOption = "production" | "dev";

/**
 * Run database seeds with selected preset (no auth required, guarded by zero-user check)
 * - production: Config/reference data only (roles, org units, asset config, CMDB)
 * - dev: Full demo environment with sample persons, assets, services, etc.
 */
export async function runSetupSeedAction(
  preset: SeedPresetOption = "production",
): Promise<ActionResponse<{ message: string }>> {
  try {
    // Guard: refuse if any users exist
    const userCount = await prisma.user.count();
    if (userCount > 0) {
      return {
        success: false,
        error: "Setup is no longer available. Users already exist.",
      };
    }

    // Validate preset to prevent command injection
    const validPresets: SeedPresetOption[] = ["production", "dev"];
    if (!validPresets.includes(preset)) {
      return {
        success: false,
        error: `Invalid seed preset: ${preset}`,
      };
    }

    // Run seed as a child process — seed files use .js import extensions
    // (ESM convention for tsx runtime) which are incompatible with Next.js bundling.
    // No dotenv wrapper: env vars are already in process.env (loaded by Next.js,
    // Docker env, K8s ConfigMap/Secrets, or Spring Cloud Config). Child process
    // inherits process.env from the parent automatically.
    const { execSync } = await import("child_process");
    execSync(
      `node node_modules/tsx/dist/cli.mjs src/infrastructure/database/prisma/seed.ts ${preset}`,
      {
        cwd: process.cwd(),
        stdio: "pipe",
        timeout: 300_000,
      },
    );

    const presetDescriptions: Record<SeedPresetOption, string> = {
      production:
        "Database seeded with production configuration (roles, permissions, foundation data).",
      dev: "Database seeded with full development data (config + demo persons, assets, services).",
    };

    return {
      success: true,
      data: { message: presetDescriptions[preset] },
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "runSetupSeedAction", preset },
      "Failed to seed database",
    );
  }
}

// ============================================================================
// System Setup Actions (New comprehensive setup system)
// ============================================================================

/**
 * Check system health
 */
export async function checkSystemHealthAction(): Promise<
  ActionResponse<SystemHealthCheckDto>
> {
  try {
    await ensureSystemHealthIntegrationModulesLoaded();

    const container = getContainer();
    const checkSystemHealth = container.get<CheckSystemHealthUseCase>(
      DI_TOKENS.CheckSystemHealthUseCase,
    );

    const result = await checkSystemHealth.execute();

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "checkSystemHealthAction" },
      "Failed to check system health",
    );
  }
}

/**
 * Get migration status
 */
export async function getMigrationStatusAction(): Promise<
  ActionResponse<MigrationStatusDto>
> {
  try {
    const container = getContainer();
    const getMigrationStatus = container.get<GetMigrationStatusUseCase>(
      DI_TOKENS.GetMigrationStatusUseCase,
    );

    const result = await getMigrationStatus.execute();

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "getMigrationStatusAction" },
      "Failed to get migration status",
    );
  }
}

/**
 * Reset database (DEV ONLY)
 */
export async function resetDatabaseAction(
  reseed: boolean = false,
): Promise<ActionResponse<ResetDatabaseResult>> {
  try {
    const container = getContainer();
    const resetDatabase = container.get<ResetDatabaseUseCase>(
      DI_TOKENS.ResetDatabaseUseCase,
    );

    const result = await resetDatabase.execute({ reseed });

    if (result.success) {
      revalidatePath("/");
    }

    return result.success
      ? { success: true as const, data: result }
      : { success: false as const, error: result.message };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "resetDatabaseAction" },
      "Failed to reset database",
    );
  }
}

/**
 * Get system info
 */
export async function getSystemInfoAction(): Promise<
  ActionResponse<SystemInfoDto>
> {
  try {
    const container = getContainer();
    const getSystemInfo = container.get<GetSystemInfoUseCase>(
      DI_TOKENS.GetSystemInfoUseCase,
    );

    const result = await getSystemInfo.execute();

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "getSystemInfoAction" },
      "Failed to get system info",
    );
  }
}

/**
 * Send test email
 */
export async function sendTestEmailAction(
  dto: SendTestEmailDto,
): Promise<ActionResponse<SendTestEmailResultDto>> {
  try {
    const container = getContainer();
    const sendTestEmail = container.get<SendTestEmailUseCase>(
      DI_TOKENS.SendTestEmailUseCase,
    );

    const result = await sendTestEmail.execute(dto);

    return result.success
      ? { success: true as const, data: result }
      : { success: false as const, error: result.error || "Unknown error" };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "sendTestEmailAction" },
      "Failed to send test email",
    );
  }
}
