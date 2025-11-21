import type { AssetKitCheckoutItem } from "@/core/domain/entities/asset-kit-checkout-item.entity";
import type { KitCheckoutItemStatus } from "@/core/domain/entities/asset-kit-checkout-item.entity";

export interface IAssetKitCheckoutItemRepository {
  /**
   * Create a new checkout item
   */
  create(item: AssetKitCheckoutItem): Promise<AssetKitCheckoutItem>;

  /**
   * Find item by ID
   */
  findById(id: string): Promise<AssetKitCheckoutItem | null>;

  /**
   * Find all items for a checkout
   */
  findByCheckoutId(checkoutId: string): Promise<AssetKitCheckoutItem[]>;

  /**
   * Find checkout items by asset ID
   */
  findByAssetId(
    assetId: string,
    options?: { skip?: number; take?: number },
  ): Promise<AssetKitCheckoutItem[]>;

  /**
   * Find items by status
   */
  findByStatus(
    status: KitCheckoutItemStatus,
    options?: { skip?: number; take?: number },
  ): Promise<AssetKitCheckoutItem[]>;

  /**
   * Find checked out items (not returned)
   */
  findCheckedOut(options?: {
    skip?: number;
    take?: number;
  }): Promise<AssetKitCheckoutItem[]>;

  /**
   * Find items with condition issues (damaged or lost)
   */
  findWithIssues(options?: {
    skip?: number;
    take?: number;
  }): Promise<AssetKitCheckoutItem[]>;

  /**
   * Find damaged items
   */
  findDamaged(options?: {
    skip?: number;
    take?: number;
  }): Promise<AssetKitCheckoutItem[]>;

  /**
   * Find lost items
   */
  findLost(options?: {
    skip?: number;
    take?: number;
  }): Promise<AssetKitCheckoutItem[]>;

  /**
   * Check if asset is currently checked out in any kit
   */
  isAssetCheckedOut(assetId: string): Promise<boolean>;

  /**
   * Find current checkout for an asset
   */
  findActiveCheckoutForAsset(
    assetId: string,
  ): Promise<AssetKitCheckoutItem | null>;

  /**
   * Count items by status for a checkout
   */
  countByStatusForCheckout(
    checkoutId: string,
    status: KitCheckoutItemStatus,
  ): Promise<number>;

  /**
   * Count checked out items for a checkout
   */
  countCheckedOutForCheckout(checkoutId: string): Promise<number>;

  /**
   * Count returned items for a checkout
   */
  countReturnedForCheckout(checkoutId: string): Promise<number>;

  /**
   * Count items with issues for a checkout
   */
  countWithIssuesForCheckout(checkoutId: string): Promise<number>;

  /**
   * Update an item
   */
  update(item: AssetKitCheckoutItem): Promise<AssetKitCheckoutItem>;

  /**
   * Delete an item
   */
  delete(id: string): Promise<void>;

  /**
   * Delete all items for a checkout
   */
  deleteByCheckoutId(checkoutId: string): Promise<void>;

  /**
   * Count total items for a checkout
   */
  countByCheckoutId(checkoutId: string): Promise<number>;
}
