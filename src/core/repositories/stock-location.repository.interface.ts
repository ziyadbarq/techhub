/**
 * IStockLocationRepository Interface
 * Data access contract for stock locations
 */

import type { StockLocation } from "../domain/entities/stock-location.entity";

export interface IStockLocationRepository {
  /**
   * Create a new stock location
   */
  create(stockLocation: StockLocation): Promise<StockLocation>;

  /**
   * Find stock location by ID
   */
  findById(id: string): Promise<StockLocation | null>;

  /**
   * Find stock location by code
   */
  findByCode(code: string): Promise<StockLocation | null>;

  /**
   * Find stock locations by codes (batch lookup for import)
   * Used for duplicate detection in data import
   */
  findByCodes(codes: string[]): Promise<StockLocation[]>;

  /**
   * Find stock locations by location
   */
  findByLocation(locationId: string): Promise<StockLocation[]>;

  /**
   * Find all stock locations
   */
  findAll(options?: {
    skip?: number;
    take?: number;
    orderBy?: "name" | "code" | "createdAt";
    order?: "asc" | "desc";
  }): Promise<StockLocation[]>;

  /**
   * Count all stock locations
   */
  count(): Promise<number>;

  /**
   * Update stock location
   */
  update(stockLocation: StockLocation): Promise<StockLocation>;

  /**
   * Delete stock location
   */
  delete(id: string): Promise<void>;

  /**
   * Check if code exists (for uniqueness validation)
   */
  existsByCode(code: string, excludeId?: string): Promise<boolean>;

  /**
   * Check if has assets
   */
  hasAssets(id: string): Promise<boolean>;

  /**
   * Check if has stock movements
   */
  hasMovements(id: string): Promise<boolean>;
}
