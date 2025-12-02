/**
 * User Role Controller
 *
 * Server actions for user role management (RBAC).
 * Handles assigning/revoking roles and fetching user data with roles.
 */

"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { getContainer } from "@/di/container";
import { DI_TOKENS } from "@/di/types";
import type { ActionResponse } from "./types";
import { handleControllerError } from "./error-handler";
import { getSession } from "@/lib/auth/session";
import type { AssignRoleToUserUseCase } from "@/core/use-cases/rbac/assign-role-to-user.use-case";
import { RoleConflictError } from "@/core/use-cases/rbac/assign-role-to-user.use-case";
import type { RevokeRoleFromUserUseCase } from "@/core/use-cases/rbac/revoke-role-from-user.use-case";
// import { GetUserRolesUseCase } from "@/core/use-cases/rbac/get-user-roles.use-case"; // Unused for now
import type { ListRolesUseCase } from "@/core/use-cases/rbac/list-roles.use-case";
import type { CheckPermissionUseCase } from "@/core/use-cases/rbac/check-permission.use-case";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import type { IUserRoleRepository } from "@/core/repositories/user-role-repository.interface";
import type { IUserRepository } from "@/core/repositories/user-repository.interface";

/**
 * User with roles DTO
 */
export interface UserWithRolesDTO {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  emailVerified: Date | null;
  createdAt: Date;
  roles: {
    id: string;
    roleId: string;
    roleName: string;
    roleDisplayName: string;
    expiresAt: Date | null;
    isActive: boolean;
  }[];
}

/**
 * Role assignment DTO
 */
export interface AssignRoleDTO {
  userId: string;
  roleId: string;
  expiresAt?: Date;
}

/**
 * Revoke role DTO
 */
export interface RevokeRoleDTO {
  userId: string;
  roleId: string;
}

/**
 * List all users with their roles
 */
export async function listUsersWithRolesAction(): Promise<
  ActionResponse<UserWithRolesDTO[]>
> {
  try {
    // Check permission
    const { user } = await getSession();
    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    const container = getContainer();
    const checkPermission = container.get<CheckPermissionUseCase>(
      DI_TOKENS.CheckPermissionUseCase,
    );

    const hasPermission = await checkPermission.execute({
      userId: user.id,
      permission: PERMISSIONS.USERS_MANAGE,
    });

    if (!hasPermission) {
      return { success: false, error: "Insufficient permissions" };
    }

    const userRoleRepository = container.get<IUserRoleRepository>(
      DI_TOKENS.IUserRoleRepository,
    );
    const users = await userRoleRepository.findUsersWithRoles();

    // Transform to DTO
    const usersWithRoles: UserWithRolesDTO[] = users.map((u) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      image: u.image,
      emailVerified: u.emailVerified,
      createdAt: u.createdAt,
      roles: u.roles.map((ur) => ({
        id: ur.id,
        roleId: ur.roleId,
        roleName: ur.roleName,
        roleDisplayName: ur.roleDisplayName,
        expiresAt: ur.expiresAt,
        isActive: ur.isActive,
      })),
    }));

    return {
      success: true,
      data: usersWithRoles,
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "listUsersWithRolesAction" },
      "Failed to list users",
    );
  }
}

/**
 * Get a single user with roles
 */
export async function getUserWithRolesAction(
  email: string,
): Promise<ActionResponse<UserWithRolesDTO>> {
  try {
    // Check permission
    const { user } = await getSession();
    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    const container = getContainer();
    const checkPermission = container.get<CheckPermissionUseCase>(
      DI_TOKENS.CheckPermissionUseCase,
    );

    const hasPermission = await checkPermission.execute({
      userId: user.id,
      permission: PERMISSIONS.USERS_MANAGE,
    });

    if (!hasPermission) {
      return { success: false, error: "Insufficient permissions" };
    }

    const userRoleRepository = container.get<IUserRoleRepository>(
      DI_TOKENS.IUserRoleRepository,
    );
    const users = await userRoleRepository.findUsersWithRoles();
    const userData = users.find(
      (u) => u.email.toLowerCase() === email.toLowerCase(),
    );

    if (!userData) {
      return { success: false, error: "User not found" };
    }

    // Transform to DTO
    const userWithRoles: UserWithRolesDTO = {
      id: userData.id,
      email: userData.email,
      name: userData.name,
      image: userData.image,
      emailVerified: userData.emailVerified,
      createdAt: userData.createdAt,
      roles: userData.roles.map((ur) => ({
        id: ur.id,
        roleId: ur.roleId,
        roleName: ur.roleName,
        roleDisplayName: ur.roleDisplayName,
        expiresAt: ur.expiresAt,
        isActive: ur.isActive,
      })),
    };

    return {
      success: true,
      data: userWithRoles,
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "getUserWithRolesAction" },
      "Failed to get user",
    );
  }
}

