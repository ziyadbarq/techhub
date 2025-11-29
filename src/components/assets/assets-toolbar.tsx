"use client";

/**
 * Assets Toolbar Component
 *
 * Provides filter controls for assets:
 * - Global search (asset tag, serial number, notes)
 * - Category filter
 * - Lifecycle State filter
 * - Location filter
 * - Manufacturer filter (filters by the manufacturer from asset model)
 */

import { useMemo } from "react";
import { Filter, X, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { AssetsFilters } from "@/hooks/use-assets-filters";
import type { AssetFilterOptions } from "@/interface-adapters/controllers/asset.controller";

interface AssetsToolbarProps {
  filters: AssetsFilters;
  onSearchChange: (value: string) => void;
  onFilterChange: <K extends keyof AssetsFilters>(
    key: K,
    value: AssetsFilters[K],
  ) => void;
  onClearFilters: () => void;
  filterOptions: AssetFilterOptions | null;
  loading?: boolean;
}

export function AssetsToolbar({
  filters,
  onSearchChange,
  onFilterChange,
  onClearFilters,
  filterOptions,
  loading,
}: AssetsToolbarProps) {
  const activeFilterCount = useMemo(() => {
    return [
      filters.assetCategoryId,
      filters.lifecycleStateId,
      filters.currentStockLocationId,
      filters.vendorId,
    ].filter(Boolean).length;
  }, [filters]);

  const hasActiveFilters = activeFilterCount > 0 || !!filters.searchTerm;

  const handleFilterChange = (
    key: keyof AssetsFilters,
    value: string | undefined,
  ) => {
    onFilterChange(key, value === "all" ? undefined : value);
  };

  const getSelectedLabel = (
    options: Array<{ value: string; label: string }> | undefined,
    value: string | undefined,
  ): string | undefined => {
    if (!value || !options) return undefined;
    return options.find((o) => o.value === value)?.label;
  };

  return (
    <div className="space-y-4">
      {/* Search and Filter Row */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search Input */}
        <div className="relative min-w-[250px] flex-1">
          <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
          <Input
            placeholder="Search by asset tag, serial number, or notes..."
            value={filters.searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pr-4 pl-9"
            disabled={loading}
          />
        </div>

        {/* Category Filter */}
        <Select
          value={filters.assetCategoryId ?? "all"}
          onValueChange={(value) =>
            handleFilterChange("assetCategoryId", value)
          }
          disabled={loading || !filterOptions}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {filterOptions?.categories.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Lifecycle State Filter */}
        <Select
          value={filters.lifecycleStateId ?? "all"}
          onValueChange={(value) =>
            handleFilterChange("lifecycleStateId", value)
          }
          disabled={loading || !filterOptions}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {filterOptions?.lifecycleStates.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Location Filter */}
        <Select
          value={filters.currentStockLocationId ?? "all"}
          onValueChange={(value) =>
            handleFilterChange("currentStockLocationId", value)
          }
          disabled={loading || !filterOptions}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="All Locations" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Locations</SelectItem>
            {filterOptions?.stockLocations.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Manufacturer Filter */}
        <Select
          value={filters.vendorId ?? "all"}
          onValueChange={(value) => handleFilterChange("vendorId", value)}
          disabled={loading || !filterOptions}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="All Manufacturers" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Manufacturers</SelectItem>
            {filterOptions?.vendors.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Clear Filters Button */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            className="gap-1"
          >
            <X className="h-4 w-4" />
            Clear
          </Button>
        )}
      </div>

      {/* Active Filters Pills */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2">
          <Filter className="text-muted-foreground h-4 w-4" />
          {filters.searchTerm && (
            <FilterPill
              label="Search"
              value={filters.searchTerm}
              onClear={() => onSearchChange("")}
            />
          )}
          {filters.assetCategoryId && (
            <FilterPill
              label="Category"
              value={
                getSelectedLabel(
                  filterOptions?.categories,
                  filters.assetCategoryId,
                ) || filters.assetCategoryId
              }
              onClear={() => handleFilterChange("assetCategoryId", undefined)}
            />
          )}
          {filters.lifecycleStateId && (
            <FilterPill
              label="Status"
              value={
                getSelectedLabel(
                  filterOptions?.lifecycleStates,
                  filters.lifecycleStateId,
                ) || filters.lifecycleStateId
              }
              onClear={() => handleFilterChange("lifecycleStateId", undefined)}
            />
          )}
          {filters.currentStockLocationId && (
            <FilterPill
              label="Location"
              value={
                getSelectedLabel(
                  filterOptions?.stockLocations,
                  filters.currentStockLocationId,
                ) || filters.currentStockLocationId
              }
              onClear={() =>
                handleFilterChange("currentStockLocationId", undefined)
              }
            />
          )}
          {filters.vendorId && (
            <FilterPill
              label="Manufacturer"
              value={
                getSelectedLabel(filterOptions?.vendors, filters.vendorId) ||
                filters.vendorId
              }
              onClear={() => handleFilterChange("vendorId", undefined)}
            />
          )}
        </div>
      )}
    </div>
  );
}

interface FilterPillProps {
  label: string;
  value: string;
  onClear: () => void;
}

function FilterPill({ label, value, onClear }: FilterPillProps) {
  return (
    <div className="bg-muted flex items-center gap-1 rounded-md px-2 py-1 text-xs">
      {label}: <span className="font-medium">{value}</span>
      <button
        onClick={onClear}
        className="hover:bg-muted-foreground/20 ml-1 rounded-sm"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
}
