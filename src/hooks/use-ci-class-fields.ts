/**
 * useCIClassFields Hook
 * Fetches and caches custom fields for a CI class
 */

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { EnrichedCIClassFieldDTO } from "@/interface-adapters/presenters/ci-class-field.presenter";
import { listEnrichedCIClassFieldsAction } from "@/interface-adapters/controllers/ci-class-field.controller";

interface UseCIClassFieldsResult {
  fields: EnrichedCIClassFieldDTO[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

// Simple in-memory cache for CI class fields
const fieldsCache = new Map<string, EnrichedCIClassFieldDTO[]>();

export function useCIClassFields(
  ciClassId: string | null | undefined,
): UseCIClassFieldsResult {
  const [fields, setFields] = useState<EnrichedCIClassFieldDTO[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Track the current ciClassId to prevent stale updates
  const currentCIClassIdRef = useRef<string | null | undefined>(ciClassId);

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
      const result = await listEnrichedCIClassFieldsAction(id);

      // Only update state if this is still the current CI class
      if (currentCIClassIdRef.current === id) {
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
      if (currentCIClassIdRef.current === id) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to fetch CI class fields",
        );
        setFields([]);
      }
    } finally {
      if (currentCIClassIdRef.current === id) {
        setIsLoading(false);
      }
    }
  }, []);

  const refetch = useCallback(async () => {
    if (!ciClassId) return;

    // Clear cache for this CI class to force refetch
    fieldsCache.delete(ciClassId);
    await fetchFields(ciClassId);
  }, [ciClassId, fetchFields]);

  useEffect(() => {
    currentCIClassIdRef.current = ciClassId;

    if (!ciClassId) {
      setFields([]);
      setIsLoading(false);
      setError(null);
      return;
    }

    fetchFields(ciClassId);
  }, [ciClassId, fetchFields]);

  return {
    fields,
    isLoading,
    error,
    refetch,
  };
}

/**
 * Clear the fields cache for a specific CI class or all CI classes
 */
export function clearCIClassFieldsCache(ciClassId?: string): void {
  if (ciClassId) {
    fieldsCache.delete(ciClassId);
  } else {
    fieldsCache.clear();
  }
}
