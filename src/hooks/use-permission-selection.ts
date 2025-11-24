/**
 * Hook: usePermissionSelection
 *
 * Manages permission selection state and operations.
 * Handles:
 * - Selection state (Set of permission names)
 * - Toggle individual permissions
 * - Add missing dependencies automatically
 * - Check if there are changes from original
 */

import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";

import type { ValidationResult } from "@/lib/rbac/permission-dependencies";

interface UsePermissionSelectionOptions {
  initialPermissions: string[];
}

export function usePermissionSelection({
  initialPermissions,
}: UsePermissionSelectionOptions) {
  const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(
    new Set(initialPermissions),
  );

  const originalPermissions = useMemo(
    () => new Set(initialPermissions),
    [initialPermissions],
  );

  /**
   * Toggle a single permission on/off
   */
  const togglePermission = useCallback((permissionName: string) => {
    setSelectedPermissions((prev) => {
      const next = new Set(prev);
      if (next.has(permissionName)) {
        next.delete(permissionName);
      } else {
        next.add(permissionName);
      }
      return next;
    });
  }, []);

  /**
   * Check if there are changes from the original state
   */
  const hasChanges = useCallback(() => {
    if (originalPermissions.size !== selectedPermissions.size) return true;
    for (const perm of selectedPermissions) {
      if (!originalPermissions.has(perm)) return true;
    }
    return false;
  }, [selectedPermissions, originalPermissions]);

  /**
   * Reset to original permissions
   */
  const reset = useCallback(() => {
    setSelectedPermissions(new Set(initialPermissions));
    toast.info("Changes discarded");
  }, [initialPermissions]);

  /**
   * Add missing dependencies automatically
   */
  const addMissingDependencies = useCallback(
    (dependencyValidation: ValidationResult) => {
      setSelectedPermissions((prev) => {
        const next = new Set(prev);
        dependencyValidation.missing.forEach((item) => {
          item.requiredDependencies.forEach((dep) => next.add(dep));
        });
        return next;
      });

      const totalAdded = dependencyValidation.missing.reduce(
        (sum, item) => sum + item.requiredDependencies.length,
        0,
      );
      toast.success(`Added ${totalAdded} missing dependencies`);
    },
    [],
  );

  return {
    selectedPermissions,
    setSelectedPermissions,
    togglePermission,
    hasChanges,
    reset,
    addMissingDependencies,
  };
}
