/**
 * IStockMovementRepository Interface
 * Data access contract for stock movements
 */

import type {
  StockMovement,
  StockMovementType,
  StockMovementSource,
  StockMovementStatus,
} from "../domain/entities/stock-movement.entity";

export interface StockMovementFindAllOptions {
  skip?: number;
  take?: number;
  orderBy?: "occurredAt" | "createdAt" | "movementType";
  order?: "asc" | "desc";
  /** Filter by status (default: only ACTIVE movements) */
  status?: StockMovementStatus;
  /** Include voided movements (default: false) */
  includeVoided?: boolean;
  /** Filter by source */
  source?: StockMovementSource;
  /** Filter by asset */
  assetId?: string;
  /** Filter by movement type */
  movementType?: StockMovementType;
  /** Filter by date range - start */
  startDate?: Date;
  /** Filter by date range - end */
  endDate?: Date;
}

export interface IStockMovementRepository {
  /**
   * Create a new stock movement
   */
  create(stockMovement: StockMovement): Promise<StockMovement>;

  /**
   * Net ACTIVE quantity currently at a stock location, derived from the
   * movement ledger (quantities moved in minus quantities moved out).
   *
   * When called inside a unit of work, acquires a row lock on the stock
   * location so concurrent movements against the same location serialize;
   * callers can then safely validate availability before creating an
   * outbound movement.
   */
  getNetQuantityAtLocation(stockLocationId: string): Promise<number>;

  /**
   * Update an existing stock movement (for voiding)
   */
  update(stockMovement: StockMovement): Promise<StockMovement>;

  /**
   * Find stock movement by ID
   */
  findById(id: string): Promise<StockMovement | null>;

  /**
   * Find stock movements by asset
   * @param includeVoided - Include voided movements (default: false)
   */
  findByAsset(
    assetId: string,
    includeVoided?: boolean,
  ): Promise<StockMovement[]>;

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
   * Find all stock movements with filtering options
   */
  findAll(options?: StockMovementFindAllOptions): Promise<StockMovement[]>;

  /**
   * Count stock movements (optionally include voided)
   */
  count(includeVoided?: boolean): Promise<number>;

  /**
   * Delete stock movement (use with caution - impacts audit trail)
   * @deprecated Use void() method on StockMovement entity instead
   */
  delete(id: string): Promise<void>;
}
