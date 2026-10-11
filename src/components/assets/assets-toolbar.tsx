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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { AssetsFilters } from "@/hooks/use-assets-filters";
import type { AssetFilterOptions } from "@/interface-adapters/controllers/asset.controller";

/**
 * A select filter is "unset" when it holds the "all" sentinel; text filters are
 * "unset" when empty. Treating "all" as a real value is what used to render
 * meaningless `Category: all` pills and keep the Clear button always visible.
 */
function isActiveFilterValue(value: string | undefined): boolean {
  return !!value && value !== "all";
}

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
      filters.owningOrgUnitId,
      filters.assignedUserTerm,
      filters.hostNameTerm,
    ].filter(isActiveFilterValue).length;
  }, [filters]);

  const hasActiveFilters = activeFilterCount > 0 || !!filters.searchTerm;

  // The page stores "unset" as the literal "all" (useTableFilters convention),
  // so pass the sentinel straight through instead of converting to undefined.
  const handleFilterChange = (
    key: keyof AssetsFilters,
    value: string | undefined,
  ) => {
    onFilterChange(key, value ?? "all");
  };

  const getSelectedLabel = (
    options: Array<{ value: string; label: string }> | undefined,
    value: string | undefined,
  ): string | undefined => {
    if (!value || !options) return undefined;
    return options.find((o) => o.value === value)?.label;
  };

  const selectFilters: Array<{
    key: keyof AssetsFilters;
    label: string;
    allLabel: string;
    value: string | undefined;
    options: Array<{ value: string; label: string }> | undefined;
  }> = [
    {
      key: "assetCategoryId",
      label: "Category",
      allLabel: "All Categories",
      value: filters.assetCategoryId,
      options: filterOptions?.categories,
    },
    {
      key: "lifecycleStateId",
      label: "Status",
      allLabel: "All Status",
      value: filters.lifecycleStateId,
      options: filterOptions?.lifecycleStates,
    },
    {
      key: "currentStockLocationId",
      label: "Location",
      allLabel: "All Locations",
      value: filters.currentStockLocationId,
      options: filterOptions?.stockLocations,
    },
    {
      key: "vendorId",
      label: "Manufacturer",
      allLabel: "All Manufacturers",
      value: filters.vendorId,
      options: filterOptions?.vendors,
    },
    {
      key: "owningOrgUnitId",
      label: "Company",
      allLabel: "All Companies",
      value: filters.owningOrgUnitId,
      options: filterOptions?.owningCompanies,
    },
  ];

  const textFilters: Array<{
    key: keyof AssetsFilters;
    label: string;
    placeholder: string;
    value: string | undefined;
  }> = [
    {
      key: "assignedUserTerm",
      label: "User",
      placeholder: "Name or email...",
      value: filters.assignedUserTerm,
    },
    {
      key: "hostNameTerm",
      label: "Host Name",
      placeholder: "Host name...",
      value: filters.hostNameTerm,
    },
  ];

  return (
    <div className="space-y-3">
      {/* Search + filter panel trigger */}
      <div className="flex flex-wrap items-center gap-2">
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

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="gap-2" disabled={loading}>
              <Filter className="h-4 w-4" />
              Filters
              {activeFilterCount > 0 && (
                <Badge
                  variant="secondary"
                  className="ml-1 h-5 min-w-5 justify-center px-1 tabular-nums"
                >
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-80 space-y-4">
            {selectFilters.map((filter) => (
              <div key={String(filter.key)} className="space-y-1.5">
                <Label className="text-xs font-medium">{filter.label}</Label>
                <Select
                  value={filter.value ?? "all"}
                  onValueChange={(value) =>
                    handleFilterChange(filter.key, value)
                  }
                  disabled={loading || !filterOptions}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={filter.allLabel} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{filter.allLabel}</SelectItem>
                    {filter.options?.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}

            {textFilters.map((filter) => (
              <div key={String(filter.key)} className="space-y-1.5">
                <Label className="text-xs font-medium">{filter.label}</Label>
                <Input
                  placeholder={filter.placeholder}
                  value={filter.value ?? ""}
                  onChange={(event) =>
                    onFilterChange(filter.key, event.target.value)
                  }
                  disabled={loading}
                />
              </div>
            ))}

            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearFilters}
                className="w-full gap-1"
              >
                <X className="h-4 w-4" />
                Clear all filters
              </Button>
            )}
          </PopoverContent>
        </Popover>
      </div>

      {/* Active filter pills - only rendered for filters that are actually set */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2">
          {filters.searchTerm && (
            <FilterPill
              label="Search"
              value={filters.searchTerm}
              onClear={() => onSearchChange("")}
            />
          )}
          {selectFilters
            .filter((filter) => isActiveFilterValue(filter.value))
            .map((filter) => (
              <FilterPill
                key={String(filter.key)}
                label={filter.label}
                value={
                  getSelectedLabel(filter.options, filter.value) ||
                  filter.value!
                }
                onClear={() => handleFilterChange(filter.key, "all")}
              />
            ))}
          {textFilters
            .filter((filter) => isActiveFilterValue(filter.value))
            .map((filter) => (
              <FilterPill
                key={String(filter.key)}
                label={filter.label}
                value={filter.value!}
                onClear={() => onFilterChange(filter.key, "")}
              />
            ))}
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
