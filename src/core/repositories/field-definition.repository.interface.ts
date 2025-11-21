/**
 * IFieldDefinitionRepository Interface
 * Data access contract for field definitions (meta-model)
 */

import type { FieldDefinition } from "../domain/entities/field-definition.entity";
import type { FieldDataTypeEnum } from "../domain/value-objects/foundation-enums";

export interface IFieldDefinitionRepository {
  /**
   * Create a new field definition
   */
  create(field: FieldDefinition): Promise<FieldDefinition>;

  /**
   * Find field definition by ID
   */
  findById(id: string): Promise<FieldDefinition | null>;

  /**
   * Find field definition by name
   */
  findByName(name: string): Promise<FieldDefinition | null>;

  /**
   * Find all field definitions by data type
   */
  findByDataType(dataType: FieldDataTypeEnum): Promise<FieldDefinition[]>;

  /**
   * Find global field definitions (reusable across domains)
   */
  findGlobal(options?: {
    dataType?: FieldDataTypeEnum;
  }): Promise<FieldDefinition[]>;

  /**
   * Find searchable field definitions
   */
  findSearchable(): Promise<FieldDefinition[]>;

  /**
   * Find filterable field definitions
   */
  findFilterable(): Promise<FieldDefinition[]>;

  /**
   * Find field definitions by UI group
   */
  findByUiGroup(uiGroup: string): Promise<FieldDefinition[]>;

  /**
   * Find all field definitions
   */
  findAll(options?: {
    skip?: number;
    take?: number;
    orderBy?: "name" | "label" | "dataType" | "uiOrder" | "createdAt";
    order?: "asc" | "desc";
  }): Promise<FieldDefinition[]>;

  /**
   * Search field definitions by name or label
   */
  search(
    query: string,
    options?: {
      skip?: number;
      take?: number;
      dataType?: FieldDataTypeEnum;
      globalOnly?: boolean;
    },
  ): Promise<FieldDefinition[]>;

  /**
   * Count all field definitions
   */
  count(): Promise<number>;

  /**
   * Count by data type
   */
  countByDataType(dataType: FieldDataTypeEnum): Promise<number>;

  /**
   * Update field definition
   */
  update(field: FieldDefinition): Promise<FieldDefinition>;

  /**
   * Delete field definition
   */
  delete(id: string): Promise<void>;

  /**
   * Check if field is in use (linked to CI classes, asset categories, etc.)
   */
  isInUse(id: string): Promise<boolean>;

  /**
   * Check if name exists (for uniqueness validation)
   */
  existsByName(name: string, excludeId?: string): Promise<boolean>;
}
