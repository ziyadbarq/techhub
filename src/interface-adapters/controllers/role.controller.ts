/**
 * Role Controller
 *
 * Server actions for Role CRUD operations.
 * Demonstrates Clean Architecture controller pattern with:
 * - Dependency injection via container
 * - Input validation with Zod
 * - Centralized error handling
 * - Presentation layer transformation
 * - Audit logging with IP/user agent
 * - Cache revalidation after mutations
 * - Permission-based access control
 */

"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { getContainer } from "@/di/container";
import { DI_TOKENS } from "@/di/types";
import type { ActionResponse } from "./types";
import { handleControllerError } from "./error-handler";
import {
  CreateRoleSchema,
  UpdateRoleSchema,
  RoleIdSchema,
  AssignPermissionsToRoleSchema,
  type CreateRoleDTO,
  type UpdateRoleDTO,
  type AssignPermissionsToRoleDTO,
} from "../dtos/role.dto";
import {
  presentRole,
  presentRoles,
  presentPermissions,
  type RoleDTO,
  type PermissionDTO,
} from "../presenters/role.presenter";
import type {
  CreateRoleUseCase,
  UpdateRoleUseCase,
  DeleteRoleUseCase,
  GetRoleUseCase,
  ListRolesUseCase,
  AssignPermissionsToRoleUseCase,
} from "@/core/use-cases/rbac";
import type { ListPermissionsUseCase } from "@/core/use-cases/rbac/list-permissions.use-case";
import { requirePermission } from "@/lib/permissions/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { getCurrentUserId } from "@/lib/auth/session";

/**
 * Helper to get request metadata for audit logging
 */
async function getRequestMetadata() {
  const headersList = await headers();
  return {
    ipAddress: headersList.get("x-forwarded-for") || "unknown",
    userAgent: headersList.get("user-agent") || "unknown",
  };
}

/**
 * Create a new role
 */
export async function createRoleAction(
  data: CreateRoleDTO,
): Promise<ActionResponse<RoleDTO>> {
  try {
    // Check permission
    await requirePermission(PERMISSIONS.ROLES_CREATE);

    // Get current user and request metadata
    const userId = await getCurrentUserId();
    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }
    const metadata = await getRequestMetadata();

    // Validate input and set defaults
    const validated = CreateRoleSchema.parse({
      ...data,
      isActive: data.isActive ?? true,
    });

    // Get use case from DI container
    const container = getContainer();
    const createRole = container.get<CreateRoleUseCase>(
      DI_TOKENS.CreateRoleUseCase,
    );

    // Execute use case
    const role = await createRole.execute({
      name: validated.name,
      displayName: validated.displayName,
      description: validated.description ?? undefined,
      isSystem: false, // User-created roles are never system roles
      createdBy: userId,
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent,
    });

    // Revalidate roles list
    revalidatePath("/admin/roles");

    // Transform to DTO
    return {
      success: true,
      data: presentRole(role),
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "createRoleAction" },
      "Failed to create role",
    );
  }
}

/**
 * Update an existing role
 */
export async function updateRoleAction(
  data: UpdateRoleDTO,
): Promise<ActionResponse<RoleDTO>> {
  try {
    // Check permission
    await requirePermission(PERMISSIONS.ROLES_UPDATE);

    // Get current user and request metadata
    const userId = await getCurrentUserId();
    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }
    const metadata = await getRequestMetadata();

    // Validate input
    const validated = UpdateRoleSchema.parse(data);

    // Get use case from DI container
    const container = getContainer();
    const updateRole = container.get<UpdateRoleUseCase>(
      DI_TOKENS.UpdateRoleUseCase,
    );

    // Execute use case
    const role = await updateRole.execute({
      roleId: validated.id,
      displayName: validated.displayName,
      description: validated.description,
      isActive: validated.isActive,
      updatedBy: userId,
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent,
    });

    // Revalidate roles list and detail page
    revalidatePath("/admin/roles");
    revalidatePath(`/admin/roles/${validated.id}`);

    // Transform to DTO
    return {
      success: true,
      data: presentRole(role),
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "updateRoleAction" },
      "Failed to update role",
    );
  }
}

/**
 * Delete a role
 */
