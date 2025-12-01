/**
 * useEntityFieldsCache Hook (Generic)
 *
 * Generic hook for fetching and caching entity fields (custom fields).
 * Consolidates logic from use-category-fields, use-ci-class-fields,
 * and use-license-product-fields hooks.
 *
 * @example
 * const result = useEntityFieldsCache(
 *   categoryId,
 *   listEnrichedAssetCategoryFieldsAction,
 *   'category-fields'
 * );
 */

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { ActionResponse } from "@/interface-adapters/controllers/types";

interface UseEntityFieldsCacheResult<T> {
  fields: T[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

interface FieldWithOrder {
  uiOrder: number;
}

/**
 * Cache storage - separate cache per entity type
 */
const caches = new Map<string, Map<string, unknown[]>>();

/**
 * Get or create a cache for a specific entity type
 */
function getCache<T>(cacheKey: string): Map<string, T[]> {
  if (!caches.has(cacheKey)) {
    caches.set(cacheKey, new Map());
  }
  return caches.get(cacheKey) as Map<string, T[]>;
}

/**
 * Generic hook for entity fields with caching
 *
 * @param entityId - The ID of the entity to fetch fields for
 * @param fetchAction - Server action that fetches the fields
 * @param cacheKey - Unique key for this entity type's cache
 * @returns Fields, loading state, error state, and refetch function
 */
export function useEntityFieldsCache<T extends FieldWithOrder>(
  entityId: string | null | undefined,
  fetchAction: (id: string) => Promise<ActionResponse<T[]>>,
  cacheKey: string,
): UseEntityFieldsCacheResult<T> {
  const [fields, setFields] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Track the current entityId to prevent stale updates
  const currentEntityIdRef = useRef<string | null | undefined>(entityId);

  const fetchFields = useCallback(
    async (id: string) => {
      const cache = getCache<T>(cacheKey);

      // Check cache first
      const cached = cache.get(id);
      if (cached) {
        setFields(cached);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const result = await fetchAction(id);

        // Only update state if this is still the current entity
        if (currentEntityIdRef.current === id) {
          if (result.success) {
            // Sort by uiOrder
            const sortedFields = [...result.data].sort(
              (a, b) => a.uiOrder - b.uiOrder,
            );
            cache.set(id, sortedFields);
            setFields(sortedFields);
            setError(null);
          } else {
            setError(result.error);
            setFields([]);
          }
        }
      } catch (err) {
        if (currentEntityIdRef.current === id) {
          setError(
            err instanceof Error
              ? err.message
              : "Failed to fetch entity fields",
          );
          setFields([]);
        }
      } finally {
        if (currentEntityIdRef.current === id) {
          setIsLoading(false);
        }
      }
    },
    [fetchAction, cacheKey],
  );

  const refetch = useCallback(async () => {
    if (!entityId) return;

    // Clear cache for this entity to force refetch
    const cache = getCache<T>(cacheKey);
    cache.delete(entityId);
    await fetchFields(entityId);
  }, [entityId, fetchFields, cacheKey]);

  useEffect(() => {
    currentEntityIdRef.current = entityId;

    if (!entityId) {
      setFields([]);
      setIsLoading(false);
      setError(null);
      return;
    }

    fetchFields(entityId);
  }, [entityId, fetchFields]);

  return {
    fields,
    isLoading,
    error,
    refetch,
  };
}

/**
 * Clear the fields cache for a specific entity or all entities of a type
 *
 * @param cacheKey - The cache key for the entity type
 * @param entityId - Optional specific entity ID to clear
 */
export function clearEntityFieldsCache(
  cacheKey: string,
  entityId?: string,
): void {
  const cache = getCache(cacheKey);

  if (entityId) {
    cache.delete(entityId);
  } else {
    cache.clear();
  }
}

/**
 * Clear all entity fields caches
 */
export function clearAllEntityFieldsCaches(): void {
  caches.clear();
}
