"use client";

/**
 * Intune Device Filters Component
 *
 * Provides filter controls for Intune devices:
 * - Operating System filter
 * - Compliance State filter
 * - Ownership Type filter
 * - Search input (device name, serial, user name, email)
 */

import { useState, useMemo } from "react";
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
import type { IntuneDeviceFiltersDTO } from "@/interface-adapters/dtos/generated/intune-device.dto";

interface IntuneDeviceFiltersProps {
  filters: IntuneDeviceFiltersDTO;
  onFiltersChange: (filters: IntuneDeviceFiltersDTO) => void;
  osOptions?: string[];
}

const COMPLIANCE_OPTIONS = [
  { value: "COMPLIANT", label: "Compliant" },
  { value: "NON_COMPLIANT", label: "Non-Compliant" },
  { value: "IN_GRACE_PERIOD", label: "In Grace Period" },
  { value: "CONFLICT", label: "Conflict" },
  { value: "ERROR", label: "Error" },
  { value: "CONFIG_MANAGER", label: "Config Manager" },
  { value: "UNKNOWN", label: "Unknown" },
] as const;

const OWNERSHIP_OPTIONS = [
  { value: "CORPORATE", label: "Corporate" },
  { value: "PERSONAL", label: "Personal" },
  { value: "UNKNOWN", label: "Unknown" },
] as const;

const DEFAULT_OS_OPTIONS = ["Windows", "iOS", "Android", "macOS"];

export function IntuneDeviceFilters({
  filters,
  onFiltersChange,
  osOptions = DEFAULT_OS_OPTIONS,
}: IntuneDeviceFiltersProps) {
  const [searchValue, setSearchValue] = useState(filters.search ?? "");

  const activeFilterCount = useMemo(() => {
    return [
      filters.complianceState,
      filters.ownershipType,
      filters.operatingSystem,
    ].filter(Boolean).length;
  }, [filters]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onFiltersChange({ ...filters, search: searchValue || undefined });
  };

  const handleSearchChange = (value: string) => {
    setSearchValue(value);
    // Clear search filter if input is empty
    if (!value) {
      onFiltersChange({ ...filters, search: undefined });
    }
  };

  const handleFilterChange = (
    key: keyof IntuneDeviceFiltersDTO,
    value: string | undefined,
  ) => {
    onFiltersChange({
      ...filters,
      [key]: value === "all" ? undefined : value,
    });
  };

  const handleClearFilters = () => {
    setSearchValue("");
    onFiltersChange({});
  };

  const hasActiveFilters = activeFilterCount > 0 || !!filters.search;

  return (
    <div className="space-y-4">
      {/* Search and Filter Row */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search Input */}
        <form
          onSubmit={handleSearchSubmit}
          className="flex min-w-[250px] flex-1 gap-2"
        >
          <div className="relative flex-1">
            <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
            <Input
              placeholder="Search by device name, serial, user name, or email..."
              value={searchValue}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pr-4 pl-9"
            />
          </div>
          <Button type="submit" variant="secondary" size="default">
            <Search className="mr-2 h-4 w-4" />
            Search
          </Button>
        </form>

        {/* OS Filter */}
        <Select
          value={filters.operatingSystem ?? "all"}
          onValueChange={(value) =>
            handleFilterChange("operatingSystem", value)
          }
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="All OS" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All OS</SelectItem>
            {osOptions.map((os) => (
              <SelectItem key={os} value={os}>
                {os}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Compliance Filter */}
        <Select
          value={filters.complianceState ?? "all"}
          onValueChange={(value) =>
            handleFilterChange("complianceState", value)
          }
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="All Compliance" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Compliance</SelectItem>
            {COMPLIANCE_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Ownership Filter */}
        <Select
          value={filters.ownershipType ?? "all"}
          onValueChange={(value) => handleFilterChange("ownershipType", value)}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="All Ownership" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Ownership</SelectItem>
            {OWNERSHIP_OPTIONS.map((option) => (
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
            onClick={handleClearFilters}
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
          {filters.search && (
            <div className="bg-muted flex items-center gap-1 rounded-md px-2 py-1 text-xs">
              Search: <span className="font-medium">{filters.search}</span>
              <button
                onClick={() => {
                  setSearchValue("");
                  onFiltersChange({ ...filters, search: undefined });
                }}
                className="hover:bg-muted-foreground/20 ml-1 rounded-sm"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}
          {filters.operatingSystem && (
            <div className="bg-muted flex items-center gap-1 rounded-md px-2 py-1 text-xs">
              OS: <span className="font-medium">{filters.operatingSystem}</span>
              <button
                onClick={() => handleFilterChange("operatingSystem", undefined)}
                className="hover:bg-muted-foreground/20 ml-1 rounded-sm"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}
          {filters.complianceState && (
            <div className="bg-muted flex items-center gap-1 rounded-md px-2 py-1 text-xs">
              Compliance:{" "}
              <span className="font-medium">
                {
                  COMPLIANCE_OPTIONS.find(
                    (o) => o.value === filters.complianceState,
                  )?.label
                }
              </span>
              <button
                onClick={() => handleFilterChange("complianceState", undefined)}
                className="hover:bg-muted-foreground/20 ml-1 rounded-sm"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}
          {filters.ownershipType && (
            <div className="bg-muted flex items-center gap-1 rounded-md px-2 py-1 text-xs">
              Ownership:{" "}
              <span className="font-medium">
                {
                  OWNERSHIP_OPTIONS.find(
                    (o) => o.value === filters.ownershipType,
                  )?.label
                }
              </span>
              <button
                onClick={() => handleFilterChange("ownershipType", undefined)}
                className="hover:bg-muted-foreground/20 ml-1 rounded-sm"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
