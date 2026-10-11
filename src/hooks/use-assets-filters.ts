/**
 * useAssetsFilters Hook
 *
 * Manages filter state for the assets page including:
 * - Search term (debounced)
 * - Column filters (category, status, location, vendor)
 * - Sorting
 * - Pagination
 */

"use client";

import { useCallback, useMemo, useState } from "react";
import { useDebounce } from "./use-debounce";
import type { AssetSearchDTO } from "@/interface-adapters/dtos/generated/asset.dto";

export interface AssetsFilters {
  searchTerm: string;
  assetCategoryId?: string;
  lifecycleStateId?: string;
  currentStockLocationId?: string;
  vendorId?: string;
  owningOrgUnitId?: string;
  assignedUserTerm?: string;
  hostNameTerm?: string;
  sortBy?: "assetTag" | "createdAt" | "purchaseDate" | "purchaseCost";
  sortOrder?: "asc" | "desc";
}

export interface AssetsPagination {
  page: number;
  pageSize: number;
}

export interface UseAssetsFiltersReturn {
  // Filter state
  filters: AssetsFilters;
  debouncedSearchTerm: string;
  pagination: AssetsPagination;

  // Actions
  setSearchTerm: (value: string) => void;
  setFilter: <K extends keyof AssetsFilters>(
    key: K,
    value: AssetsFilters[K],
  ) => void;
  setFilters: (filters: Partial<AssetsFilters>) => void;
  clearFilters: () => void;
  setPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;
  setSorting: (
    sortBy: AssetsFilters["sortBy"],
    sortOrder: AssetsFilters["sortOrder"],
  ) => void;

  // Computed
  hasActiveFilters: boolean;
  activeFilterCount: number;
  searchOptions: AssetSearchDTO;
}

const DEFAULT_FILTERS: AssetsFilters = {
  searchTerm: "",
  assetCategoryId: undefined,
  lifecycleStateId: undefined,
  currentStockLocationId: undefined,
  vendorId: undefined,
  owningOrgUnitId: undefined,
  assignedUserTerm: undefined,
  hostNameTerm: undefined,
  sortBy: "assetTag",
  sortOrder: "asc",
};

const DEFAULT_PAGINATION: AssetsPagination = {
  page: 1,
  pageSize: 20,
};

export function useAssetsFilters(
  initialFilters?: Partial<AssetsFilters>,
  initialPagination?: Partial<AssetsPagination>,
): UseAssetsFiltersReturn {
  const [filters, setFiltersState] = useState<AssetsFilters>({
    ...DEFAULT_FILTERS,
    ...initialFilters,
  });

  const [pagination, setPaginationState] = useState<AssetsPagination>({
    ...DEFAULT_PAGINATION,
    ...initialPagination,
  });

  // Debounce search term for better performance
  const debouncedSearchTerm = useDebounce(filters.searchTerm, 300);

  // Set a single filter value
  const setFilter = useCallback(
    <K extends keyof AssetsFilters>(key: K, value: AssetsFilters[K]) => {
      setFiltersState((prev) => ({ ...prev, [key]: value }));
      // Reset to page 1 when filters change
      setPaginationState((prev) => ({ ...prev, page: 1 }));
    },
    [],
  );

  // Set multiple filter values at once
  const setFilters = useCallback((newFilters: Partial<AssetsFilters>) => {
    setFiltersState((prev) => ({ ...prev, ...newFilters }));
    // Reset to page 1 when filters change
    setPaginationState((prev) => ({ ...prev, page: 1 }));
  }, []);

  // Set search term specifically
  const setSearchTerm = useCallback((value: string) => {
    setFiltersState((prev) => ({ ...prev, searchTerm: value }));
    // Reset to page 1 when search changes
    setPaginationState((prev) => ({ ...prev, page: 1 }));
  }, []);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setFiltersState(DEFAULT_FILTERS);
    setPaginationState((prev) => ({ ...prev, page: 1 }));
  }, []);

  // Pagination controls
  const setPage = useCallback((page: number) => {
    setPaginationState((prev) => ({ ...prev, page }));
  }, []);

  const setPageSize = useCallback((pageSize: number) => {
    setPaginationState({ page: 1, pageSize });
  }, []);

  // Sorting control
  const setSorting = useCallback(
    (
      sortBy: AssetsFilters["sortBy"],
      sortOrder: AssetsFilters["sortOrder"],
    ) => {
      setFiltersState((prev) => ({ ...prev, sortBy, sortOrder }));
    },
    [],
  );

  // Calculate if there are active filters (excluding defaults and search)
  const hasActiveFilters = useMemo(() => {
    return !!(
      filters.searchTerm ||
      filters.assetCategoryId ||
      filters.lifecycleStateId ||
      filters.currentStockLocationId ||
      filters.vendorId ||
      filters.owningOrgUnitId ||
      filters.assignedUserTerm ||
      filters.hostNameTerm
    );
  }, [filters]);

  // Count active filters
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.searchTerm) count++;
    if (filters.assetCategoryId) count++;
    if (filters.lifecycleStateId) count++;
    if (filters.currentStockLocationId) count++;
    if (filters.vendorId) count++;
    if (filters.owningOrgUnitId) count++;
    if (filters.assignedUserTerm) count++;
    if (filters.hostNameTerm) count++;
    return count;
  }, [filters]);

  // Build search options for API call
  const searchOptions = useMemo((): AssetSearchDTO => {
    return {
      searchTerm: debouncedSearchTerm || undefined,
      assetCategoryId: filters.assetCategoryId || undefined,
      lifecycleStateId: filters.lifecycleStateId || undefined,
      currentStockLocationId: filters.currentStockLocationId || undefined,
      vendorId: filters.vendorId || undefined,
      owningOrgUnitId: filters.owningOrgUnitId || undefined,
      sortBy: filters.sortBy,
      sortOrder: filters.sortOrder,
    };
  }, [debouncedSearchTerm, filters]);

  return {
    filters,
    debouncedSearchTerm,
    pagination,
    setSearchTerm,
    setFilter,
    setFilters,
    clearFilters,
    setPage,
    setPageSize,
    setSorting,
    hasActiveFilters,
    activeFilterCount,
    searchOptions,
  };
}
