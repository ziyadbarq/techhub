/**
 * PermissionsSummaryCard Component
 *
 * Displays summary information about permission selection.
 * Features:
 * - Current vs. new permission counts
 * - Search input for filtering permissions
 * - Bulk mode toggle
 * - Bulk action buttons (Add/Remove/Clear)
 * - Search results count
 */

"use client";

import { Search, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

interface PermissionsSummaryCardProps {
  currentPermissionsCount: number;
  selectedPermissionsCount: number;
  allPermissionsCount: number;
  filteredGroupsCount: number;
  hasChanges: boolean;
  isSystemRole: boolean;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  bulkMode: boolean;
  onBulkModeChange: (enabled: boolean) => void;
  bulkSelectionCount: number;
  onBulkAdd: () => void;
  onBulkRemove: () => void;
  onBulkClear: () => void;
  searchResultsCount: number;
}

export function PermissionsSummaryCard({
  currentPermissionsCount,
  selectedPermissionsCount,
  allPermissionsCount,
  filteredGroupsCount,
  hasChanges,
  isSystemRole,
  searchQuery,
  onSearchChange,
  bulkMode,
  onBulkModeChange,
  bulkSelectionCount,
  onBulkAdd,
  onBulkRemove,
  onBulkClear,
  searchResultsCount,
}: PermissionsSummaryCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Permission Summary</CardTitle>
        <CardDescription>
          {selectedPermissionsCount} of {allPermissionsCount} permissions
          selected across {filteredGroupsCount} categories
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Badge variant="outline">{currentPermissionsCount} current</Badge>
              <X className="text-muted-foreground h-4 w-4" />
              <Badge variant="default">{selectedPermissionsCount} new</Badge>
            </div>
            <div className="flex items-center gap-4">
              {hasChanges && (
                <Badge variant="default" className="bg-barq-yellow text-white">
                  Unsaved Changes
                </Badge>
              )}
              {!isSystemRole && (
                <div className="flex items-center gap-2">
                  <label
                    htmlFor="bulk-mode"
                    className="text-muted-foreground text-sm"
                  >
                    Bulk Mode
                  </label>
                  <Switch
                    id="bulk-mode"
                    checked={bulkMode}
                    onCheckedChange={onBulkModeChange}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Bulk Actions Bar */}
          {bulkMode && (
            <div className="bg-muted rounded-lg border p-3">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <Badge variant="default">{bulkSelectionCount} selected</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={onBulkAdd}
                    disabled={bulkSelectionCount === 0}
                  >
                    Add Selected
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={onBulkRemove}
                    disabled={bulkSelectionCount === 0}
                  >
                    Remove Selected
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={onBulkClear}
                    disabled={bulkSelectionCount === 0}
                  >
                    Clear
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Search Input */}
          <div className="relative">
            <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
            <Input
              type="text"
              placeholder="Search permissions by name, description, or resource..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>

          {searchQuery && (
            <p className="text-muted-foreground text-sm">
              Found {searchResultsCount} permissions in {filteredGroupsCount}{" "}
              categories
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
