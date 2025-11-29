/**
 * useLicenseProductFields Hook
 * Fetches and caches custom fields for a license product
 */

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { EnrichedLicenseProductFieldDTO } from "@/interface-adapters/presenters/license-product-field.presenter";
import { listEnrichedLicenseProductFieldsAction } from "@/interface-adapters/controllers/license-product-field.controller";

interface UseLicenseProductFieldsResult {
  fields: EnrichedLicenseProductFieldDTO[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

// Simple in-memory cache for license product fields
const fieldsCache = new Map<string, EnrichedLicenseProductFieldDTO[]>();

export function useLicenseProductFields(
  licenseProductId: string | null | undefined,
): UseLicenseProductFieldsResult {
  const [fields, setFields] = useState<EnrichedLicenseProductFieldDTO[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Track the current licenseProductId to prevent stale updates
  const currentLicenseProductIdRef = useRef<string | null | undefined>(
    licenseProductId,
  );

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
      const result = await listEnrichedLicenseProductFieldsAction(id);

      // Only update state if this is still the current license product
      if (currentLicenseProductIdRef.current === id) {
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
      if (currentLicenseProductIdRef.current === id) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to fetch license product fields",
        );
        setFields([]);
      }
    } finally {
      if (currentLicenseProductIdRef.current === id) {
        setIsLoading(false);
      }
    }
  }, []);

  const refetch = useCallback(async () => {
    if (!licenseProductId) return;

    // Clear cache for this license product to force refetch
    fieldsCache.delete(licenseProductId);
    await fetchFields(licenseProductId);
  }, [licenseProductId, fetchFields]);

  useEffect(() => {
    currentLicenseProductIdRef.current = licenseProductId;

    if (!licenseProductId) {
      setFields([]);
      setIsLoading(false);
      setError(null);
      return;
    }

    fetchFields(licenseProductId);
  }, [licenseProductId, fetchFields]);

  return {
    fields,
    isLoading,
    error,
    refetch,
  };
}

/**
 * Clear the fields cache for a specific license product or all products
 */
export function clearLicenseProductFieldsCache(
  licenseProductId?: string,
): void {
  if (licenseProductId) {
    fieldsCache.delete(licenseProductId);
  } else {
    fieldsCache.clear();
  }
}
