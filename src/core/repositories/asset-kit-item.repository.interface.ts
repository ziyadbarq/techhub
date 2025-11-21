import type { AssetKitItem } from "@/core/domain/entities/asset-kit-item.entity";

export interface IAssetKitItemRepository {
  /**
   * Create a new kit item
   */
  create(item: AssetKitItem): Promise<AssetKitItem>;

  /**
   * Find item by ID
   */
  findById(id: string): Promise<AssetKitItem | null>;

  /**
   * Find all items in a kit
   */
  findByKitId(kitId: string): Promise<AssetKitItem[]>;

  /**
   * Find items by asset category
   */
  findByCategoryId(
    categoryId: string,
    options?: { skip?: number; take?: number },
  ): Promise<AssetKitItem[]>;

  /**
   * Find items by asset model
   */
  findByModelId(
    modelId: string,
    options?: { skip?: number; take?: number },
  ): Promise<AssetKitItem[]>;

  /**
   * Find required items in a kit
   */
  findRequiredByKitId(kitId: string): Promise<AssetKitItem[]>;

  /**
   * Find optional items in a kit
   */
  findOptionalByKitId(kitId: string): Promise<AssetKitItem[]>;

  /**
   * Check if a kit has a specific category
   */
  kitHasCategory(kitId: string, categoryId: string): Promise<boolean>;

  /**
   * Check if a kit has a specific model
   */
  kitHasModel(kitId: string, modelId: string): Promise<boolean>;

  /**
   * Get total quantity needed for a kit
   */
  getTotalQuantityByKitId(kitId: string): Promise<number>;

  /**
   * Update a kit item
   */
  update(item: AssetKitItem): Promise<AssetKitItem>;

  /**
   * Delete a kit item
   */
  delete(id: string): Promise<void>;

  /**
   * Delete all items in a kit
   */
  deleteByKitId(kitId: string): Promise<void>;

  /**
   * Count items in a kit
   */
  countByKitId(kitId: string): Promise<number>;

  /**
   * Count required items in a kit
   */
  countRequiredByKitId(kitId: string): Promise<number>;
}
