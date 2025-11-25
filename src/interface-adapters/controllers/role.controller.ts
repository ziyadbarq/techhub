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
import type { ActionResponse, BulkCreateResult } from "./types";
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
  ListRolesUseCase,
  AssignPermissionsToRoleUseCase,
} from "@/core/use-cases/rbac";
import type { ListPermissionsUseCase } from "@/core/use-cases/rbac/list-permissions.use-case";
import type { IRoleRepository } from "@/core/repositories/role-repository.interface";
import { requirePermission } from "@/lib/permissions/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { getCurrentUserId } from "@/lib/auth/session";
import { validatePermissionDependencies } from "@/lib/rbac/permission-dependencies";
import type { PermissionKey } from "@/core/domain/value-objects/permission-key";
import type { IPermissionRepository } from "@/core/repositories/permission-repository.interface";

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
    revalidatePath(`/admin/roles/${encodeURIComponent(role.name)}`);

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

    // Get use case and repository from DI container
    const container = getContainer();
    const roleRepository = container.get<IRoleRepository>(
      DI_TOKENS.IRoleRepository,
    );

    // Get role first to know its name for revalidation
    const role = await roleRepository.findById(validated.id);
    const roleName = role?.name;

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
    if (roleName) {
      revalidatePath(`/admin/roles/${encodeURIComponent(roleName)}`);
    }

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
  name: string,
): Promise<ActionResponse<RoleDTO>> {
  try {
    // Check permission
    await requirePermission(PERMISSIONS.ROLES_VIEW);

    // Get repository from DI container
    const container = getContainer();
    const roleRepository = container.get<IRoleRepository>(
      DI_TOKENS.IRoleRepository,
    );

    // Find role by name
    const role = await roleRepository.findByName(name);

    if (!role) {
      return {
        success: false,
        error: "Role not found",
      };
    }

    // Transform to DTO
    return {
      success: true,
      data: presentRole(role),
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "getRoleAction", name },
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

    // Get use case and repository from DI container
    const container = getContainer();
    const roleRepository = container.get<IRoleRepository>(
      DI_TOKENS.IRoleRepository,
    );
    const permissionRepository = container.get<IPermissionRepository>(
      DI_TOKENS.IPermissionRepository,
    );

    // Get role first to know its name for revalidation
    const role = await roleRepository.findById(validated.roleId);

    // Get permission names from IDs for dependency validation
    const permissions = await Promise.all(
      validated.permissionIds.map((id) => permissionRepository.findById(id)),
    );
    const permissionNames = permissions
      .filter((p): p is NonNullable<typeof p> => p !== null)
      .map((p) => p.name as PermissionKey);

    // Validate permission dependencies server-side
    const dependencyValidation =
      validatePermissionDependencies(permissionNames);

    if (!dependencyValidation.valid) {
      // Build error message with missing dependencies
      const missingDeps = dependencyValidation.missing
        .map((item) => {
          const depsStr = item.requiredDependencies.join(", ");
          return `${item.permission} requires: ${depsStr}`;
        })
        .join("; ");

      return {
        success: false,
        error: `Missing permission dependencies: ${missingDeps}`,
      };
    }

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
    if (role) {
      revalidatePath(
        `/admin/roles/${encodeURIComponent(role.name)}/permissions`,
      );
    }

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

/**
 * Bulk create roles
 *
 * Creates multiple roles sequentially to avoid database overwhelm.
 * Tracks errors per item and returns summary with details.
 */
export async function bulkCreateRolesAction(
  items: CreateRoleDTO[],
): Promise<BulkCreateResult> {
  try {
    await requirePermission(PERMISSIONS.ROLES_CREATE);

    const container = getContainer();
    const useCase = container.get<CreateRoleUseCase>(
      DI_TOKENS.CreateRoleUseCase,
    );

    const userId = await getCurrentUserId();
    if (!userId) {
      throw new Error("Unauthorized");
    }
    const metadata = await getRequestMetadata();

    const errors: Array<{ index: number; name: string; error: string }> = [];
    let successCount = 0;

    for (let i = 0; i < items.length; i++) {
      try {
        const validated = CreateRoleSchema.parse({
          ...items[i],
          isActive: items[i].isActive ?? true,
        });

        await useCase.execute({
          name: validated.name,
          displayName: validated.displayName,
          description: validated.description ?? undefined,
          isSystem: false,
          createdBy: userId,
          ipAddress: metadata.ipAddress,
          userAgent: metadata.userAgent,
        });

        successCount++;
      } catch (error) {
        errors.push({
          index: i + 1,
          name: items[i].name,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    revalidatePath("/admin/roles");

    return {
      success: errors.length === 0,
      successCount,
      errorCount: errors.length,
      errors,
    };
  } catch (_error) {
    return {
      success: false,
      successCount: 0,
      errorCount: 0,
      errors: [],
    };
  }
}
