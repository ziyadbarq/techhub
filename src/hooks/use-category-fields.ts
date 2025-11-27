/**
 * useCategoryFields Hook
 * Fetches and caches custom fields for an asset category
 */

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { EnrichedAssetCategoryFieldDTO } from "@/interface-adapters/presenters/asset-category-field.presenter";
import { listEnrichedAssetCategoryFieldsAction } from "@/interface-adapters/controllers/asset-category-field.controller";

interface UseCategoryFieldsResult {
  fields: EnrichedAssetCategoryFieldDTO[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

// Simple in-memory cache for category fields
const fieldsCache = new Map<string, EnrichedAssetCategoryFieldDTO[]>();

export function useCategoryFields(
  categoryId: string | null | undefined,
): UseCategoryFieldsResult {
  const [fields, setFields] = useState<EnrichedAssetCategoryFieldDTO[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Track the current categoryId to prevent stale updates
  const currentCategoryIdRef = useRef<string | null | undefined>(categoryId);

  const fetchFields = useCallback(async (id: string) => {
    // Check cache first
    const cached = fieldsCache.get(id);
    if (cached) {
      setFields(cached);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await listEnrichedAssetCategoryFieldsAction(id);

      // Only update state if this is still the current category
      if (currentCategoryIdRef.current === id) {
        if (result.success) {
          // Sort by uiOrder
          const sortedFields = [...result.data].sort(
            (a, b) => a.uiOrder - b.uiOrder,
          );
          fieldsCache.set(id, sortedFields);
          setFields(sortedFields);
          setError(null);
        } else {
          setError(result.error);
          setFields([]);
        }
      }
    } catch (err) {
      if (currentCategoryIdRef.current === id) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to fetch category fields",
        );
        setFields([]);
      }
    } finally {
      if (currentCategoryIdRef.current === id) {
        setIsLoading(false);
      }
    }
  }, []);

  const refetch = useCallback(async () => {
    if (!categoryId) return;

    // Clear cache for this category to force refetch
    fieldsCache.delete(categoryId);
    await fetchFields(categoryId);
  }, [categoryId, fetchFields]);

  useEffect(() => {
    currentCategoryIdRef.current = categoryId;

    if (!categoryId) {
      setFields([]);
      setIsLoading(false);
      setError(null);
      return;
    }

    fetchFields(categoryId);
  }, [categoryId, fetchFields]);

  return {
    fields,
    isLoading,
    error,
    refetch,
  };
}

/**
 * Clear the fields cache for a specific category or all categories
 */
export function clearCategoryFieldsCache(categoryId?: string): void {
  if (categoryId) {
    fieldsCache.delete(categoryId);
  } else {
    fieldsCache.clear();
  }
}
