/**
 * User Filters Component
 *
 * Advanced filtering for user management:
 * - Search by email/name
 * - Filter by assigned roles
 * - Filter by verification status
 * - Filter by account creation date range
 */

"use client";

import * as React from "react";
import { CalendarIcon, X } from "lucide-react";
import { format } from "date-fns";
import { DateRange } from "react-day-picker";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { MultiSelect } from "@/components/ui/multi-select";

export interface UserFiltersState {
  query: string;
  roles: string[];
  verificationStatus: "all" | "verified" | "unverified";
  dateRange: DateRange | undefined;
}

interface UserFiltersProps {
  filters: UserFiltersState;
  onFiltersChange: (filters: UserFiltersState) => void;
  availableRoles: { id: string; name: string; displayName: string }[];
}

export function UserFilters({
  filters,
  onFiltersChange,
  availableRoles,
}: UserFiltersProps) {
  const hasActiveFilters =
    filters.query !== "" ||
    filters.roles.length > 0 ||
    filters.verificationStatus !== "all" ||
    filters.dateRange !== undefined;

  const handleClearAll = () => {
    onFiltersChange({
      query: "",
      roles: [],
      verificationStatus: "all",
      dateRange: undefined,
    });
  };

  const roleOptions = availableRoles.map((role) => ({
    value: role.id,
    label: role.displayName,
  }));

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="space-y-2">
        <Label htmlFor="user-search">Search</Label>
        <Input
          id="user-search"
          placeholder="Search by email or name..."
          value={filters.query}
          onChange={(e) =>
            onFiltersChange({ ...filters, query: e.target.value })
          }
        />
      </div>

      {/* Role Filter */}
      <div className="space-y-2">
        <Label>Filter by Roles</Label>
        <MultiSelect
          options={roleOptions}
          selected={filters.roles}
          onChange={(roles) => onFiltersChange({ ...filters, roles })}
          placeholder="Select roles..."
          emptyMessage="No roles found"
        />
      </div>

      {/* Verification Status Filter */}
      <div className="space-y-2">
        <Label htmlFor="verification-status">Verification Status</Label>
        <Select
          value={filters.verificationStatus}
          onValueChange={(value: "all" | "verified" | "unverified") =>
            onFiltersChange({ ...filters, verificationStatus: value })
          }
        >
          <SelectTrigger id="verification-status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Users</SelectItem>
            <SelectItem value="verified">Verified Only</SelectItem>
            <SelectItem value="unverified">Unverified Only</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Date Range Filter */}
      <div className="space-y-2">
        <Label>Account Created</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                !filters.dateRange && "text-muted-foreground",
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {filters.dateRange?.from ? (
                filters.dateRange.to ? (
                  <>
                    {format(filters.dateRange.from, "LLL dd, y")} -{" "}
                    {format(filters.dateRange.to, "LLL dd, y")}
                  </>
                ) : (
                  format(filters.dateRange.from, "LLL dd, y")
                )
              ) : (
                <span>Pick a date range</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={filters.dateRange?.from}
              selected={filters.dateRange}
              onSelect={(range) =>
                onFiltersChange({ ...filters, dateRange: range })
              }
              numberOfMonths={2}
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Active Filters Summary */}
      {hasActiveFilters && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs">Active Filters</Label>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearAll}
              className="h-auto p-1 text-xs"
            >
              Clear All
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {filters.query && (
              <Badge variant="secondary" className="gap-1">
                Search: {filters.query}
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => onFiltersChange({ ...filters, query: "" })}
                />
              </Badge>
            )}
            {filters.roles.length > 0 && (
              <Badge variant="secondary" className="gap-1">
                {filters.roles.length} role(s)
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => onFiltersChange({ ...filters, roles: [] })}
                />
              </Badge>
            )}
            {filters.verificationStatus !== "all" && (
              <Badge variant="secondary" className="gap-1">
                {filters.verificationStatus === "verified"
                  ? "Verified"
                  : "Unverified"}
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() =>
                    onFiltersChange({ ...filters, verificationStatus: "all" })
                  }
                />
              </Badge>
            )}
            {filters.dateRange && (
              <Badge variant="secondary" className="gap-1">
                Date range
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() =>
                    onFiltersChange({ ...filters, dateRange: undefined })
                  }
                />
              </Badge>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
