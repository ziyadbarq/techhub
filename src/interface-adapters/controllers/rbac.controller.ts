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
  GetUserRolesUseCase,
} from "@/core/use-cases/rbac";
import type { PermissionKey } from "@/core/domain/value-objects/permission-key";
import { getSession } from "@/lib/auth/session";
import type { IRoleRepository } from "@/core/repositories/role-repository.interface";
import { requirePermission } from "@/lib/permissions/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";

/**
 * Helper to get current user session
 */
async function requireAuth() {
  const { user } = await getSession();

  if (!user) {
    throw new Error("Unauthorized");
  }

  return { userId: user.id };
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

export interface UserRolesResultDTO {
  userId: string;
  roles: {
    id: string;
    name: string;
    displayName: string;
    description: string | null;
    isSystem: boolean;
    isActive: boolean;
  }[];
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
 * Get all roles for the current user
 * Useful for UI gating and debug endpoints
 */
export async function getMyRolesAction(): Promise<
  ActionResponse<UserRolesResultDTO>
> {
  try {
    const session = await requireAuth();

    const container = getContainer();
    const getUserRoles = container.get<GetUserRolesUseCase>(
      DI_TOKENS.GetUserRolesUseCase,
    );

    const result = await getUserRoles.execute({ userId: session.userId });

    return {
      success: true,
      data: {
        userId: session.userId,
        roles: result.roles.map((userRole) => ({
          id: userRole.role.id,
          name: userRole.role.name,
          displayName: userRole.role.displayName,
          description: userRole.role.description ?? null,
          isSystem: userRole.role.isSystem,
          isActive: userRole.role.isActive,
        })),
      },
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "getMyRolesAction" },
      "Failed to fetch current user roles",
    );
  }
}

/**
 * List all active roles with their permission keys (admin-only).
 * Optimized to use single query with join instead of N+1 pattern
 */
export async function listRolesWithPermissionsAction(): Promise<
  ActionResponse<
    {
      id: string;
      name: string;
      displayName: string;
      description: string | null;
      isSystem: boolean;
      isActive: boolean;
      permissions: PermissionKey[];
    }[]
  >
> {
  try {
    await requirePermission(PERMISSIONS.ROLES_VIEW);

    const container = getContainer();
    const roleRepository = container.get<IRoleRepository>(
      DI_TOKENS.IRoleRepository,
    );

    // Use optimized single-query method instead of N+1 pattern
    const rolesWithPermissions = await roleRepository.findAllWithPermissions({
      includeInactive: false,
    });

    const data = rolesWithPermissions.map(([role, permissions]) => ({
      id: role.id,
      name: role.name,
      displayName: role.displayName,
      description: role.description ?? null,
      isSystem: role.isSystem,
      isActive: role.isActive,
      permissions,
    }));

    return { success: true, data };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "listRolesWithPermissionsAction" },
      "Failed to fetch roles with permissions",
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
