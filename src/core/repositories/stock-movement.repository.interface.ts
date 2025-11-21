/**
 * IStockMovementRepository Interface
 * Data access contract for stock movements
 */

import type {
  StockMovement,
  StockMovementType,
} from "../domain/entities/stock-movement.entity";

export interface IStockMovementRepository {
  /**
   * Create a new stock movement
   */
  create(stockMovement: StockMovement): Promise<StockMovement>;

  /**
   * Find stock movement by ID
   */
  findById(id: string): Promise<StockMovement | null>;

  /**
   * Find stock movements by asset
   */
  findByAsset(assetId: string): Promise<StockMovement[]>;

  /**
   * Find stock movements by stock location (from or to)
   */
  findByStockLocation(stockLocationId: string): Promise<StockMovement[]>;

  /**
   * Find stock movements by performed by user
   */
  findByPerformedBy(userId: string): Promise<StockMovement[]>;

  /**
   * Find stock movements by movement type
   */
  findByMovementType(movementType: StockMovementType): Promise<StockMovement[]>;

  /**
   * Find stock movements by date range
   */
  findByDateRange(startDate: Date, endDate: Date): Promise<StockMovement[]>;

  /**
   * Find all stock movements
   */
  findAll(options?: {
    skip?: number;
    take?: number;
    orderBy?: "occurredAt" | "createdAt" | "movementType";
    order?: "asc" | "desc";
  }): Promise<StockMovement[]>;

  /**
   * Count all stock movements
   */
  count(): Promise<number>;

  /**
   * Delete stock movement (use with caution - impacts audit trail)
   */
  delete(id: string): Promise<void>;
}
