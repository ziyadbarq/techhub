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
}

export function presentAssetModel(assetModel: AssetModel): AssetModelDTO {
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
  };
}

export function presentAssetModels(assetModels: AssetModel[]): AssetModelDTO[] {
  return assetModels.map(presentAssetModel);
}