export async function deleteRoleAction(
  id: string,
): Promise<ActionResponse<void>> {
  try {
    // Check permission
    await requirePermission(PERMISSIONS.ROLES_DELETE);

    // Get current user and request metadata
    const userId = await getCurrentUserId();
    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }
    const metadata = await getRequestMetadata();

    // Validate input
    const validated = RoleIdSchema.parse({ id });

    // Get use case from DI container
    const container = getContainer();
    const deleteRole = container.get<DeleteRoleUseCase>(
      DI_TOKENS.DeleteRoleUseCase,
    );

    // Execute use case
    await deleteRole.execute({
      roleId: validated.id,
      deletedBy: userId,
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent,
    });

    // Revalidate roles list and detail page
    revalidatePath("/admin/roles");
    revalidatePath(`/admin/roles/${validated.id}`);

    return {
      success: true,
      data: undefined,
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "deleteRoleAction" },
      "Failed to delete role",
    );
  }
}

/**
 * Get a single role by ID
 */
export async function getRoleAction(
  id: string,
): Promise<ActionResponse<RoleDTO>> {
  try {
    // Check permission
    await requirePermission(PERMISSIONS.ROLES_VIEW);

    // Validate input
    const validated = RoleIdSchema.parse({ id });

    // Get use case from DI container
    const container = getContainer();
    const getRole = container.get<GetRoleUseCase>(DI_TOKENS.GetRoleUseCase);

    // Execute use case
    const result = await getRole.execute(validated.id);

    if (!result) {
      return {
        success: false,
        error: "Role not found",
      };
    }

    // Transform to DTO
    return {
      success: true,
      data: presentRole(result.role),
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "getRoleAction" },
      "Failed to get role",
    );
  }
}

/**
 * List all roles
 */
export async function listRolesAction(): Promise<ActionResponse<RoleDTO[]>> {
  try {
    // Check permission
    await requirePermission(PERMISSIONS.ROLES_VIEW);

    // Get use case from DI container
    const container = getContainer();
    const listRoles = container.get<ListRolesUseCase>(
      DI_TOKENS.ListRolesUseCase,
    );

    // Execute use case
    const roles = await listRoles.execute();

    // Transform to DTOs
    return {
      success: true,
      data: presentRoles(roles),
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "listRolesAction" },
      "Failed to list roles",
    );
  }
}

/**
 * Assign permissions to a role
 */
export async function assignPermissionsToRoleAction(
  data: AssignPermissionsToRoleDTO,
): Promise<ActionResponse<void>> {
  try {
    // Check permission
    await requirePermission(PERMISSIONS.ROLES_MANAGE);

    // Get current user and request metadata
    const userId = await getCurrentUserId();
    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }
    const metadata = await getRequestMetadata();

    // Validate input
    const validated = AssignPermissionsToRoleSchema.parse(data);

    // Get use case from DI container
    const container = getContainer();
    const assignPermissions = container.get<AssignPermissionsToRoleUseCase>(
      DI_TOKENS.AssignPermissionsToRoleUseCase,
    );

    // Execute use case
    await assignPermissions.execute({
      roleId: validated.roleId,
      permissionIds: validated.permissionIds,
      assignedBy: userId,
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent,
    });

    // Revalidate roles list and permissions page
    revalidatePath("/admin/roles");
    revalidatePath(`/admin/roles/${validated.roleId}/permissions`);

    return {
      success: true,
      data: undefined,
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "assignPermissionsToRoleAction" },
      "Failed to assign permissions to role",
    );
  }
}

/**
 * List all permissions (for permission assignment UI)
 */
export async function listPermissionsAction(): Promise<
  ActionResponse<PermissionDTO[]>
> {
  try {
    // Check permission
    await requirePermission(PERMISSIONS.PERMISSIONS_VIEW);

    // Get use case from DI container
    const container = getContainer();
    const listPermissions = container.get<ListPermissionsUseCase>(
      DI_TOKENS.ListPermissionsUseCase,
    );

    // Execute use case
    const result = await listPermissions.execute({
      includeInactive: false,
    });

    // Transform to DTOs
    return {
      success: true,
      data: presentPermissions(result.permissions),
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "listPermissionsAction" },
      "Failed to list permissions",
    );
  }
}
