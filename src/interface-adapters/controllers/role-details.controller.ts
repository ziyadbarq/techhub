/**
 * Role Details Controller
 *
 * Server actions for role detail queries and aggregations.
 * Used for read-only business roles views.
 */

"use server";

import { requirePermission } from "@/lib/permissions/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import type { ActionResponse } from "./types";
import { handleControllerError } from "./error-handler";
import {
  getRoleDetailData,
  getRolePeopleData,
  getRoleHierarchyData,
  type RoleDetailData,
  type PersonAssignmentDTO,
  type RoleHierarchyDTO,
} from "@/interface-adapters/queries/role-detail.query";

/**
 * Get complete role detail data with people and hierarchy
 */
export async function getRoleDetailAction(
  roleId: string,
): Promise<ActionResponse<RoleDetailData>> {
  try {
    // Check permission
    await requirePermission(PERMISSIONS.ROLES_VIEW);

    // Fetch data via query composer
    const data = await getRoleDetailData(roleId);

    return {
      success: true,
      data,
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "getRoleDetailAction", roleId },
      "Failed to get role details",
    );
  }
}

/**
 * Get people assigned to a role
 */
export async function getRolePeopleAction(
  roleId: string,
): Promise<ActionResponse<PersonAssignmentDTO[]>> {
  try {
    // Check permission
    await requirePermission(PERMISSIONS.ROLES_VIEW);

    // Fetch data via query composer
    const data = await getRolePeopleData(roleId);

    return {
      success: true,
      data,
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "getRolePeopleAction", roleId },
      "Failed to get role people",
    );
  }
}

/**
 * Get role hierarchy (parent and children)
 */
export async function getRoleHierarchyAction(
  roleId: string,
): Promise<ActionResponse<RoleHierarchyDTO>> {
  try {
    // Check permission
    await requirePermission(PERMISSIONS.ROLES_VIEW);

    // Fetch data via query composer
    const data = await getRoleHierarchyData(roleId);

    return {
      success: true,
      data,
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "getRoleHierarchyAction", roleId },
      "Failed to get role hierarchy",
    );
  }
}
