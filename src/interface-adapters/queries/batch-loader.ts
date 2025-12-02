/**
 * DataLoader-Style Batch Loader
 *
 * Provides batching and caching for entity lookups to prevent N+1 queries.
 *
 * USAGE:
 * ```typescript
 * const loader = new BatchLoader<string, Asset>(
 *   async (ids) => {
 *     const assets = await listAssetsUseCase.execute({ ids });
 *     return ids.map(id => assets.find(a => a.id === id) ?? null);
 *   }
 * );
 *
 * // These calls are automatically batched:
 * const asset1 = await loader.load('id1');
 * const asset2 = await loader.load('id2');
 * ```
 *
 * PATTERN:
 * - Batches multiple load() calls into single batch function call
 * - Caches results for the lifetime of the loader instance
 * - Returns null for missing entities (graceful degradation)
 *
 * @see https://github.com/graphql/dataloader
 */

import type { BatchConfig } from "./base-query.interface";
import { DEFAULT_BATCH_CONFIG } from "./base-query.interface";

export type BatchLoadFn<K, V> = (
  keys: readonly K[],
) => Promise<Array<V | null>>;

interface QueueItem<K, V> {
  key: K;
  resolvers: Array<(value: V | null) => void>;
  rejecters: Array<(error: Error) => void>;
}

/**
 * BatchLoader - DataLoader-style batching and caching
 */
export class BatchLoader<K, V> {
  private batchLoadFn: BatchLoadFn<K, V>;
  private cache: Map<K, V | null>;
  private queue: Array<QueueItem<K, V>>;
  private batchTimer: NodeJS.Timeout | null;
  private config: Required<BatchConfig>;

  constructor(batchLoadFn: BatchLoadFn<K, V>, config: BatchConfig = {}) {
    this.batchLoadFn = batchLoadFn;
    this.cache = new Map();
    this.queue = [];
    this.batchTimer = null;
    this.config = { ...DEFAULT_BATCH_CONFIG, ...config };
  }

  /**
   * Load a single entity by key
   *
   * Batches multiple load calls within the batch window.
   * Returns cached result if available.
   */
  async load(key: K): Promise<V | null> {
    // Check cache first
    if (this.config.enableCaching && this.cache.has(key)) {
      return this.cache.get(key)!;
    }

    // Check if already queued
    const existingItem = this.queue.find((item) => item.key === key);
    if (existingItem) {
      return new Promise<V | null>((resolve, reject) => {
        existingItem.resolvers.push(resolve);
        existingItem.rejecters.push(reject);
      });
    }

    // Add to queue
    return new Promise<V | null>((resolve, reject) => {
      this.queue.push({ key, resolvers: [resolve], rejecters: [reject] });

      // Schedule batch execution with a short batch window to collect calls
      if (!this.batchTimer) {
        this.batchTimer = setTimeout(() => {
          this.executeBatch();
        }, this.config.batchWindow);
      }
    });
  }

  /**
   * Load multiple entities by keys
   *
   * More efficient than calling load() multiple times.
   */
  async loadMany(keys: readonly K[]): Promise<Array<V | null>> {
    return Promise.all(keys.map((key) => this.load(key)));
  }

  /**
   * Execute the current batch
   */
  private async executeBatch(): Promise<void> {
    const batch = this.queue.splice(0, this.queue.length);
    this.batchTimer = null;

    if (batch.length === 0) {
      return;
    }

    try {
      // Split into chunks if batch is too large
      const chunks = this.chunkArray(batch, this.config.maxBatchSize);

      for (const chunk of chunks) {
        const keys = chunk.map((item) => item.key);
        const values = await this.batchLoadFn(keys);

        if (values.length !== keys.length) {
          throw new Error(
            `BatchLoadFn returned ${values.length} values for ${keys.length} keys`,
          );
        }

        // Cache and resolve
        for (let i = 0; i < keys.length; i++) {
          const key = keys[i];
          const value = values[i];

          if (this.config.enableCaching) {
            this.cache.set(key, value);
          }

          chunk[i].resolvers.forEach((resolve) => resolve(value));
        }
      }
    } catch (error) {
      // Reject all items in batch
      for (const item of batch) {
        item.rejecters.forEach((reject) =>
          reject(
            error instanceof Error ? error : new Error("Batch load failed"),
          ),
        );
      }
    }
  }

  /**
   * Clear the cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Prime the cache with a value
   */
  prime(key: K, value: V | null): void {
    if (this.config.enableCaching) {
      this.cache.set(key, value);
    }
  }

  /**
   * Split array into chunks
   */
  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }
}

/**
 * Create a batch loader for a use case that supports ID-based lookups
 */
export function createBatchLoader<K, V>(
  batchLoadFn: BatchLoadFn<K, V>,
  config?: BatchConfig,
): BatchLoader<K, V> {
  return new BatchLoader(batchLoadFn, config);
}
