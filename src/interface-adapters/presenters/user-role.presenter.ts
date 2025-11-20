/**
 * UserRole Presenter
 *
 * Transforms UserRole domain entities into DTOs for the UI layer.
 * Ensures clean separation between domain and presentation.
 */

import type { UserRole } from "@/core/domain/entities/user-role.entity";

/**
 * UserRole DTO for presentation layer
 */
export interface UserRoleDTO {
  id: string;
  userId: string;
  roleId: string;
  expiresAt?: string;
  createdAt: string;
  createdBy?: string;
  isActive: boolean;
  isExpired: boolean;
}

/**
 * Convert UserRole entity to DTO
 *
 * @param userRole - Domain UserRole entity
 * @returns UserRoleDTO for UI consumption
 */
export function presentUserRole(userRole: UserRole): UserRoleDTO {
  return {
    id: userRole.id,
    userId: userRole.userId,
    roleId: userRole.roleId,
    expiresAt: userRole.expiresAt?.toISOString(),
    createdAt: userRole.createdAt.toISOString(),
    createdBy: userRole.createdBy,
    isActive: userRole.isActive(),
    isExpired: userRole.isExpired(),
  };
}

/**
 * Convert array of UserRole entities to DTOs
 *
 * @param userRoles - Array of domain UserRole entities
 * @returns Array of UserRoleDTOs for UI consumption
 */
export function presentUserRoles(userRoles: UserRole[]): UserRoleDTO[] {
  return userRoles.map(presentUserRole);
}
