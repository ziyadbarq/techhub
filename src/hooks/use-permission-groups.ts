/**
 * Hook: usePermissionGroups
 *
 * Manages permission groups display logic.
 * Handles:
 * - Grouping permissions by logical categories
 * - Filtering groups based on search query
 * - Group expansion/collapse state
 * - Group statistics (selected count, fully selected, partially selected)
 * - Toggle all permissions in a group
 */

import { useCallback, useMemo, useState } from "react";

import type { PermissionDTO } from "@/interface-adapters/presenters/role.presenter";
import { PERMISSION_GROUPS } from "@/lib/rbac/permission-groups";

interface UsePermissionGroupsOptions {
  allPermissions: PermissionDTO[];
  searchQuery: string;
  selectedPermissions: Set<string>;
  bulkSelection: Set<string>;
  bulkMode: boolean;
}

export interface PermissionGroup {
  id: string;
  label: string;
  description: string;
  permissions: PermissionDTO[];
}

export function usePermissionGroups({
  allPermissions,
  searchQuery,
  selectedPermissions,
  bulkSelection,
  bulkMode,
}: UsePermissionGroupsOptions) {
  // All groups expanded by default
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    new Set(PERMISSION_GROUPS.map((g) => g.id)),
  );

  /**
   * Create permission map for quick lookup
   */
  const permissionMap = useMemo(() => {
    const map = new Map<string, PermissionDTO>();
    allPermissions.forEach((perm) => map.set(perm.name, perm));
    return map;
  }, [allPermissions]);

  /**
   * Group permissions by logical categories
   */
  const groupedPermissions = useMemo((): PermissionGroup[] => {
    return PERMISSION_GROUPS.map((group) => ({
      ...group,
      permissions: group.permissions
        .map((permKey) => permissionMap.get(permKey))
        .filter((perm): perm is PermissionDTO => perm !== undefined),
    }));
  }, [permissionMap]);

  /**
   * Filter groups and permissions based on search query
   */
  const filteredGroups = useMemo((): PermissionGroup[] => {
    if (!searchQuery.trim()) return groupedPermissions;

    const query = searchQuery.toLowerCase();
    return groupedPermissions
      .map((group) => ({
        ...group,
        permissions: group.permissions.filter(
          (perm) =>
            perm.name.toLowerCase().includes(query) ||
            perm.displayName.toLowerCase().includes(query) ||
            (perm.description ?? "").toLowerCase().includes(query) ||
            perm.resource.toLowerCase().includes(query) ||
            perm.action.toLowerCase().includes(query),
        ),
      }))
      .filter((group) => group.permissions.length > 0);
  }, [groupedPermissions, searchQuery]);

  /**
   * Toggle group expansion
   */
  const toggleGroup = useCallback((groupId: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  }, []);

  /**
   * Toggle all permissions in a group
   */
  const toggleAllInGroup = useCallback(
    (
      groupId: string,
      checked: boolean,
      setSelectedPermissions: React.Dispatch<React.SetStateAction<Set<string>>>,
      setBulkSelection: React.Dispatch<React.SetStateAction<Set<string>>>,
    ) => {
      const group = groupedPermissions.find((g) => g.id === groupId);
      if (!group) return;

      if (bulkMode) {
        setBulkSelection((prev) => {
          const next = new Set(prev);
          group.permissions.forEach((perm) => {
            if (checked) {
              next.add(perm.name);
            } else {
              next.delete(perm.name);
            }
          });
          return next;
        });
      } else {
        setSelectedPermissions((prev) => {
          const next = new Set(prev);
          group.permissions.forEach((perm) => {
            if (checked) {
              next.add(perm.name);
            } else {
              next.delete(perm.name);
            }
          });
          return next;
        });
      }
    },
    [groupedPermissions, bulkMode],
  );

  /**
   * Get group statistics
   */
  const getGroupStats = useCallback(
    (groupId: string) => {
      const group = groupedPermissions.find((g) => g.id === groupId);
      if (!group || group.permissions.length === 0) {
        return {
          selectedCount: 0,
          totalCount: 0,
          isFullySelected: false,
          isPartiallySelected: false,
        };
      }

      const targetSet = bulkMode ? bulkSelection : selectedPermissions;
      const selectedCount = group.permissions.filter((perm) =>
        targetSet.has(perm.name),
      ).length;
      const totalCount = group.permissions.length;
      const isFullySelected = selectedCount === totalCount;
      const isPartiallySelected =
        selectedCount > 0 && selectedCount < totalCount;

      return {
        selectedCount,
        totalCount,
        isFullySelected,
        isPartiallySelected,
      };
    },
    [groupedPermissions, selectedPermissions, bulkSelection, bulkMode],
  );

  return {
    permissionMap,
    groupedPermissions,
    filteredGroups,
    expandedGroups,
    toggleGroup,
    toggleAllInGroup,
    getGroupStats,
  };
}
