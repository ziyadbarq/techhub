/**
 * TableFilterSelect Component
 *
 * Reusable filter dropdown for tables with "All" option and clear functionality.
 * Designed to work with useTableFilters hook.
 *
 * @example
 * ```tsx
 * const filters = useTableFilters({ ... });
 *
 * <TableFilterSelect
 *   value={filters.filters.criticality}
 *   onChange={(v) => filters.setFilter('criticality', v)}
 *   options={[
 *     { value: 'LOW', label: 'Low' },
 *     { value: 'MEDIUM', label: 'Medium' },
 *     { value: 'HIGH', label: 'High' },
 *     { value: 'CRITICAL', label: 'Critical' },
 *   ]}
 *   placeholder="Criticality"
 *   allLabel="All Criticality"
 * />
 * ```
 */

"use client";

import * as React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface FilterOption {
  /** Option value */
  value: string;
  /** Display label */
  label: string;
  /** Optional icon component */
  icon?: React.ComponentType<{ className?: string }>;
}

export interface TableFilterSelectProps {
  /** Current filter value */
  value: string;
  /** Callback when filter value changes */
  onChange: (value: string) => void;
  /** Filter options */
  options: FilterOption[];
  /** Placeholder text */
  placeholder?: string;
  /** Label for "All" option */
  allLabel?: string;
  /** Show badge when filtered */
  showBadge?: boolean;
  /** Show inline clear button */
  showClear?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Disabled state */
  disabled?: boolean;
}

export function TableFilterSelect({
  value,
  onChange,
  options,
  placeholder = "Filter",
  allLabel,
  showBadge = false,
  showClear = false,
  className,
  disabled = false,
}: TableFilterSelectProps) {
  const isFiltered = value !== "all" && value !== "";

  const handleClear = React.useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onChange("all");
    },
    [onChange],
  );

  const selectedOption = options.find((opt) => opt.value === value);
  const displayValue = selectedOption?.label ?? placeholder;

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger className="w-[170px]">
          <SelectValue placeholder={placeholder}>
            <div className="flex items-center gap-2">
              {selectedOption?.icon && (
                <selectedOption.icon className="h-4 w-4" />
              )}
              <span>{displayValue}</span>
            </div>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {/* "All" option */}
          <SelectItem value="all">
            {allLabel ?? `All ${placeholder}`}
          </SelectItem>

          {/* Individual options */}
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              <div className="flex items-center gap-2">
                {option.icon && <option.icon className="h-4 w-4" />}
                <span>{option.label}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Badge indicator */}
      {showBadge && isFiltered && (
        <Badge variant="secondary" className="text-xs">
          {selectedOption?.label}
        </Badge>
      )}

      {/* Inline clear button */}
      {showClear && isFiltered && (
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={handleClear}
          className="h-8 w-8"
          disabled={disabled}
          title="Clear filter"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Clear {placeholder} filter</span>
        </Button>
      )}
    </div>
  );
}
