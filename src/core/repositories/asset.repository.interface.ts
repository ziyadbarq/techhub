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
  contractId?: string;
  searchTerm?: string; // Search in assetTag, serialNumber, note
  warrantyStatus?: "active" | "expired" | "none"; // Filter by warranty status
  depreciationStatus?: "active" | "complete" | "none"; // Filter by depreciation status
  limit?: number;
  offset?: number;
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
   * Find all assets with active warranty
   */
  findWithActiveWarranty(): Promise<Asset[]>;

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
   * Check if asset has assignments
   */
  hasAssignments(id: string): Promise<boolean>;

  /**
   * Check if asset has stock movements
   */
  hasStockMovements(id: string): Promise<boolean>;
}
