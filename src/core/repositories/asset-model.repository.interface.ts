/**
 * IAssetModelRepository Interface
 * Data access contract for asset models
 */

import type { AssetModel } from "../domain/entities/asset-model.entity";

export interface IAssetModelRepository {
  create(assetModel: AssetModel): Promise<AssetModel>;
  findById(id: string): Promise<AssetModel | null>;
  findByCode(code: string): Promise<AssetModel | null>;
  findByAssetCategory(assetCategoryId: string): Promise<AssetModel[]>;
  findByVendor(vendorId: string): Promise<AssetModel[]>;
  findAll(options?: {
    skip?: number;
    take?: number;
    orderBy?: "name" | "code" | "createdAt";
    order?: "asc" | "desc";
  }): Promise<AssetModel[]>;
  search(
    query: string,
    options?: {
      skip?: number;
      take?: number;
      assetCategoryId?: string;
      vendorId?: string;
    },
  ): Promise<AssetModel[]>;
  count(): Promise<number>;
  countAssets(id: string): Promise<number>;
  update(assetModel: AssetModel): Promise<AssetModel>;
  delete(id: string): Promise<void>;
  hasAssets(id: string): Promise<boolean>;
  existsByCode(code: string, excludeId?: string): Promise<boolean>;
}
