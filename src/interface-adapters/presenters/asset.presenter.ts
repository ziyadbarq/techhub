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
  purchaseCostSar: number | null;
  currency: string | null;
  depreciationModel: string | null;
  depreciationStart: string | null;
  depreciationEnd: string | null;
  condition: string | null;
  currentStockLocationId: string | null;
  owningOrgUnitId: string | null;
  attributes: Record<string, unknown> | null;
  note: string | null;
  createdAt: string;
  updatedAt: string;
  // Computed fields
  isDepreciated: boolean;
  isFullyDepreciated: boolean;
  // Display fields (enriched from relations)
  categoryName?: string | null;
  modelName?: string | null;
  vendorName?: string | null;
  stockLocationName?: string | null;
  lifecycleStateName?: string | null;
  assignedUserName?: string | null;
  assignedUserEmail?: string | null;
  hostName?: string | null;
  owningCompanyName?: string | null;
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
    assignedUserName?: string | null;
    assignedUserEmail?: string | null;
    hostName?: string | null;
    owningCompanyName?: string | null;
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
    purchaseCostSar: asset.purchaseCostSar,
    currency: asset.currency,
    depreciationModel: asset.depreciationModel,
    depreciationStart: asset.depreciationStart?.toISOString() || null,
    depreciationEnd: asset.depreciationEnd?.toISOString() || null,
    condition: asset.condition,
    currentStockLocationId: asset.currentStockLocationId,
    owningOrgUnitId: asset.owningOrgUnitId,
    attributes: asset.attributes,
    note: asset.note,
    createdAt: asset.createdAt.toISOString(),
    updatedAt: asset.updatedAt.toISOString(),
    // Computed fields
    isDepreciated: asset.isDepreciated(),
    isFullyDepreciated: asset.isFullyDepreciated(),
    // Display fields
    categoryName: enrichment?.categoryName,
    modelName: enrichment?.modelName,
    vendorName: enrichment?.vendorName,
    stockLocationName: enrichment?.stockLocationName,
    lifecycleStateName: enrichment?.lifecycleStateName,
    assignedUserName: enrichment?.assignedUserName,
    assignedUserEmail: enrichment?.assignedUserEmail,
    hostName: enrichment?.hostName,
    owningCompanyName: enrichment?.owningCompanyName,
  };
}

/**
 * Transform an array of Assets to DTOs
 */
export function presentAssets(assets: Asset[]): AssetDTO[] {
  return assets.map((asset) => presentAsset(asset));
}
