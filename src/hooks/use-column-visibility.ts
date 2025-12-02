/**
 * useColumnVisibility Hook
 *
 * Manages table column visibility with localStorage persistence and optional URL sync.
 * URL parameters override localStorage when both are present.
 *
 * @example
 * ```tsx
 * const columnVisibility = useColumnVisibility({
 *   storageKey: 'my-table-columns',
 *   initialVisibility: {
 *     id: true,
 *     name: true,
 *     email: false,
 *   },
 *   enableUrlSync: true,
 *   urlParamKey: 'hide',
 * });
 *
 * // Use visibility state
 * <DataTable columnVisibility={columnVisibility.visibility} />
 *
 * // Toggle columns
 * columnVisibility.toggleColumn('email');
 * columnVisibility.setVisibility({ email: true, phone: false });
 * columnVisibility.resetToDefaults();
 * ```
 */

"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { VisibilityState } from "@tanstack/react-table";

export interface UseColumnVisibilityOptions {
  /** localStorage key for persisting column visibility */
  storageKey?: string;
  /** Initial column visibility state */
  initialVisibility?: VisibilityState;
  /** Enable URL parameter synchronization */
  enableUrlSync?: boolean;
  /** URL parameter key for hidden columns (comma-separated list) */
  urlParamKey?: string;
}

export interface UseColumnVisibilityReturn {
  /** Current column visibility state */
  visibility: VisibilityState;
  /** Set visibility for a single column */
  setColumnVisibility: (columnId: string, visible: boolean) => void;
  /** Toggle visibility for a single column */
  toggleColumn: (columnId: string) => void;
  /** Set visibility for multiple columns at once */
  setVisibility: (visibility: Partial<VisibilityState>) => void;
  /** Reset to initial/default visibility */
  resetToDefaults: () => void;
  /** Show all columns */
  showAll: () => void;
  /** Hide all hideable columns */
  hideAll: (hideableColumns: string[]) => void;
}

/**
 * Load column visibility from localStorage
 */
function loadFromStorage(storageKey: string): VisibilityState | null {
  if (typeof window === "undefined") return null;

  try {
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      return JSON.parse(stored) as VisibilityState;
    }
  } catch (error) {
    console.warn(`Failed to load column visibility from localStorage:`, error);
  }

  return null;
}

/**
 * Save column visibility to localStorage
 */
function saveToStorage(storageKey: string, visibility: VisibilityState): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(storageKey, JSON.stringify(visibility));
  } catch (error) {
    console.warn(`Failed to save column visibility to localStorage:`, error);
  }
}

/**
 * Parse URL parameter for hidden columns (comma-separated list)
 * Returns an object where hidden columns are set to false
 */
function parseUrlHiddenColumns(
  searchParams: URLSearchParams,
  urlParamKey: string,
): VisibilityState {
  const hiddenParam = searchParams.get(urlParamKey);
  if (!hiddenParam) return {};

  const hiddenColumns = hiddenParam.split(",").filter(Boolean);
  const visibility: VisibilityState = {};

  for (const columnId of hiddenColumns) {
    visibility[columnId] = false;
  }

  return visibility;
}

/**
 * Hook for managing table column visibility
 */
export function useColumnVisibility({
  storageKey,
  initialVisibility = {},
  enableUrlSync = false,
  urlParamKey = "hide",
}: UseColumnVisibilityOptions = {}): UseColumnVisibilityReturn {
  const searchParams = useSearchParams();

  // Initialize visibility state with merge priority: URL > localStorage > initial
  const [visibility, setVisibility] = useState<VisibilityState>(() => {
    let merged = { ...initialVisibility };

    // Load from localStorage if storage key provided
    if (storageKey) {
      const stored = loadFromStorage(storageKey);
      if (stored) {
        merged = { ...merged, ...stored };
      }
    }

    // URL params override everything
    if (enableUrlSync) {
      const urlVisibility = parseUrlHiddenColumns(searchParams, urlParamKey);
      merged = { ...merged, ...urlVisibility };
    }

    return merged;
  });

  // Persist to localStorage when visibility changes
  useEffect(() => {
    if (storageKey) {
      saveToStorage(storageKey, visibility);
    }
  }, [storageKey, visibility]);

  // Set visibility for a single column
  const setColumnVisibility = useCallback(
    (columnId: string, visible: boolean) => {
      setVisibility((prev) => ({ ...prev, [columnId]: visible }));
    },
    [],
  );

  // Toggle visibility for a single column
  const toggleColumn = useCallback((columnId: string) => {
    setVisibility((prev) => ({
      ...prev,
      [columnId]: !prev[columnId],
    }));
  }, []);

  // Set visibility for multiple columns
  const setVisibilityBatch = useCallback(
    (newVisibility: Partial<VisibilityState>) => {
      setVisibility((prev) => {
        const updated: VisibilityState = { ...prev };

        for (const [columnId, value] of Object.entries(newVisibility)) {
          if (typeof value === "boolean") {
            updated[columnId] = value;
          }
        }

        return updated;
      });
    },
    [],
  );

  // Reset to defaults
  const resetToDefaults = useCallback(() => {
    setVisibility(initialVisibility);
  }, [initialVisibility]);

  // Show all columns
  const showAll = useCallback(() => {
    setVisibility({});
  }, []);

  // Hide all specified columns
  const hideAll = useCallback((hideableColumns: string[]) => {
    const allHidden: VisibilityState = {};
    for (const columnId of hideableColumns) {
      allHidden[columnId] = false;
    }
    setVisibility(allHidden);
  }, []);

  return {
    visibility,
    setColumnVisibility,
    toggleColumn,
    setVisibility: setVisibilityBatch,
    resetToDefaults,
    showAll,
    hideAll,
  };
}
