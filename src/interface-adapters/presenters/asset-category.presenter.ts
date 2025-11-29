/**
 * AssetCategory Presenter
 * Transforms AssetCategory domain entities into DTOs for the UI layer
 */

import type { AssetCategory } from "@/core/domain/entities/asset-category.entity";

export interface AssetCategoryDTO {
  id: string;
  name: string;
  code: string;
  description: string | null;
  lifecycleModelId: string | null;
  createdAt: string;
  updatedAt: string;
}

export function presentAssetCategory(
  assetCategory: AssetCategory,
): AssetCategoryDTO {
  return {
    id: assetCategory.id,
    name: assetCategory.name,
    code: assetCategory.code,
    description: assetCategory.description,
    lifecycleModelId: assetCategory.lifecycleModelId,
    createdAt: assetCategory.createdAt.toISOString(),
    updatedAt: assetCategory.updatedAt.toISOString(),
  };
}

export function presentAssetCategories(
  assetCategories: AssetCategory[],
): AssetCategoryDTO[] {
  return assetCategories.map(presentAssetCategory);
}
