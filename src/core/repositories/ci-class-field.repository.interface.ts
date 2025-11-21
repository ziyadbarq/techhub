/**
 * CIClassField Repository Interface
 */

import type { CIClassField } from "@/core/domain/entities/ci-class-field.entity";

export interface ICIClassFieldRepository {
  /**
   * Create a new CI class field
   */
  create(ciClassField: CIClassField): Promise<CIClassField>;

  /**
   * Find a CI class field by ID
   */
  findById(id: string): Promise<CIClassField | null>;

  /**
   * Find all CI class fields for a specific CI class
   */
  findByCIClassId(ciClassId: string): Promise<CIClassField[]>;

  /**
   * Find a specific field definition for a CI class
   */
  findByCIClassAndFieldDefinition(
    ciClassId: string,
    fieldDefinitionId: string,
  ): Promise<CIClassField | null>;

  /**
   * Find all fields using a specific field definition
   */
  findByFieldDefinitionId(fieldDefinitionId: string): Promise<CIClassField[]>;

  /**
   * Find all CI class fields
   */
  findAll(): Promise<CIClassField[]>;

  /**
   * Update a CI class field
   */
  update(ciClassField: CIClassField): Promise<CIClassField>;

  /**
   * Delete a CI class field
   */
  delete(id: string): Promise<void>;

  /**
   * Check if a CI class field exists
   */
  exists(ciClassId: string, fieldDefinitionId: string): Promise<boolean>;

  /**
   * Count fields for a CI class
   */
  countByCIClassId(ciClassId: string): Promise<number>;
}
