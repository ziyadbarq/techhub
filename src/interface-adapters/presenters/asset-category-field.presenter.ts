/**
 * Asset Category Field Presenter
 * Transforms Asset Category Field entities to DTOs for the presentation layer
 */

import type { AssetCategoryField } from "@/core/domain/entities/asset-category-field.entity";

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
}
