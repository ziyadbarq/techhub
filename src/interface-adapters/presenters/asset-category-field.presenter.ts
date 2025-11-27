/**
 * Asset Category Field Presenter
 * Transforms Asset Category Field entities to DTOs for the presentation layer
 */

import type { AssetCategoryField } from "@/core/domain/entities/asset-category-field.entity";
import type { FieldDataTypeEnum } from "@/core/domain/value-objects/foundation-enums";
import type { ValidationRules } from "@/core/domain/entities/field-definition.entity";

/**
 * Basic DTO without FieldDefinition enrichment
 */
export interface AssetCategoryFieldDTO {
  id: string;
  assetCategoryId: string;
  fieldDefinitionId: string;
  isRequired: boolean;
  isUnique: boolean;
  isVisible: boolean;
  defaultValue: Record<string, unknown> | null;
  uiOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Enriched DTO with FieldDefinition details for UI rendering
 */
export interface EnrichedAssetCategoryFieldDTO extends AssetCategoryFieldDTO {
  // FieldDefinition properties
  fieldName: string;
  fieldLabel: string;
  fieldDescription: string | null;
  dataType: FieldDataTypeEnum;
  enumOptions: string[] | null;
  validationRules: ValidationRules | null;
  fieldDefaultValue: unknown;
  uiGroup: string | null;
}

/**
 * Input for creating enriched DTOs from repository with included FieldDefinition
 * Uses `unknown` for JSON fields to match Prisma's raw return types
 */
export interface AssetCategoryFieldWithDefinition {
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
    dataType: FieldDataTypeEnum | string;
    enumOptions: unknown;
    validationRules: unknown;
    defaultValue: unknown;
    uiGroup: string | null;
  };
}

export class AssetCategoryFieldPresenter {
  static toDTO(field: AssetCategoryField): AssetCategoryFieldDTO {
    return {
      id: field.id,
      assetCategoryId: field.assetCategoryId,
      fieldDefinitionId: field.fieldDefinitionId,
      isRequired: field.isRequired,
      isUnique: field.isUnique,
      isVisible: field.isVisible,
      defaultValue: field.defaultValue,
      uiOrder: field.uiOrder,
      createdAt: field.createdAt,
      updatedAt: field.updatedAt,
    };
  }

  static toDTOList(fields: AssetCategoryField[]): AssetCategoryFieldDTO[] {
    return fields.map((field) => this.toDTO(field));
  }

  /**
   * Convert to enriched DTO with FieldDefinition details
   */
  static toEnrichedDTO(
    field: AssetCategoryFieldWithDefinition,
  ): EnrichedAssetCategoryFieldDTO {
    return {
      id: field.id,
      assetCategoryId: field.assetCategoryId,
      fieldDefinitionId: field.fieldDefinitionId,
      isRequired: field.isRequired,
      isUnique: field.isUnique,
      isVisible: field.isVisible,
      defaultValue: field.defaultValue as Record<string, unknown> | null,
      uiOrder: field.uiOrder,
      createdAt: field.createdAt,
      updatedAt: field.updatedAt,
      // FieldDefinition properties
      fieldName: field.fieldDefinition.name,
      fieldLabel: field.fieldDefinition.label,
      fieldDescription: field.fieldDefinition.description,
      dataType: field.fieldDefinition.dataType as FieldDataTypeEnum,
      enumOptions: field.fieldDefinition.enumOptions as string[] | null,
      validationRules: field.fieldDefinition
        .validationRules as ValidationRules | null,
      fieldDefaultValue: field.fieldDefinition.defaultValue,
      uiGroup: field.fieldDefinition.uiGroup,
    };
  }

  static toEnrichedDTOList(
    fields: AssetCategoryFieldWithDefinition[],
  ): EnrichedAssetCategoryFieldDTO[] {
    return fields.map((field) => this.toEnrichedDTO(field));
  }
}
