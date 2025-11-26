/**
 * Audit Log Filters Component
 *
 * Provides comprehensive filtering controls for audit logs:
 * - Date range picker
 * - Action type select
 * - Entity type select
 * - User search (future enhancement)
 */

"use client";

import * as React from "react";
import { CalendarIcon, Filter, X } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import {
  SearchableSelect,
  type SearchableSelectOption,
} from "@/components/ui/searchable-select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export interface AuditLogFilters {
  userId?: string;
  action?: string;
  entityType?: string;
  startDate?: string;
  endDate?: string;
}

interface AuditLogFiltersProps {
  filters: AuditLogFilters;
  onFiltersChange: (filters: AuditLogFilters) => void;
  actions: string[];
  entityTypes: string[];
}

export function AuditLogFiltersComponent({
  filters,
  onFiltersChange,
  actions,
  entityTypes,
}: AuditLogFiltersProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [localFilters, setLocalFilters] =
    React.useState<AuditLogFilters>(filters);

  // Date range state
  const [startDate, setStartDate] = React.useState<Date | undefined>(
    filters.startDate ? new Date(filters.startDate) : undefined,
  );
  const [endDate, setEndDate] = React.useState<Date | undefined>(
    filters.endDate ? new Date(filters.endDate) : undefined,
  );

  const hasActiveFilters = React.useMemo(() => {
    return (
      !!filters.userId ||
      !!filters.action ||
      !!filters.entityType ||
      !!filters.startDate ||
      !!filters.endDate
    );
  }, [filters]);

  // Memoized options for searchable selects
  const actionOptions: SearchableSelectOption[] = React.useMemo(
    () => [
      { value: "all", label: "All Actions" },
      ...actions.map((action) => ({
        value: action,
        label: action,
      })),
    ],
    [actions],
  );

  const entityTypeOptions: SearchableSelectOption[] = React.useMemo(
    () => [
      { value: "all", label: "All Entities" },
      ...entityTypes.map((type) => ({
        value: type,
        label: type,
      })),
    ],
    [entityTypes],
  );

  const handleApplyFilters = () => {
    const updatedFilters: AuditLogFilters = {
      ...localFilters,
      startDate: startDate ? startDate.toISOString() : undefined,
      endDate: endDate ? endDate.toISOString() : undefined,
    };
    onFiltersChange(updatedFilters);
    setIsOpen(false);
  };

  const handleClearFilters = () => {
    const emptyFilters: AuditLogFilters = {};
    setLocalFilters(emptyFilters);
    setStartDate(undefined);
    setEndDate(undefined);
    onFiltersChange(emptyFilters);
    setIsOpen(false);
  };

  const handleLocalFilterChange = (
    key: keyof AuditLogFilters,
    value: string | undefined,
  ) => {
    setLocalFilters((prev) => ({
      ...prev,
      [key]: value || undefined,
    }));
  };

  return (
    <div className="flex items-center gap-2">
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <Filter className="h-4 w-4" />
            Filters
            {hasActiveFilters && (
              <span className="bg-primary text-primary-foreground ml-1 flex h-5 w-5 items-center justify-center rounded-full text-xs">
                {
                  [
                    filters.userId,
                    filters.action,
                    filters.entityType,
                    filters.startDate,
                    filters.endDate,
                  ].filter(Boolean).length
                }
              </span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-96" align="start">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Filter Audit Logs</h4>
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearFilters}
                  className="h-8 px-2"
                >
                  Clear all
                </Button>
              )}
            </div>

            {/* User ID Filter */}
            <div className="space-y-2">
              <Label htmlFor="userId">User ID</Label>
              <Input
                id="userId"
                placeholder="Enter user ID..."
                value={localFilters.userId || ""}
                onChange={(e) =>
                  handleLocalFilterChange("userId", e.target.value)
                }
              />
            </div>

            {/* Action Type Filter */}
            <div className="space-y-2">
              <Label htmlFor="action">Action Type</Label>
              <SearchableSelect
                options={actionOptions}
                value={localFilters.action || "all"}
                onValueChange={(value) =>
                  handleLocalFilterChange(
                    "action",
                    value === "all" ? undefined : value,
                  )
                }
                placeholder="Select action type"
                searchPlaceholder="Search actions..."
              />
            </div>

            {/* Entity Type Filter */}
            <div className="space-y-2">
              <Label htmlFor="entityType">Entity Type</Label>
              <SearchableSelect
                options={entityTypeOptions}
                value={localFilters.entityType || "all"}
                onValueChange={(value) =>
                  handleLocalFilterChange(
                    "entityType",
                    value === "all" ? undefined : value,
                  )
                }
                placeholder="Select entity type"
                searchPlaceholder="Search entity types..."
              />
            </div>

            {/* Date Range Filters */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !startDate && "text-muted-foreground",
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <div className="p-3">
                      <Input
                        type="date"
                        value={startDate ? format(startDate, "yyyy-MM-dd") : ""}
                        onChange={(e) => {
                          const date = e.target.value
                            ? new Date(e.target.value)
                            : undefined;
                          setStartDate(date);
                        }}
                      />
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>End Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !endDate && "text-muted-foreground",
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDate ? format(endDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <div className="p-3">
                      <Input
                        type="date"
                        value={endDate ? format(endDate, "yyyy-MM-dd") : ""}
                        onChange={(e) => {
                          const date = e.target.value
                            ? new Date(e.target.value)
                            : undefined;
                          setEndDate(date);
                        }}
                      />
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsOpen(false)}
              >
                Cancel
              </Button>
              <Button size="sm" onClick={handleApplyFilters}>
                Apply Filters
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2">
          {filters.action && (
            <div className="bg-muted flex items-center gap-1 rounded-md px-2 py-1 text-xs">
              Action: <span className="font-medium">{filters.action}</span>
              <button
                onClick={() =>
                  onFiltersChange({ ...filters, action: undefined })
                }
                className="hover:bg-muted-foreground/20 ml-1 rounded-sm"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}
          {filters.entityType && (
            <div className="bg-muted flex items-center gap-1 rounded-md px-2 py-1 text-xs">
              Entity: <span className="font-medium">{filters.entityType}</span>
              <button
                onClick={() =>
                  onFiltersChange({ ...filters, entityType: undefined })
                }
                className="hover:bg-muted-foreground/20 ml-1 rounded-sm"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}
          {filters.startDate && (
            <div className="bg-muted flex items-center gap-1 rounded-md px-2 py-1 text-xs">
              From:{" "}
              <span className="font-medium">
                {format(new Date(filters.startDate), "MMM d, yyyy")}
              </span>
              <button
                onClick={() =>
                  onFiltersChange({ ...filters, startDate: undefined })
                }
                className="hover:bg-muted-foreground/20 ml-1 rounded-sm"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}
          {filters.endDate && (
            <div className="bg-muted flex items-center gap-1 rounded-md px-2 py-1 text-xs">
              To:{" "}
              <span className="font-medium">
                {format(new Date(filters.endDate), "MMM d, yyyy")}
              </span>
              <button
                onClick={() =>
                  onFiltersChange({ ...filters, endDate: undefined })
                }
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
