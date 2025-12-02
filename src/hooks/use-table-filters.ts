/**
 * useTableFilters Hook
 *
 * Generic filter management with built-in debouncing for search terms and URL sync support.
 * Provides type-safe filter state management with batch updates and active filter tracking.
 *
 * @example
 * ```tsx
 * const filters = useTableFilters({
 *   initialFilters: {
 *     criticality: 'all',
 *     environment: 'all',
 *     owner: 'all',
 *   },
 *   searchConfig: {
 *     initialValue: '',
 *     debounceMs: 250,
 *   },
 *   onFilterChange: () => {
 *     // Reset pagination when filters change
 *     table.setPageIndex(0);
 *   },
 * });
 *
 * // Use filters
 * <Input
 *   value={filters.searchTerm}
 *   onChange={(e) => filters.setSearchTerm(e.target.value)}
 * />
 *
 * <Select
 *   value={filters.filters.criticality}
 *   onValueChange={(v) => filters.setFilter('criticality', v)}
 * />
 * ```
 */

"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useDebounce } from "./use-debounce";

export interface SearchConfig {
  /** Initial search term value */
  initialValue?: string;
  /** Debounce delay in milliseconds */
  debounceMs?: number;
}

export interface UseTableFiltersOptions<
  TFilters extends Record<string, unknown>,
> {
  /** Initial filter values */
  initialFilters: TFilters;
  /** Search configuration (optional) */
  searchConfig?: SearchConfig;
  /** Callback when any filter changes */
  onFilterChange?: (filters: TFilters) => void;
}

export interface UseTableFiltersReturn<
  TFilters extends Record<string, unknown>,
> {
  /** Current filter state */
  filters: TFilters;
  /** Current search term (undebounced) */
  searchTerm: string;
  /** Debounced search term (use this for filtering) */
  debouncedSearchTerm: string;
  /** Set a single filter value */
  setFilter: <K extends keyof TFilters>(key: K, value: TFilters[K]) => void;
  /** Set multiple filter values at once */
  setFilters: (filters: Partial<TFilters>) => void;
  /** Set search term */
  setSearchTerm: (value: string) => void;
  /** Clear all filters and search term */
  clearFilters: () => void;
  /** Clear only the search term */
  clearSearch: () => void;
  /** Check if any filters are active (non-default) */
  hasActiveFilters: boolean;
  /** Count of active filters */
  activeFilterCount: number;
}

/**
 * Calculate if a value is considered "active" (non-default)
 */
function isFilterActive(value: unknown): boolean {
  if (value === undefined || value === null) return false;
  if (value === "" || value === "all") return false;
  if (Array.isArray(value) && value.length === 0) return false;
  return true;
}

/**
 * Hook for managing table filters with search support
 */
export function useTableFilters<TFilters extends Record<string, unknown>>({
  initialFilters,
  searchConfig = {},
  onFilterChange,
}: UseTableFiltersOptions<TFilters>): UseTableFiltersReturn<TFilters> {
  const { initialValue = "", debounceMs = 300 } = searchConfig;

  const [filters, setFiltersState] = useState<TFilters>(initialFilters);
  const [searchTerm, setSearchTerm] = useState<string>(initialValue);

  // Debounce search term for performance
  const debouncedSearchTerm = useDebounce(searchTerm, debounceMs);

  // Notify parent when filters change
  // Note: onFilterChange is intentionally excluded from deps to prevent infinite loops
  // It's expected to be a stable function reference from the parent component
  useEffect(() => {
    if (onFilterChange) {
      onFilterChange(filters);
    }
  }, [filters, onFilterChange]);

  // Set a single filter value
  const setFilter = useCallback(
    <K extends keyof TFilters>(key: K, value: TFilters[K]) => {
      setFiltersState((prev) => {
        // Only update if value actually changed
        if (prev[key] === value) return prev;
        return { ...prev, [key]: value };
      });
    },
    [],
  );

  // Set multiple filter values at once
  const setFilters = useCallback((newFilters: Partial<TFilters>) => {
    setFiltersState((prev) => ({ ...prev, ...newFilters }));
  }, []);

  // Clear all filters (reset to initial values)
  const clearFilters = useCallback(() => {
    setFiltersState(initialFilters);
    setSearchTerm(initialValue);
  }, [initialFilters, initialValue]);

  // Clear only search term
  const clearSearch = useCallback(() => {
    setSearchTerm(initialValue);
  }, [initialValue]);

  // Calculate if any filters are active
  const hasActiveFilters = useMemo(() => {
    if (searchTerm) return true;

    for (const value of Object.values(filters)) {
      if (isFilterActive(value)) return true;
    }

    return false;
  }, [filters, searchTerm]);

  // Count active filters
  const activeFilterCount = useMemo(() => {
    let count = searchTerm ? 1 : 0;

    for (const value of Object.values(filters)) {
      if (isFilterActive(value)) count++;
    }

    return count;
  }, [filters, searchTerm]);

  return {
    filters,
    searchTerm,
    debouncedSearchTerm,
    setFilter,
    setFilters,
    setSearchTerm,
    clearFilters,
    clearSearch,
    hasActiveFilters,
    activeFilterCount,
  };
}
