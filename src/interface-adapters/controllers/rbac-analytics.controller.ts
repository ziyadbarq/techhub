/**
 * RBAC Analytics Controller
 *
 * Server actions for RBAC analytics and statistics.
 * Provides insights into role usage, permission usage, and user role assignments.
 */

"use server";

import { getContainer } from "@/di/container";
import { DI_TOKENS } from "@/di/types";
import type { ActionResponse } from "./types";
import { handleControllerError } from "./error-handler";
import type {
  GetRoleUsageStatsUseCase,
  RoleUsageStats,
  GetPermissionUsageStatsUseCase,
  PermissionUsageStats,
  GetUserRoleStatsUseCase,
  UserRoleStatsResult,
} from "@/core/use-cases/rbac/analytics";
import { requirePermission } from "@/lib/permissions/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";

/**
 * Get role usage statistics
 * Returns number of users per role, orphaned roles, etc.
 */
export async function getRoleUsageStatsAction(): Promise<
  ActionResponse<RoleUsageStats[]>
> {
  try {
    // Check permission
    await requirePermission(PERMISSIONS.ROLES_VIEW);

    const container = getContainer();
    const useCase = container.get<GetRoleUsageStatsUseCase>(
      DI_TOKENS.GetRoleUsageStatsUseCase,
    );

    const stats = await useCase.execute();

    return {
      success: true,
      data: stats,
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "getRoleUsageStatsAction" },
      "Failed to fetch role usage statistics",
    );
  }
}

/**
 * Get permission usage statistics
 * Returns number of roles using each permission, unused permissions, etc.
 */
export async function getPermissionUsageStatsAction(): Promise<
  ActionResponse<PermissionUsageStats[]>
> {
  try {
    // Check permission
    await requirePermission(PERMISSIONS.PERMISSIONS_VIEW);

    const container = getContainer();
    const useCase = container.get<GetPermissionUsageStatsUseCase>(
      DI_TOKENS.GetPermissionUsageStatsUseCase,
    );

    const stats = await useCase.execute();

    return {
      success: true,
      data: stats,
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "getPermissionUsageStatsAction" },
      "Failed to fetch permission usage statistics",
    );
  }
}

/**
 * Get user role statistics
 * Returns users with multiple roles, conflicting roles, etc.
 */
export async function getUserRoleStatsAction(): Promise<
  ActionResponse<UserRoleStatsResult>
> {
  try {
    // Check permission
    await requirePermission(PERMISSIONS.USERS_MANAGE);

    const container = getContainer();
    const useCase = container.get<GetUserRoleStatsUseCase>(
      DI_TOKENS.GetUserRoleStatsUseCase,
    );

    const stats = await useCase.execute();

    return {
      success: true,
      data: stats,
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "getUserRoleStatsAction" },
      "Failed to fetch user role statistics",
    );
  }
}
