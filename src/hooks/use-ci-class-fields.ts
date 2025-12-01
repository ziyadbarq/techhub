/**
 * useCIClassFields Hook
 * Fetches and caches custom fields for a CI class
 *
 * This is now a lightweight wrapper around the generic useEntityFieldsCache hook.
 */

"use client";

import type { EnrichedCIClassFieldDTO } from "@/interface-adapters/presenters/ci-class-field.presenter";
import { listEnrichedCIClassFieldsAction } from "@/interface-adapters/controllers/ci-class-field.controller";
import {
  useEntityFieldsCache,
  clearEntityFieldsCache,
} from "./use-entity-fields-cache";

interface UseCIClassFieldsResult {
  fields: EnrichedCIClassFieldDTO[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

const CACHE_KEY = "ci-class-fields";

export function useCIClassFields(
  ciClassId: string | null | undefined,
): UseCIClassFieldsResult {
  return useEntityFieldsCache(
    ciClassId,
    listEnrichedCIClassFieldsAction,
    CACHE_KEY,
  );
}

/**
 * Clear the fields cache for a specific CI class or all CI classes
 */
export function clearCIClassFieldsCache(ciClassId?: string): void {
  clearEntityFieldsCache(CACHE_KEY, ciClassId);
}
