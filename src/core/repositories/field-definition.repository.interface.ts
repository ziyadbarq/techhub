/**
 * IFieldDefinitionRepository Interface
 * Data access contract for field definitions (meta-model)
 */

import type { FieldDefinition } from "../domain/entities/field-definition.entity";
import type { FieldDataTypeEnum } from "../domain/value-objects/foundation-enums";

/**
 * Detailed usage statistics for a field definition
 */
export interface FieldUsageStatistics {
  /** Whether the field is in use anywhere */
  isInUse: boolean;
  /** Number of asset categories using this field */
  assetCategoryCount: number;
  /** Number of CI classes using this field */
  ciClassCount: number;
  /** Number of license products using this field */
  licenseProductCount: number;
  /** Number of assets with values for this field */
  assetValueCount: number;
  /** Number of configuration items with values for this field */
  ciValueCount: number;
  /** Number of license entitlements with values for this field */
  licenseValueCount: number;
  /** Total usage count across all usages */
  totalUsageCount: number;
  /** Details of which categories/classes use this field */
  usageDetails: {
    assetCategories: Array<{ id: string; name: string }>;
    ciClasses: Array<{ id: string; name: string }>;
    licenseProducts: Array<{ id: string; name: string }>;
  };
}

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
    includeDeleted?: boolean;
    includeArchived?: boolean;
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
   * Get detailed usage statistics for a field definition
   * Returns counts of where the field is used and which entities have values
   */
  getUsageStatistics(id: string): Promise<FieldUsageStatistics>;

  /**
   * Check if name exists (for uniqueness validation)
   */
  existsByName(name: string, excludeId?: string): Promise<boolean>;

  // Soft delete methods

  /**
   * Soft delete a field definition
   */
  softDelete(id: string, deletedById: string): Promise<void>;

  /**
   * Restore a soft-deleted field definition
   */
  restore(id: string): Promise<FieldDefinition>;

  /**
   * Archive a field definition (for unused but preserved fields)
   */
  archive(
    id: string,
    archivedById: string,
    reason?: string,
  ): Promise<FieldDefinition>;

  /**
   * Unarchive a field definition
   */
  unarchive(id: string): Promise<FieldDefinition>;

  /**
   * Find all soft-deleted field definitions
   */
  findDeleted(): Promise<FieldDefinition[]>;

  /**
   * Find all archived field definitions
   */
  findArchived(): Promise<FieldDefinition[]>;
}
