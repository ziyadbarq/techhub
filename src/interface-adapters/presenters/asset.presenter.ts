/**
 * Asset Presenter
 * Transforms Asset domain entities to DTOs for presentation layer
 */

import type { Asset } from "@/core/domain/entities/asset.entity";

export interface AssetDTO {
  id: string;
  assetTag: string;
  assetCategoryId: string;
  assetModelId: string | null;
  vendorId: string | null;
  contractId: string | null;
  lifecycleStateId: string | null;
  serialNumber: string | null;
  purchaseDate: string | null;
  purchaseCost: number | null;
  currency: string | null;
  depreciationModel: string | null;
  depreciationStart: string | null;
  depreciationEnd: string | null;
  warrantyEndDate: string | null;
  currentStockLocationId: string | null;
  attributes: Record<string, unknown> | null;
  note: string | null;
  createdAt: string;
  updatedAt: string;
  // Computed fields
  isUnderWarranty: boolean;
  isDepreciated: boolean;
  isFullyDepreciated: boolean;
  // Display fields (enriched from relations)
  categoryName?: string | null;
  modelName?: string | null;
  vendorName?: string | null;
  stockLocationName?: string | null;
  lifecycleStateName?: string | null;
}

/**
 * Transform a single Asset to DTO
 */
export function presentAsset(
  asset: Asset,
  enrichment?: {
    categoryName?: string | null;
    modelName?: string | null;
    vendorName?: string | null;
    stockLocationName?: string | null;
    lifecycleStateName?: string | null;
  },
): AssetDTO {
  return {
    id: asset.id,
    assetTag: asset.assetTag,
    assetCategoryId: asset.assetCategoryId,
    assetModelId: asset.assetModelId,
    vendorId: asset.vendorId,
    contractId: asset.contractId,
    lifecycleStateId: asset.lifecycleStateId,
    serialNumber: asset.serialNumber,
    purchaseDate: asset.purchaseDate?.toISOString() || null,
    purchaseCost: asset.purchaseCost,
    currency: asset.currency,
    depreciationModel: asset.depreciationModel,
    depreciationStart: asset.depreciationStart?.toISOString() || null,
    depreciationEnd: asset.depreciationEnd?.toISOString() || null,
    warrantyEndDate: asset.warrantyEndDate?.toISOString() || null,
    currentStockLocationId: asset.currentStockLocationId,
    attributes: asset.attributes,
    note: asset.note,
    createdAt: asset.createdAt.toISOString(),
    updatedAt: asset.updatedAt.toISOString(),
    // Computed fields
    isUnderWarranty: asset.isUnderWarranty(),
    isDepreciated: asset.isDepreciated(),
    isFullyDepreciated: asset.isFullyDepreciated(),
    // Display fields
    categoryName: enrichment?.categoryName,
    modelName: enrichment?.modelName,
    vendorName: enrichment?.vendorName,
    stockLocationName: enrichment?.stockLocationName,
    lifecycleStateName: enrichment?.lifecycleStateName,
  };
}

/**
 * Transform an array of Assets to DTOs
 */
export function presentAssets(assets: Asset[]): AssetDTO[] {
  return assets.map((asset) => presentAsset(asset));
}
