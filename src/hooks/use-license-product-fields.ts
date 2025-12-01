/**
 * useLicenseProductFields Hook
 * Fetches and caches custom fields for a license product
 *
 * This is now a lightweight wrapper around the generic useEntityFieldsCache hook.
 */

"use client";

import type { EnrichedLicenseProductFieldDTO } from "@/interface-adapters/presenters/license-product-field.presenter";
import { listEnrichedLicenseProductFieldsAction } from "@/interface-adapters/controllers/license-product-field.controller";
import {
  useEntityFieldsCache,
  clearEntityFieldsCache,
} from "./use-entity-fields-cache";

interface UseLicenseProductFieldsResult {
  fields: EnrichedLicenseProductFieldDTO[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

const CACHE_KEY = "license-product-fields";

export function useLicenseProductFields(
  licenseProductId: string | null | undefined,
): UseLicenseProductFieldsResult {
  return useEntityFieldsCache(
    licenseProductId,
    listEnrichedLicenseProductFieldsAction,
    CACHE_KEY,
  );
}

/**
 * Clear the fields cache for a specific license product or all license products
 */
export function clearLicenseProductFieldsCache(
  licenseProductId?: string,
): void {
  clearEntityFieldsCache(CACHE_KEY, licenseProductId);
}
