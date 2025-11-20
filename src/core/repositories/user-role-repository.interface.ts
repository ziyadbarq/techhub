/**
 * UserRole Repository Interface
 * Defines operations for user-role assignment persistence
 */

import type { UserRole } from "../domain/entities/user-role.entity";
import type { PermissionKey } from "../domain/value-objects/permission-key";

export interface IUserRoleRepository {
  /**
   * Find user role assignment by ID
   */
  findById(id: string): Promise<UserRole | null>;

  /**
   * Find all roles for a user
   */
  findByUserId(userId: string): Promise<UserRole[]>;

  /**
   * Find all users with a role
   */
  findByRoleId(roleId: string): Promise<UserRole[]>;

  /**
   * Find specific user-role assignment
   */
  findByUserIdAndRoleId(
    userId: string,
    roleId: string,
  ): Promise<UserRole | null>;

  /**
   * Get all permissions for a user (aggregated from all roles)
   */
  getUserPermissions(userId: string): Promise<PermissionKey[]>;

  /**
   * Check if user has a specific role
   */
  hasRole(userId: string, roleId: string): Promise<boolean>;

  /**
   * Check if user has a specific permission
   */
  hasPermission(userId: string, permission: PermissionKey): Promise<boolean>;

  /**
   * Create a new user-role assignment
   */
  create(userRole: UserRole): Promise<UserRole>;

  /**
   * Delete a user-role assignment
   */
  delete(id: string): Promise<void>;

  /**
   * Delete by user ID and role ID
   */
  deleteByUserIdAndRoleId(userId: string, roleId: string): Promise<void>;

  /**
   * Delete all role assignments for a user
   */
  deleteByUserId(userId: string): Promise<void>;

  /**
   * Update expiration for a user-role assignment
   */
  updateExpiration(id: string, expiresAt?: Date): Promise<UserRole>;
}