/**
 * Assign a role to a user
 */
export async function assignRoleToUserAction(
  data: AssignRoleDTO,
): Promise<ActionResponse<void>> {
  try {
    // Check permission
    const { user } = await getSession();
    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    const container = getContainer();
    const checkPermission = container.get<CheckPermissionUseCase>(
      DI_TOKENS.CheckPermissionUseCase,
    );

    const hasPermission = await checkPermission.execute({
      userId: user.id,
      permission: PERMISSIONS.USERS_MANAGE,
    });

    if (!hasPermission) {
      return { success: false, error: "Insufficient permissions" };
    }

    // Get request metadata
    const headersList = await headers();
    const ipAddress = headersList.get("x-forwarded-for") || "unknown";
    const userAgent = headersList.get("user-agent") || "unknown";

    // Get use case from DI container
    const assignRoleToUser = container.get<AssignRoleToUserUseCase>(
      DI_TOKENS.AssignRoleToUserUseCase,
    );

    // Execute use case
    await assignRoleToUser.execute({
      userId: data.userId,
      roleId: data.roleId,
      expiresAt: data.expiresAt,
      assignedBy: user.id,
      ipAddress,
      userAgent,
    });

    // Get user email for revalidation
    const userRepository = container.get<IUserRepository>(
      DI_TOKENS.IUserRepository,
    );
    const targetUser = await userRepository.findById(data.userId);

    // Revalidate users list and detail page
    revalidatePath("/admin/users");
    if (targetUser?.email) {
      revalidatePath(
        `/admin/users/${encodeURIComponent(targetUser.email)}/roles`,
      );
    }

    return {
      success: true,
      data: undefined,
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "assignRoleToUserAction" },
      "Failed to assign role",
    );
  }
}

/**
 * Bulk assign roles to multiple users
 */
export async function bulkAssignRolesToUsersAction(data: {
  userIds: string[];
  roleIds: string[];
  expiresAt?: Date;
}): Promise<
  ActionResponse<{
    assigned: number;
    failed: number;
    conflicts: number;
    results: Array<{
      userId: string;
      userEmail: string;
      roleId: string;
      roleName: string;
      status: "success" | "failed" | "conflict";
      error?: string;
    }>;
  }>
> {
  try {
    // Check permission
    const { user } = await getSession();
    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    const container = getContainer();
    const checkPermission = container.get<CheckPermissionUseCase>(
      DI_TOKENS.CheckPermissionUseCase,
    );

    const hasPermission = await checkPermission.execute({
      userId: user.id,
      permission: PERMISSIONS.USERS_MANAGE,
    });

    if (!hasPermission) {
      return { success: false, error: "Insufficient permissions" };
    }

    // Get request metadata
    const headersList = await headers();
    const ipAddress = headersList.get("x-forwarded-for") || "unknown";
    const userAgent = headersList.get("user-agent") || "unknown";

    // Get use case from DI container
    const assignRoleToUser = container.get<AssignRoleToUserUseCase>(
      DI_TOKENS.AssignRoleToUserUseCase,
    );

    let assignedCount = 0;
    let conflictCount = 0;
    let failedCount = 0;
    const results: Array<{
      userId: string;
      userEmail: string;
      roleId: string;
      roleName: string;
      status: "success" | "failed" | "conflict";
      error?: string;
    }> = [];

    // Fetch user and role details for better reporting
    const userRepository = container.get<IUserRepository>(
      DI_TOKENS.IUserRepository,
    );
    const userRecords = await Promise.all(
      data.userIds.map((id) => userRepository.findById(id)),
    );
    const userMap = new Map(
      userRecords
        .filter(Boolean)
        .map((u) => [u!.id, { id: u!.id, email: u!.email }]),
    );

    const listRoles = container.get<ListRolesUseCase>(
      DI_TOKENS.ListRolesUseCase,
    );
    const roleList = await listRoles.execute();
    const roleMap = new Map(
      roleList.map((r) => [
        r.id,
        { id: r.id, name: r.name, displayName: r.displayName ?? r.name },
      ]),
    );

    // Assign each role to each user
    for (const userId of data.userIds) {
      const userInfo = userMap.get(userId);
      for (const roleId of data.roleIds) {
        const roleInfo = roleMap.get(roleId);
        try {
          await assignRoleToUser.execute({
            userId,
            roleId,
            expiresAt: data.expiresAt,
            assignedBy: user.id,
            ipAddress,
            userAgent,
          });
          assignedCount++;
          results.push({
            userId,
            userEmail: userInfo?.email ?? userId,
            roleId,
            roleName:
              roleInfo && typeof roleInfo === "object" && roleInfo !== null
                ? ((roleInfo as { displayName?: string }).displayName ??
                  (roleInfo as { name?: string }).name ??
                  roleId)
                : roleId,
            status: "success",
          });
        } catch (error) {
          if (error instanceof RoleConflictError) {
            // Handle conflict errors separately
            conflictCount++;
            results.push({
              userId,
              userEmail: userInfo?.email ?? userId,
              roleId,
              roleName:
                roleInfo && typeof roleInfo === "object" && roleInfo !== null
                  ? ((roleInfo as { displayName?: string }).displayName ??
                    (roleInfo as { name?: string }).name ??
                    roleId)
                  : roleId,
              status: "conflict",
              error: `Critical role conflict: ${error.conflicts.map((c) => `${c.role1} ↔ ${c.role2}`).join(", ")}`,
            });
          } else {
            // Other errors
            failedCount++;
            results.push({
              userId,
              userEmail: userInfo?.email ?? userId,
              roleId,
              roleName:
                roleInfo && typeof roleInfo === "object" && roleInfo !== null
                  ? ((roleInfo as { displayName?: string }).displayName ??
                    (roleInfo as { name?: string }).name ??
                    roleId)
                  : roleId,
              status: "failed",
              error: error instanceof Error ? error.message : "Unknown error",
            });
          }
        }
      }
    }

    // Revalidate users list
    revalidatePath("/admin/users");

    return {
      success: true,
      data: {
        assigned: assignedCount,
        failed: failedCount,
        conflicts: conflictCount,
        results,
      },
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "bulkAssignRolesToUsersAction" },
      "Failed to bulk assign roles",
    );
  }
}

