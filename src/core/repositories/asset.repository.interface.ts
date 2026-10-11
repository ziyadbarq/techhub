/**
 * Asset Repository Interface
 * Defines data access patterns for Asset entities
 */

import type { Asset } from "../domain/entities/asset.entity";

export interface AssetSearchOptions {
  assetCategoryId?: string;
  assetModelId?: string;
  vendorId?: string;
  lifecycleStateId?: string;
  currentStockLocationId?: string;
  owningOrgUnitId?: string;
  contractId?: string;
  searchTerm?: string; // Search in assetTag, serialNumber, note
  depreciationStatus?: "active" | "complete" | "none"; // Filter by depreciation status
  sortBy?: "assetTag" | "createdAt" | "purchaseDate" | "purchaseCost";
  sortOrder?: "asc" | "desc";
  limit?: number;
  offset?: number;
}

/**
 * Generic paginated result wrapper
 */
export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * Asset statistics for summary cards
 */
export interface AssetStatistics {
  total: number;
  assigned: number;
  available: number;
}

export interface AssetDepreciationSnapshot {
  assetTag: string;
  assetCategoryName: string | null;
  purchaseDate: Date | null;
  depreciationEnd: Date | null;
}

export interface AssetCategoryValueSummary {
  categoryId: string;
  categoryName: string | null;
  assetCount: number;
  totalPurchaseCostSar: number;
}

export interface UnassignedAssetSnapshot {
  assetTag: string;
  assetCategoryName: string | null;
  stockLocationName: string | null;
  purchaseDate: Date | null;
}

export interface IAssetRepository {
  /**
   * Create a new asset
   */
  create(asset: Asset): Promise<Asset>;

  /**
   * Find asset by ID
   */
  findById(id: string): Promise<Asset | null>;

  /**
   * Find multiple assets by IDs (batch fetch)
   */
  findByIds(ids: string[]): Promise<Asset[]>;

  /**
   * Find asset by asset tag (unique identifier)
   */
  findByAssetTag(assetTag: string): Promise<Asset | null>;

  /**
   * Find multiple assets by asset tags (batch lookup for duplicate detection)
   */
  findByAssetTags(assetTags: string[]): Promise<Asset[]>;

  /**
   * Find asset by serial number (unique)
   */
  findBySerialNumber(serialNumber: string): Promise<Asset | null>;

  /**
   * Find multiple assets by serial numbers (batch lookup for duplicate detection)
   */
  findBySerialNumbers(serialNumbers: string[]): Promise<Asset[]>;

  /**
   * Find all assets by category
   */
  findByAssetCategory(assetCategoryId: string): Promise<Asset[]>;

  /**
   * Find all assets by model
   */
  findByAssetModel(assetModelId: string): Promise<Asset[]>;

  /**
   * Find all assets by vendor
   */
  findByVendor(vendorId: string): Promise<Asset[]>;

  /**
   * Find all assets by lifecycle state
   */
  findByLifecycleState(lifecycleStateId: string): Promise<Asset[]>;

  /**
   * Find all assets at a specific stock location
   */
  findByStockLocation(stockLocationId: string): Promise<Asset[]>;

  /**
   * Find all assets under a contract
   */
  findByContract(contractId: string): Promise<Asset[]>;

  /**
   * Find all assets being depreciated
   */
  findDepreciating(): Promise<Asset[]>;

  /**
   * Find all assets fully depreciated
   */
  findFullyDepreciated(): Promise<Asset[]>;

  /**
   * Find all assets (with pagination)
   */
  findAll(limit?: number, offset?: number): Promise<Asset[]>;

  /**
   * Search assets with advanced filters
   */
  search(options: AssetSearchOptions): Promise<Asset[]>;

  /**
   * Count total assets
   */
  count(): Promise<number>;

  /**
   * Count assets by search criteria
   */
  countBySearch(options: AssetSearchOptions): Promise<number>;

  /**
   * Minimal projection for depreciation/EOL reporting
   */
  findDepreciationSnapshot(): Promise<AssetDepreciationSnapshot[]>;

  /**
   * Aggregated totals by category (SAR normalized)
   */
  findCategoryValueSummary(): Promise<AssetCategoryValueSummary[]>;

  /**
   * Assets without an active assignment
   */
  findUnassignedAssetsSnapshot(now?: Date): Promise<UnassignedAssetSnapshot[]>;

  /**
   * Update an existing asset
   */
  update(asset: Asset): Promise<Asset>;

  /**
   * Delete an asset
   */
  delete(id: string): Promise<void>;

  /**
   * Check if asset tag exists
   */
  existsByAssetTag(assetTag: string, excludeId?: string): Promise<boolean>;

  /**
   * Check if serial number exists
   */
  existsBySerialNumber(
    serialNumber: string,
    excludeId?: string,
  ): Promise<boolean>;

  /**
   * Search assets with pagination - returns items and metadata
   */
  searchPaginated(options: AssetSearchOptions): Promise<PaginatedResult<Asset>>;

  /**
   * Get asset statistics for summary cards
   */
  getStatistics(
    filters?: Omit<
      AssetSearchOptions,
      "limit" | "offset" | "sortBy" | "sortOrder"
    >,
  ): Promise<AssetStatistics>;

  /**
   * Delete multiple assets by IDs
   * Returns count of deleted assets
   */
  deleteMany(ids: string[]): Promise<number>;

  /**
   * Update lifecycle state for multiple assets
   * Returns count of updated assets
   */
  updateLifecycleStateMany(
    ids: string[],
    lifecycleStateId: string,
  ): Promise<number>;

  /**
   * Soft delete an asset (set deletedAt)
   */
  updateSoftDelete(id: string): Promise<void>;
}
