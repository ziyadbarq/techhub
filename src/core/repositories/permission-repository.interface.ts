/**
 * Permission Repository Interface
 * Defines operations for permission persistence
 */

import type { Permission } from "../domain/entities/permission.entity";

export interface IPermissionRepository {
  /**
   * Find permission by ID
   */
  findById(id: string): Promise<Permission | null>;

  /**
   * Find permission by name (resource:action)
   */
  findByName(name: string): Promise<Permission | null>;

  /**
   * Find all permissions
   */
  findAll(params?: { includeInactive?: boolean }): Promise<Permission[]>;

  /**
   * Find permissions by IDs
   */
  findByIds(ids: string[]): Promise<Permission[]>;

  /**
   * Find permissions by resource
   */
  findByResource(resource: string): Promise<Permission[]>;

  /**
   * Find permissions by names
   */
  findByNames(names: string[]): Promise<Permission[]>;

  /**
   * Create a new permission
   */
  create(permission: Permission): Promise<Permission>;

  /**
   * Update an existing permission
   */
  update(permission: Permission): Promise<Permission>;

  /**
   * Delete a permission
   */
  delete(id: string): Promise<void>;

  /**
   * Check if permission exists by name
   */
  existsByName(name: string): Promise<boolean>;
}
