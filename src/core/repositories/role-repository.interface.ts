/**
 * Role Repository Interface
 * Defines operations for role persistence
 */

import type { Role } from "../domain/entities/role.entity";
import type { PermissionKey } from "../domain/value-objects/permission-key";

export interface IRoleRepository {
  /**
   * Find role by ID
   */
  findById(id: string): Promise<Role | null>;

  /**
   * Find role by name
   */
  findByName(name: string): Promise<Role | null>;

  /**
   * Find all roles
   */
  findAll(params?: { includeInactive?: boolean }): Promise<Role[]>;

  /**
   * Find roles by IDs
   */
  findByIds(ids: string[]): Promise<Role[]>;

  /**
   * Get all permissions for a role
   */
  getRolePermissions(roleId: string): Promise<PermissionKey[]>;

  /**
   * Create a new role
   */
  create(role: Role): Promise<Role>;

  /**
   * Update an existing role
   */
  update(role: Role): Promise<Role>;

  /**
   * Delete a role
   */
  delete(id: string): Promise<void>;

  /**
   * Assign permissions to a role
   */
  assignPermissions(roleId: string, permissionIds: string[]): Promise<void>;

  /**
   * Remove permissions from a role
   */
  removePermissions(roleId: string, permissionIds: string[]): Promise<void>;

  /**
   * Remove all permissions from a role
   */
  removeAllPermissions(roleId: string): Promise<void>;

  /**
   * Check if role exists by name
   */
  existsByName(name: string): Promise<boolean>;
}
