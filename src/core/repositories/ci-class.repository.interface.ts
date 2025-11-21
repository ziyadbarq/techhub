/**
 * CIClass Repository Interface
 * Defines data access operations for CI classes
 */

import type { CIClass } from "../domain/entities/ci-class.entity";

export interface ICIClassRepository {
  /**
   * Create a new CI class
   */
  create(ciClass: CIClass): Promise<CIClass>;

  /**
   * Find CI class by ID
   */
  findById(id: string): Promise<CIClass | null>;

  /**
   * Find CI class by code
   */
  findByCode(code: string): Promise<CIClass | null>;

  /**
   * Find all CI classes
   */
  findAll(): Promise<CIClass[]>;

  /**
   * Find root CI classes (no parent)
   */
  findRootClasses(): Promise<CIClass[]>;

  /**
   * Find child classes of a parent class
   */
  findChildClasses(parentId: string): Promise<CIClass[]>;

  /**
   * Update an existing CI class
   */
  update(ciClass: CIClass): Promise<CIClass>;

  /**
   * Delete a CI class by ID
   */
  delete(id: string): Promise<void>;

  /**
   * Check if a CI class name already exists
   */
  existsByName(name: string, excludeId?: string): Promise<boolean>;

  /**
   * Check if a CI class code already exists
   */
  existsByCode(code: string, excludeId?: string): Promise<boolean>;
}
