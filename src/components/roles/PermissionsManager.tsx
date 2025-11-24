/**
 * Permissions Manager Component
 *
 * Interactive component to manage role permissions with grouped UI.
 * Features:
 * - Group permissions by logical categories
 * - Search/filter permissions across all groups
 * - Select/deselect individual permissions
 * - Select/deselect all permissions in a group
 * - Collapsible sections for better UX
 * - Show current vs. new state
 * - Save changes with optimistic updates
 * - Bulk mode for efficient multi-selection
 *
 * Refactored into 3 hooks + 5 components for better maintainability.
 */

"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Card, CardContent } from "@/components/ui/card";
import type {
  RoleDTO,
  PermissionDTO,
} from "@/interface-adapters/presenters/role.presenter";
import { assignPermissionsToRoleAction } from "@/interface-adapters/controllers/role.controller";
import { validatePermissionDependencies } from "@/lib/rbac/permission-dependencies";
import type { PermissionKey } from "@/core/domain/value-objects/permission-key";

// Custom hooks
import { usePermissionSelection } from "@/hooks/use-permission-selection";
import { useBulkSelection } from "@/hooks/use-bulk-selection";
import { usePermissionGroups } from "@/hooks/use-permission-groups";

// Components
import { PermissionsSummaryCard } from "./PermissionsSummaryCard";
import { DependencyWarningCard } from "./DependencyWarningCard";
import { PermissionGroupCard } from "./PermissionGroupCard";
import { PermissionActionsFooter } from "./PermissionActionsFooter";

interface PermissionsManagerProps {
  role: RoleDTO;
  allPermissions: PermissionDTO[];
  isSystemRole: boolean;
}

export function PermissionsManager({
  role,
  allPermissions,
  isSystemRole,
}: PermissionsManagerProps) {
  const router = useRouter();
  const [isSaving, setIsSaving] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");

  // Hook 1: Permission selection state and operations
  const {
    selectedPermissions,
    setSelectedPermissions,
    togglePermission,
    hasChanges,
    reset,
    addMissingDependencies,
  } = usePermissionSelection({
    initialPermissions: role.permissions ?? [],
  });

  // Hook 2: Bulk selection mode and operations
  const {
    bulkMode,
    bulkSelection,
    setBulkSelection,
    toggleBulkMode,
    toggleBulkSelection,
    addBulk,
    removeBulk,
    clearBulk,
  } = useBulkSelection();

  // Hook 3: Permission groups display logic
  const {
    permissionMap,
    groupedPermissions: _groupedPermissions,
    filteredGroups,
    expandedGroups,
    toggleGroup,
    toggleAllInGroup,
    getGroupStats,
  } = usePermissionGroups({
    allPermissions,
    searchQuery,
    selectedPermissions,
    bulkSelection,
    bulkMode,
  });

  // Validate permission dependencies
  const dependencyValidation = React.useMemo(() => {
    const selectedArray = Array.from(selectedPermissions) as PermissionKey[];
    return validatePermissionDependencies(selectedArray);
  }, [selectedPermissions]);

  // Calculate search results count
  const searchResultsCount = React.useMemo(() => {
    return filteredGroups.reduce((sum, g) => sum + g.permissions.length, 0);
  }, [filteredGroups]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Get permission IDs from names
      const selectedPermissionIds = allPermissions
        .filter((p) => selectedPermissions.has(p.name))
        .map((p) => p.id);

      const result = await assignPermissionsToRoleAction({
        roleId: role.id,
        permissionIds: selectedPermissionIds,
      });

      if (result.success) {
        toast.success("Permissions updated successfully");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    } catch (_error) {
      toast.error("Failed to update permissions");
    } finally {
      setIsSaving(false);
    }
  };

  const handleBulkAdd = () => {
    addBulk(selectedPermissions, setSelectedPermissions);
  };

  const handleBulkRemove = () => {
    removeBulk(selectedPermissions, setSelectedPermissions);
  };

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <PermissionsSummaryCard
        currentPermissionsCount={role.permissions?.length ?? 0}
        selectedPermissionsCount={selectedPermissions.size}
        allPermissionsCount={allPermissions.length}
        filteredGroupsCount={filteredGroups.length}
        hasChanges={hasChanges()}
        isSystemRole={isSystemRole}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        bulkMode={bulkMode}
        onBulkModeChange={toggleBulkMode}
        bulkSelectionCount={bulkSelection.size}
        onBulkAdd={handleBulkAdd}
        onBulkRemove={handleBulkRemove}
        onBulkClear={clearBulk}
        searchResultsCount={searchResultsCount}
      />

      {/* Dependency Warning */}
      <DependencyWarningCard
        validation={dependencyValidation}
        permissionMap={permissionMap}
        onAddMissingDependencies={() =>
          addMissingDependencies(dependencyValidation)
        }
        isSystemRole={isSystemRole}
        isSaving={isSaving}
      />

      {/* Permissions by Logical Groups */}
      <div className="space-y-4">
        {filteredGroups.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">
                No permissions found matching &quot;{searchQuery}&quot;
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredGroups.map((group) => {
            const isExpanded = expandedGroups.has(group.id);
            const stats = getGroupStats(group.id);

            return (
              <PermissionGroupCard
                key={group.id}
                group={group}
                isExpanded={isExpanded}
                onToggleExpand={() => toggleGroup(group.id)}
                selectedPermissions={selectedPermissions}
                bulkSelection={bulkSelection}
                originalPermissions={role.permissions ?? []}
                bulkMode={bulkMode}
                isSystemRole={isSystemRole}
                isSaving={isSaving}
                onTogglePermission={togglePermission}
                onToggleBulkSelection={toggleBulkSelection}
                onToggleAllInGroup={(checked) =>
                  toggleAllInGroup(
                    group.id,
                    checked,
                    setSelectedPermissions,
                    setBulkSelection,
                  )
                }
                isFullySelected={stats.isFullySelected}
                isPartiallySelected={stats.isPartiallySelected}
                selectedCount={stats.selectedCount}
                permissionMap={permissionMap}
              />
            );
          })
        )}
      </div>

      {/* Action Buttons */}
      <PermissionActionsFooter
        hasChanges={hasChanges()}
        isSystemRole={isSystemRole}
        isSaving={isSaving}
        isValid={dependencyValidation.valid}
        onSave={handleSave}
        onReset={reset}
      />
    </div>
  );
}