/**
 * Revoke a role from a user
 */
export async function revokeRoleFromUserAction(
  data: RevokeRoleDTO,
): Promise<ActionResponse<void>> {
  try {
    // Check permission
    const { user } = await getSession();
    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    const container = getContainer();
    const checkPermission = container.get<CheckPermissionUseCase>(
      DI_TOKENS.CheckPermissionUseCase,
    );

    const hasPermission = await checkPermission.execute({
      userId: user.id,
      permission: PERMISSIONS.USERS_MANAGE,
    });

    if (!hasPermission) {
      return { success: false, error: "Insufficient permissions" };
    }

    // Get request metadata
    const headersList = await headers();
    const ipAddress = headersList.get("x-forwarded-for") || "unknown";
    const userAgent = headersList.get("user-agent") || "unknown";

    // Get use case from DI container
    const revokeRoleFromUser = container.get<RevokeRoleFromUserUseCase>(
      DI_TOKENS.RevokeRoleFromUserUseCase,
    );

    // Execute use case
    await revokeRoleFromUser.execute({
      userId: data.userId,
      roleId: data.roleId,
      revokedBy: user.id,
      ipAddress,
      userAgent,
    });

    // Get user email for revalidation
    const userRepository = container.get<IUserRepository>(
      DI_TOKENS.IUserRepository,
    );
    const targetUser = await userRepository.findById(data.userId);

    // Revalidate users list and detail page
    revalidatePath("/admin/users");
    if (targetUser?.email) {
      revalidatePath(
        `/admin/users/${encodeURIComponent(targetUser.email)}/roles`,
      );
    }

    return {
      success: true,
      data: undefined,
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "revokeRoleFromUserAction" },
      "Failed to revoke role",
    );
  }
}

/**
 * Get all available roles (for role assignment UI)
 */
export async function listAvailableRolesAction(): Promise<
  ActionResponse<{ id: string; name: string; displayName: string }[]>
> {
  try {
    // Check permission
    const { user } = await getSession();
    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    const container = getContainer();
    const checkPermission = container.get<CheckPermissionUseCase>(
      DI_TOKENS.CheckPermissionUseCase,
    );

    const hasPermission = await checkPermission.execute({
      userId: user.id,
      permission: PERMISSIONS.USERS_MANAGE,
    });

    if (!hasPermission) {
      return { success: false, error: "Insufficient permissions" };
    }

    // Get use case from DI container
    const listRoles = container.get<ListRolesUseCase>(
      DI_TOKENS.ListRolesUseCase,
    );

    // Execute use case
    const roles = await listRoles.execute({ includeInactive: false });

    // Transform to simple DTO
    const rolesDTO = roles.map((role) => ({
      id: role.id,
      name: role.name,
      displayName: role.displayName,
    }));

    return {
      success: true,
      data: rolesDTO,
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "listAvailableRolesAction" },
      "Failed to list roles",
    );
  }
}
