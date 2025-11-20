/**
 * Role Presenter
 *
 * Transforms Role domain entities into DTOs for the UI layer.
 * Ensures clean separation between domain and presentation.
 */

import type { Role } from "@/core/domain/entities/role.entity";
import type { Permission } from "@/core/domain/entities/permission.entity";

/**
 * Role DTO for presentation layer
 */
export interface RoleDTO {
  id: string;
  name: string;
  displayName: string;
  description: string | undefined;
  isSystem: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string | undefined;
  permissions?: string[];
}

/**
 * Permission DTO for presentation layer
 */
export interface PermissionDTO {
  id: string;
  name: string;
  displayName: string;
  description: string | undefined;
  resource: string;
  action: string;
  isSystem: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Convert Role entity to DTO
 *
 * @param role - Domain Role entity
 * @returns RoleDTO for UI consumption
 */
export function presentRole(role: Role): RoleDTO {
  return {
    id: role.id,
    name: role.name,
    displayName: role.displayName,
    description: role.description,
    isSystem: role.isSystem,
    isActive: role.isActive,
    createdAt: role.createdAt.toISOString(),
    updatedAt: role.updatedAt.toISOString(),
    createdBy: role.createdBy,
    permissions: role.permissions,
  };
}

/**
 * Convert array of Role entities to DTOs
 *
 * @param roles - Array of domain Role entities
 * @returns Array of RoleDTOs for UI consumption
 */
export function presentRoles(roles: Role[]): RoleDTO[] {
  return roles.map(presentRole);
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
