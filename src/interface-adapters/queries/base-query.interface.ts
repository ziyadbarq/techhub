/**
 * Base Query Interface
 *
 * Defines the contract for query layer view composers.
 *
 * ARCHITECTURE RULES:
 * 1. Queries sit in the interface-adapters layer
 * 2. Queries MUST delegate to use cases (NEVER call repositories directly)
 * 3. Queries handle UI aggregation, batching, and joining
 * 4. Use cases handle business logic for single entities
 *
 * PATTERN:
 * - Use DataLoader-style batching to prevent N+1 queries
 * - Cache reference data within request scope
 * - Return enriched DTOs ready for presentation
 *
 * @see docs/guides/DEVELOPER_GUIDE.md - Query Layer Pattern
 */

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface IBaseQuery {}

/**
 * Batch loading configuration
 */
export interface BatchConfig {
  /**
   * Maximum batch size before splitting into multiple requests
   * @default 100
   */
  maxBatchSize?: number;

  /**
   * Whether to cache results within the request scope
   * @default true
   */
  enableCaching?: boolean;

  /**
   * Maximum time to wait for batching (milliseconds)
   * @default 10
   */
  batchWindow?: number;
}

/**
 * Default batch configuration
 */
export const DEFAULT_BATCH_CONFIG: Required<BatchConfig> = {
  maxBatchSize: 100,
  enableCaching: true,
  batchWindow: 10,
};
