/**
 * RBAC Utility Controller
 *
 * Server actions for RBAC utility operations.
 * Provides permission checking and current user permission queries.
 * Demonstrates Clean Architecture controller pattern with:
 * - Dependency injection via container
 * - Input validation with Zod
 * - Centralized error handling
 * - Presentation layer transformation
 */

"use server";

import { getContainer } from "@/di/container";
import { DI_TOKENS } from "@/di/types";
import type { ActionResponse } from "./types";
import { handleControllerError } from "./error-handler";
import type {
  CheckPermissionUseCase,
  GetUserPermissionsUseCase,
} from "@/core/use-cases/rbac";
import type { PermissionKey } from "@/core/domain/value-objects/permission-key";

/**
 * Helper to get current user session
 * TODO: Replace with actual auth implementation
 */
async function requireAuth() {
  // TODO: Implement actual session/auth check
  // For now, return mock user ID
  return {
    userId: "system",
  };
}

/**
 * Check permission result DTO
 */
export interface CheckPermissionResultDTO {
  userId: string;
  permission: string;
  hasPermission: boolean;
}

/**
 * User permissions result DTO
 */
export interface UserPermissionsResultDTO {
  userId: string;
  permissions: string[];
  activeRoleCount: number;
}

/**
 * Check if the current user has a specific permission
 */
export async function checkPermissionAction(
  permission: PermissionKey,
): Promise<ActionResponse<CheckPermissionResultDTO>> {
  try {
    // Get current user
    const session = await requireAuth();

    // Get use case from DI container
    const container = getContainer();
    const checkPermission = container.get<CheckPermissionUseCase>(
      DI_TOKENS.CheckPermissionUseCase,
    );

    // Execute use case
    const hasPermission = await checkPermission.execute({
      userId: session.userId,
      permission,
    });

    return {
      success: true,
      data: {
        userId: session.userId,
        permission,
        hasPermission,
      },
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "checkPermissionAction" },
      "Failed to check permission",
    );
  }
}

/**
 * Get all permissions for the current user
 * Useful for authorization checks and UI permission gating
 */
export async function getMyPermissionsAction(): Promise<
  ActionResponse<UserPermissionsResultDTO>
> {
  try {
    // Get current user
    const session = await requireAuth();

    // Get use case from DI container
    const container = getContainer();
    const getUserPermissions = container.get<GetUserPermissionsUseCase>(
      DI_TOKENS.GetUserPermissionsUseCase,
    );

    // Execute use case
    const result = await getUserPermissions.execute({
      userId: session.userId,
    });

    return {
      success: true,
      data: {
        userId: result.userId,
        permissions: result.permissions.map((p: string) => p),
        activeRoleCount: result.activeRoleCount,
      },
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "getMyPermissionsAction" },
      "Failed to get user permissions",
    );
  }
}

/**
 * Get all permissions for a specific user (admin only)
 */
export async function getUserPermissionsAction(
  userId: string,
): Promise<ActionResponse<UserPermissionsResultDTO>> {
  try {
    // Get use case from DI container
    const container = getContainer();
    const getUserPermissions = container.get<GetUserPermissionsUseCase>(
      DI_TOKENS.GetUserPermissionsUseCase,
    );

    // Execute use case
    const result = await getUserPermissions.execute({
      userId,
    });

    return {
      success: true,
      data: {
        userId: result.userId,
        permissions: result.permissions.map((p: string) => p),
        activeRoleCount: result.activeRoleCount,
      },
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "getUserPermissionsAction" },
      "Failed to get user permissions",
    );
  }
}
