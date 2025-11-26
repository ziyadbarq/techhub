/**
 * AssetModel Presenter
 */

import type { AssetModel } from "@/core/domain/entities/asset-model.entity";

export interface AssetModelDTO {
  id: string;
  assetCategoryId: string;
  vendorId: string;
  name: string;
  code: string;
  description: string | null;
  defaultWarrantyMonths: number | null;
  defaultAttributes: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
  // Display fields (enriched from relations)
  categoryName?: string | null;
  vendorName?: string | null;
}

export interface AssetModelEnrichment {
  categoryName?: string | null;
  vendorName?: string | null;
}

export function presentAssetModel(
  assetModel: AssetModel,
  enrichment?: AssetModelEnrichment,
): AssetModelDTO {
  return {
    id: assetModel.id,
    assetCategoryId: assetModel.assetCategoryId,
    vendorId: assetModel.vendorId,
    name: assetModel.name,
    code: assetModel.code,
    description: assetModel.description,
    defaultWarrantyMonths: assetModel.defaultWarrantyMonths,
    defaultAttributes: assetModel.defaultAttributes,
    createdAt: assetModel.createdAt.toISOString(),
    updatedAt: assetModel.updatedAt.toISOString(),
    // Display fields
    categoryName: enrichment?.categoryName,
    vendorName: enrichment?.vendorName,
  };
}

export function presentAssetModels(
  assetModels: AssetModel[],
  enrichmentMap?: Map<string, AssetModelEnrichment>,
): AssetModelDTO[] {
  return assetModels.map((model) =>
    presentAssetModel(model, enrichmentMap?.get(model.id)),
  );
}
