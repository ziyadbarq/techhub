/**
 * Query Layer - Barrel Export
 *
 * Exports all query layer view composers and utilities.
 *
 * ARCHITECTURE:
 * - Query layer sits in interface-adapters (above use cases)
 * - Queries handle UI aggregation, batching, and joining
 * - Queries MUST delegate to use cases (NEVER call repositories directly)
 * - Use cases handle business logic for single entities
 *
 * @see docs/guides/DEVELOPER_GUIDE.md - Query Layer Pattern
 */

// Base interfaces
export type { IBaseQuery, BatchConfig } from "./base-query.interface";
export { DEFAULT_BATCH_CONFIG } from "./base-query.interface";

// Batch loader utilities
export {
  BatchLoader,
  createBatchLoader,
  type BatchLoadFn,
} from "./batch-loader";

// Table view queries
export {
  StockMovementsTableQuery,
  type EnrichedStockMovement,
  type StockMovementsTableFilter,
} from "./stock-movements-table.query";

export {
  AssetReservationsTableQuery,
  type EnrichedAssetReservation,
  type AssetReservationsTableFilter,
} from "./asset-reservations-table.query";
