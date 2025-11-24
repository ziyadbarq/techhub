/**
 * Setup Controller
 * Server actions for first-time setup (System Administrator role assignment)
 */

"use server";

import { getContainer } from "@/di/container";
import { DI_TOKENS } from "@/di/types";
import type { ActionResponse } from "./types";
import { handleControllerError } from "./error-handler";
import type { CheckFirstAdminUseCase } from "@/core/use-cases/rbac/check-first-admin.use-case";
import { type CheckFirstAdminResult } from "@/core/use-cases/rbac/check-first-admin.use-case";
import type { AssignFirstAdminUseCase } from "@/core/use-cases/rbac/assign-first-admin.use-case";
import { type AssignFirstAdminResult } from "@/core/use-cases/rbac/assign-first-admin.use-case";
import { getCurrentUserId } from "@/lib/auth/session";
import { revalidatePath } from "next/cache";
import type { CheckSystemHealthUseCase } from "@/core/use-cases/system-setup/check-system-health.use-case";
import type { GetMigrationStatusUseCase } from "@/core/use-cases/system-setup/get-migration-status.use-case";
import type { ResetDatabaseUseCase } from "@/core/use-cases/system-setup/reset-database.use-case";
import type { GetSystemInfoUseCase } from "@/core/use-cases/system-setup/get-system-info.use-case";
import type {
  SystemHealthCheckDto,
  MigrationStatusDto,
  SystemInfoDto,
} from "@/interface-adapters/dtos/system-setup.dto";
import type { ResetDatabaseResult } from "@/core/use-cases/system-setup";

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
