/**
 * AssetCategoryField Repository Interface
 */

import type { AssetCategoryField } from "@/core/domain/entities/asset-category-field.entity";

export interface IAssetCategoryFieldRepository {
  /**
   * Create a new asset category field
   */
  create(field: AssetCategoryField): Promise<AssetCategoryField>;

  /**
   * Find an asset category field by ID
   */
  findById(id: string): Promise<AssetCategoryField | null>;

  /**
   * Find all asset category fields for a specific asset category
   */
  findByAssetCategoryId(assetCategoryId: string): Promise<AssetCategoryField[]>;

  /**
   * Find a specific field definition for an asset category
   */
  findByAssetCategoryAndFieldDefinition(
    assetCategoryId: string,
    fieldDefinitionId: string,
  ): Promise<AssetCategoryField | null>;

  /**
   * Find all fields using a specific field definition
   */
  findByFieldDefinitionId(
    fieldDefinitionId: string,
  ): Promise<AssetCategoryField[]>;

  /**
   * Find all asset category fields
   */
  findAll(): Promise<AssetCategoryField[]>;

  /**
   * Update an asset category field
   */
  update(field: AssetCategoryField): Promise<AssetCategoryField>;

  /**
   * Delete an asset category field
   */
  delete(id: string): Promise<void>;

  /**
   * Check if an asset category field exists
   */
  exists(assetCategoryId: string, fieldDefinitionId: string): Promise<boolean>;

  /**
   * Count fields for an asset category
   */
  countByAssetCategoryId(assetCategoryId: string): Promise<number>;

  /**
   * Find fields by asset category ID with FieldDefinition included
   * Returns fields with nested fieldDefinition for UI enrichment
   * Note: Returns raw Prisma types - caller should cast appropriately
   */
  findByAssetCategoryIdWithDefinition(assetCategoryId: string): Promise<
    Array<{
      id: string;
      assetCategoryId: string;
      fieldDefinitionId: string;
      isRequired: boolean;
      isUnique: boolean;
      isVisible: boolean;
      defaultValue: unknown;
      uiOrder: number;
      createdAt: Date;
      updatedAt: Date;
      fieldDefinition: {
        id: string;
        name: string;
        label: string;
        description: string | null;
        dataType: string;
        enumOptions: unknown;
        validationRules: unknown;
        defaultValue: unknown;
        uiGroup: string | null;
      };
    }>
  >;
}
