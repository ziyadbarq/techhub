/**
 * useCategoryFields Hook
 * Fetches and caches custom fields for an asset category
 *
 * This is now a lightweight wrapper around the generic useEntityFieldsCache hook.
 */

"use client";

import type { EnrichedAssetCategoryFieldDTO } from "@/interface-adapters/presenters/asset-category-field.presenter";
import { listEnrichedAssetCategoryFieldsAction } from "@/interface-adapters/controllers/asset-category-field.controller";
import {
  useEntityFieldsCache,
  clearEntityFieldsCache,
} from "./use-entity-fields-cache";

interface UseCategoryFieldsResult {
  fields: EnrichedAssetCategoryFieldDTO[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

const CACHE_KEY = "category-fields";

export function useCategoryFields(
  categoryId: string | null | undefined,
): UseCategoryFieldsResult {
  return useEntityFieldsCache(
    categoryId,
    listEnrichedAssetCategoryFieldsAction,
    CACHE_KEY,
  );
}

/**
 * Clear the fields cache for a specific category or all categories
 */
export function clearCategoryFieldsCache(categoryId?: string): void {
  clearEntityFieldsCache(CACHE_KEY, categoryId);
}
