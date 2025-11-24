/**
 * PermissionGroupCard Component
 *
 * Displays a collapsible group of permissions.
 * Features:
 * - Collapsible card with expansion indicator
 * - Group header with title and description
 * - Selected count display
 * - "Select All" checkbox for the group
 * - List of PermissionItem components
 */

"use client";

import { ChevronDown, ChevronRight } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";
import type { PermissionGroup } from "@/hooks/use-permission-groups";
import { PermissionItem } from "./PermissionItem";
import type { PermissionDTO } from "@/interface-adapters/presenters/role.presenter";
import { getPermissionDependencies } from "@/lib/rbac/permission-dependencies";
import type { PermissionKey } from "@/core/domain/value-objects/permission-key";

interface PermissionGroupCardProps {
  group: PermissionGroup;
  isExpanded: boolean;
  onToggleExpand: () => void;
  selectedPermissions: Set<string>;
  bulkSelection: Set<string>;
  originalPermissions: string[];
  bulkMode: boolean;
  isSystemRole: boolean;
  isSaving: boolean;
  onTogglePermission: (permissionName: string) => void;
  onToggleBulkSelection: (permissionName: string) => void;
  onToggleAllInGroup: (checked: boolean) => void;
  isFullySelected: boolean;
  isPartiallySelected: boolean;
  selectedCount: number;
  permissionMap: Map<string, PermissionDTO>;
}

export function PermissionGroupCard({
  group,
  isExpanded,
  onToggleExpand,
  selectedPermissions,
  bulkSelection,
  originalPermissions,
  bulkMode,
  isSystemRole,
  isSaving,
  onTogglePermission,
  onToggleBulkSelection,
  onToggleAllInGroup,
  isFullySelected,
  isPartiallySelected,
  selectedCount,
  permissionMap,
}: PermissionGroupCardProps) {
  const totalCount = group.permissions.length;

  return (
    <Card>
      <Collapsible open={isExpanded} onOpenChange={onToggleExpand}>
        <CardHeader className="cursor-pointer" onClick={onToggleExpand}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isExpanded ? (
                <ChevronDown className="text-muted-foreground h-5 w-5" />
              ) : (
                <ChevronRight className="text-muted-foreground h-5 w-5" />
              )}
              <div>
                <CardTitle className="text-lg">{group.label}</CardTitle>
                <CardDescription>
                  {group.description} • {selectedCount}/{totalCount} selected
                </CardDescription>
              </div>
            </div>
            <div
              className="flex items-center gap-2"
              onClick={(e) => e.stopPropagation()}
            >
              <Checkbox
                checked={
                  isFullySelected ||
                  (isPartiallySelected ? "indeterminate" : false)
                }
                onCheckedChange={(checked) => onToggleAllInGroup(!!checked)}
                disabled={isSystemRole || isSaving}
              />
              <span className="text-muted-foreground text-sm">Select All</span>
            </div>
          </div>
        </CardHeader>
        <CollapsibleContent>
          <CardContent>
            <div className="space-y-3">
              {group.permissions.map((permission) => {
                const isSelected = selectedPermissions.has(permission.name);
                const wasOriginal = originalPermissions.includes(
                  permission.name,
                );
                const dependencies = getPermissionDependencies(
                  permission.name as PermissionKey,
                );
                const isBulkSelected = bulkSelection.has(permission.name);

                return (
                  <PermissionItem
                    key={permission.id}
                    permission={permission}
                    isSelected={isSelected}
                    wasOriginal={wasOriginal}
                    dependencies={dependencies}
                    isBulkSelected={isBulkSelected}
                    bulkMode={bulkMode}
                    isSystemRole={isSystemRole}
                    isSaving={isSaving}
                    onToggle={() =>
                      bulkMode
                        ? onToggleBulkSelection(permission.name)
                        : onTogglePermission(permission.name)
                    }
                    permissionMap={permissionMap}
                  />
                );
              })}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
