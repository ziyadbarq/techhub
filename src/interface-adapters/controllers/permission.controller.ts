/**
 * Permission Controller
 *
 * Server actions for Permission CRUD operations.
 * Demonstrates Clean Architecture controller pattern with:
 * - Dependency injection via container
 * - Input validation with Zod
 * - Centralized error handling
 * - Presentation layer transformation
 * - Cache revalidation after mutations
 * - Permission-based access control
 */

"use server";

import { revalidatePath } from "next/cache";
import { getContainer } from "@/di/container";
import { DI_TOKENS } from "@/di/types";
import type { ActionResponse } from "./types";
import { handleControllerError } from "./error-handler";
import {
  CreatePermissionSchema,
  UpdatePermissionSchema,
  PermissionIdSchema,
  PermissionFilterSchema,
  type CreatePermissionDTO,
  type UpdatePermissionDTO,
  type PermissionFilterDTO,
} from "../dtos/generated/permission.dto";
import {
  presentPermission,
  presentPermissions,
  type PermissionDTO,
} from "../presenters/permission.presenter";
import type {
  CreatePermissionUseCase,
  ListPermissionsUseCase,
  GetPermissionUseCase,
  UpdatePermissionUseCase,
  DeletePermissionUseCase,
} from "@/core/use-cases/rbac";
import { requirePermission } from "@/lib/permissions/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";

/**
 * Create a new permission
 */
export async function createPermissionAction(
  data: CreatePermissionDTO,
): Promise<ActionResponse<PermissionDTO>> {
  try {
    // Check permission
    await requirePermission(PERMISSIONS.PERMISSIONS_CREATE);

    // Validate input and set defaults
    const validated = CreatePermissionSchema.parse({
      ...data,
      isSystem: data.isSystem ?? false,
      isActive: data.isActive ?? true,
    });

    // Get use case from DI container
    const container = getContainer();
    const createPermission = container.get<CreatePermissionUseCase>(
      DI_TOKENS.CreatePermissionUseCase,
    );

    // Execute use case
    const permission = await createPermission.execute({
      resource: validated.resource,
      action: validated.action,
      displayName: validated.displayName,
      description: validated.description,
      isSystem: validated.isSystem,
      isActive: validated.isActive,
    });

    // Revalidate permissions list to show new permission
    revalidatePath("/admin/permissions");

    // Transform to DTO
    return {
      success: true,
      data: presentPermission(permission),
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "createPermissionAction" },
      "Failed to create permission",
    );
  }
}

/**
 * List all permissions with optional filtering
 */
export async function listPermissionsAction(
  filter?: PermissionFilterDTO,
): Promise<ActionResponse<PermissionDTO[]>> {
  try {
    // Check permission
    await requirePermission(PERMISSIONS.PERMISSIONS_VIEW);

    // Validate filter if provided
    const validated = filter ? PermissionFilterSchema.parse(filter) : undefined;

    // Get use case from DI container
    const container = getContainer();
    const listPermissions = container.get<ListPermissionsUseCase>(
      DI_TOKENS.ListPermissionsUseCase,
    );

    // Execute use case
    const result = await listPermissions.execute(validated);

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
 * Get a single permission by ID
 */
export async function getPermissionAction(
  id: string,
): Promise<ActionResponse<PermissionDTO>> {
  try {
    // Check permission
    await requirePermission(PERMISSIONS.PERMISSIONS_VIEW);

    // Validate input
    const validated = PermissionIdSchema.parse({ id });

    // Get use case from DI container
    const container = getContainer();
    const getPermission = container.get<GetPermissionUseCase>(
      DI_TOKENS.GetPermissionUseCase,
    );

    // Execute use case
    const permission = await getPermission.execute({ id: validated.id });

    if (!permission) {
      return {
        success: false,
        error: "Permission not found",
      };
    }

    // Transform to DTO
    return {
      success: true,
      data: presentPermission(permission),
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "getPermissionAction" },
      "Failed to get permission",
    );
  }
}

/**
 * Update an existing permission
 */
export async function updatePermissionAction(
  data: UpdatePermissionDTO,
): Promise<ActionResponse<PermissionDTO>> {
  try {
    // Check permission
    await requirePermission(PERMISSIONS.PERMISSIONS_UPDATE);

    // Validate input
    const validated = UpdatePermissionSchema.parse(data);

    // Get use case from DI container
    const container = getContainer();
    const updatePermission = container.get<UpdatePermissionUseCase>(
      DI_TOKENS.UpdatePermissionUseCase,
    );

    // Execute use case
    const permission = await updatePermission.execute({
      id: validated.id,
      displayName: validated.displayName,
      description: validated.description,
      isActive: validated.isActive,
    });

    // Revalidate permissions list and detail page
    revalidatePath("/admin/permissions");
    revalidatePath(`/admin/permissions/${validated.id}`);

    // Transform to DTO
    return {
      success: true,
      data: presentPermission(permission),
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "updatePermissionAction" },
      "Failed to update permission",
    );
  }
}

/**
 * Delete a permission
 */
export async function deletePermissionAction(
  id: string,
): Promise<ActionResponse<void>> {
  try {
    // Check permission
    await requirePermission(PERMISSIONS.PERMISSIONS_DELETE);

    // Validate input
    const validated = PermissionIdSchema.parse({ id });

    // Get use case from DI container
    const container = getContainer();
    const deletePermission = container.get<DeletePermissionUseCase>(
      DI_TOKENS.DeletePermissionUseCase,
    );

    // Execute use case
    await deletePermission.execute({ id: validated.id });

    // Revalidate permissions list and detail page
    revalidatePath("/admin/permissions");
    revalidatePath(`/admin/permissions/${validated.id}`);

    return {
      success: true,
      data: undefined,
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "deletePermissionAction" },
      "Failed to delete permission",
    );
  }
}
