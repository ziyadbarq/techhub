/**
 * IAssetCategoryRepository Interface
 * Data access contract for asset categories
 */

import type { AssetCategory } from "../domain/entities/asset-category.entity";

export interface IAssetCategoryRepository {
  /**
   * Create a new asset category
   */
  create(assetCategory: AssetCategory): Promise<AssetCategory>;

  /**
   * Find asset category by ID
   */
  findById(id: string): Promise<AssetCategory | null>;

  /**
   * Find asset category by code
   */
  findByCode(code: string): Promise<AssetCategory | null>;

  /**
   * Find asset categories by codes (batch lookup for import)
   * Used for duplicate detection in data import
   */
  findByCodes(codes: string[]): Promise<AssetCategory[]>;

  /**
   * Find asset category by name
   */
  findByName(name: string): Promise<AssetCategory | null>;

  /**
   * Find asset categories by lifecycle model
   */
  findByLifecycleModel(lifecycleModelId: string): Promise<AssetCategory[]>;

  /**
   * Find consumable categories
   */
  findConsumable(): Promise<AssetCategory[]>;

  /**
   * Find non-consumable categories
   */
  findNonConsumable(): Promise<AssetCategory[]>;

  /**
   * Find all asset categories
   */
  findAll(options?: {
    skip?: number;
    take?: number;
    orderBy?: "name" | "code" | "createdAt";
    order?: "asc" | "desc";
  }): Promise<AssetCategory[]>;

  /**
   * Search asset categories by name or code
   */
  search(
    query: string,
    options?: {
      skip?: number;
      take?: number;
      isConsumable?: boolean;
    },
  ): Promise<AssetCategory[]>;

  /**
   * Count all asset categories
   */
  count(): Promise<number>;

  /**
   * Count asset models in category
   */
  countAssetModels(id: string): Promise<number>;

  /**
   * Count assets in category
   */
  countAssets(id: string): Promise<number>;

  /**
   * Update asset category
   */
  update(assetCategory: AssetCategory): Promise<AssetCategory>;

  /**
   * Delete asset category
   */
  delete(id: string): Promise<void>;

  /**
   * Check if has asset models
   */
  hasAssetModels(id: string): Promise<boolean>;

  /**
   * Check if has assets
   */
  hasAssets(id: string): Promise<boolean>;

  /**
   * Check if code exists (for uniqueness validation)
   */
  existsByCode(code: string, excludeId?: string): Promise<boolean>;

  /**
   * Check if name exists (for uniqueness validation)
   */
  existsByName(name: string, excludeId?: string): Promise<boolean>;
}
