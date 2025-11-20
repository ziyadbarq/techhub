/**
 * Permission Presenter
 *
 * Transforms Permission domain entities into DTOs for the UI layer.
 * Ensures clean separation between domain and presentation.
 */

import type { Permission } from "@/core/domain/entities/permission.entity";

/**
 * Permission DTO for presentation layer
 */
export interface PermissionDTO {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  resource: string;
  action: string;
  isSystem: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Convert Permission entity to DTO
 *
 * @param permission - Domain Permission entity
 * @returns PermissionDTO for UI consumption
 */
export function presentPermission(permission: Permission): PermissionDTO {
  return {
    id: permission.id,
    name: permission.name,
    displayName: permission.displayName,
    description: permission.description,
    resource: permission.resource,
    action: permission.action,
    isSystem: permission.isSystem,
    isActive: permission.isActive,
    createdAt: permission.createdAt.toISOString(),
    updatedAt: permission.updatedAt.toISOString(),
  };
}

/**
 * Convert array of Permission entities to DTOs
 *
 * @param permissions - Array of domain Permission entities
 * @returns Array of PermissionDTOs for UI consumption
 */
export function presentPermissions(permissions: Permission[]): PermissionDTO[] {
  return permissions.map(presentPermission);
}
