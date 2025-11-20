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
import type { RevokeRoleFromUserUseCase } from "@/core/use-cases/rbac/revoke-role-from-user.use-case";
// import { GetUserRolesUseCase } from "@/core/use-cases/rbac/get-user-roles.use-case"; // Unused for now
import type { ListRolesUseCase } from "@/core/use-cases/rbac/list-roles.use-case";
import type { CheckPermissionUseCase } from "@/core/use-cases/rbac/check-permission.use-case";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { prisma } from "@/infrastructure/database/prisma/client";

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

    // Fetch all users with their roles
    const users = await prisma.user.findMany({
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Transform to DTO
    const usersWithRoles: UserWithRolesDTO[] = users.map(
      (u: (typeof users)[number]) => ({
        id: u.id,
        email: u.email,
        name: u.name,
        image: u.image,
        emailVerified: u.emailVerified,
        createdAt: u.createdAt,
        roles: u.roles.map((ur: (typeof u.roles)[number]) => {
          const now = new Date();
          const isExpired = ur.expiresAt ? ur.expiresAt < now : false;

          return {
            id: ur.id,
            roleId: ur.roleId,
            roleName: ur.role.name,
            roleDisplayName: ur.role.displayName,
            expiresAt: ur.expiresAt,
            isActive: !isExpired,
          };
        }),
      }),
    );

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
  userId: string,
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

    // Fetch user with roles
    const userData = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!userData) {
      return { success: false, error: "User not found" };
    }

    // Transform to DTO
    const now = new Date();
    const userWithRoles: UserWithRolesDTO = {
      id: userData.id,
      email: userData.email,
      name: userData.name,
      image: userData.image,
      emailVerified: userData.emailVerified,
      createdAt: userData.createdAt,
      roles: userData.roles.map((ur: (typeof userData.roles)[number]) => {
        const isExpired = ur.expiresAt ? ur.expiresAt < now : false;

        return {
          id: ur.id,
          roleId: ur.roleId,
          roleName: ur.role.name,
          roleDisplayName: ur.role.displayName,
          expiresAt: ur.expiresAt,
          isActive: !isExpired,
        };
      }),
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

    // Revalidate users list and detail page
    revalidatePath("/admin/users");
    revalidatePath(`/admin/users/${data.userId}`);

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

    // Revalidate users list and detail page
    revalidatePath("/admin/users");
    revalidatePath(`/admin/users/${data.userId}`);

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
