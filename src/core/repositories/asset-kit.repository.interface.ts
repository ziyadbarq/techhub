import type { AssetKit } from "@/core/domain/entities/asset-kit.entity";
import type { KitType } from "@/core/domain/entities/asset-kit.entity";

export interface IAssetKitRepository {
  /**
   * Create a new asset kit
   */
  create(kit: AssetKit): Promise<AssetKit>;

  /**
   * Find kit by ID
   */
  findById(id: string): Promise<AssetKit | null>;

  /**
   * Find kit by code
   */
  findByCode(code: string): Promise<AssetKit | null>;

  /**
   * Check if code already exists (for validation)
   */
  codeExists(code: string, excludeId?: string): Promise<boolean>;

  /**
   * Find all kits with optional pagination
   */
  findAll(options?: {
    skip?: number;
    take?: number;
    orderBy?: "name" | "code" | "createdAt";
    order?: "asc" | "desc";
  }): Promise<AssetKit[]>;

  /**
   * Find kits by type
   */
  findByType(
    type: KitType,
    options?: { skip?: number; take?: number },
  ): Promise<AssetKit[]>;

  /**
   * Find active kits
   */
  findActive(options?: { skip?: number; take?: number }): Promise<AssetKit[]>;

  /**
   * Find inactive kits
   */
  findInactive(options?: { skip?: number; take?: number }): Promise<AssetKit[]>;

  /**
   * Search kits by name or code
   */
  search(
    query: string,
    options?: {
      skip?: number;
      take?: number;
    },
  ): Promise<AssetKit[]>;

  /**
   * Update a kit
   */
  update(kit: AssetKit): Promise<AssetKit>;

  /**
   * Delete a kit
   */
  delete(id: string): Promise<void>;

  /**
   * Count kits by type
   */
  countByType(type: KitType): Promise<number>;

  /**
   * Count active kits
   */
  countActive(): Promise<number>;

  /**
   * Count total kits
   */
  count(): Promise<number>;
}
