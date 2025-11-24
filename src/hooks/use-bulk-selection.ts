/**
 * Hook: useBulkSelection
 *
 * Manages bulk mode state and operations.
 * Handles:
 * - Bulk mode toggle
 * - Bulk selection state (Set of permission names)
 * - Toggle individual items in bulk selection
 * - Add bulk selections to target set
 * - Remove bulk selections from target set
 * - Clear bulk selection
 */

import { useCallback, useState } from "react";
import { toast } from "sonner";

export function useBulkSelection() {
  const [bulkMode, setBulkMode] = useState(false);
  const [bulkSelection, setBulkSelection] = useState<Set<string>>(new Set());

  /**
   * Toggle a single permission in bulk selection
   */
  const toggleBulkSelection = useCallback((permissionName: string) => {
    setBulkSelection((prev) => {
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
   * Add all bulk-selected items to the target set
   */
  const addBulk = useCallback(
    (
      targetSet: Set<string>,
      setTarget: React.Dispatch<React.SetStateAction<Set<string>>>,
    ) => {
      setTarget((prev) => {
        const next = new Set(prev);
        bulkSelection.forEach((perm) => next.add(perm));
        return next;
      });
      const count = bulkSelection.size;
      setBulkSelection(new Set());
      toast.success(`Added ${count} permissions`);
    },
    [bulkSelection],
  );

  /**
   * Remove all bulk-selected items from the target set
   */
  const removeBulk = useCallback(
    (
      targetSet: Set<string>,
      setTarget: React.Dispatch<React.SetStateAction<Set<string>>>,
    ) => {
      setTarget((prev) => {
        const next = new Set(prev);
        bulkSelection.forEach((perm) => next.delete(perm));
        return next;
      });
      const count = bulkSelection.size;
      setBulkSelection(new Set());
      toast.success(`Removed ${count} permissions`);
    },
    [bulkSelection],
  );

  /**
   * Clear bulk selection
   */
  const clearBulk = useCallback(() => {
    setBulkSelection(new Set());
    toast.info("Selection cleared");
  }, []);

  /**
   * Toggle bulk mode and reset selection when turning off
   */
  const toggleBulkMode = useCallback((enabled: boolean) => {
    setBulkMode(enabled);
    if (!enabled) {
      setBulkSelection(new Set());
    }
  }, []);

  return {
    bulkMode,
    bulkSelection,
    setBulkMode,
    setBulkSelection,
    toggleBulkMode,
    toggleBulkSelection,
    addBulk,
    removeBulk,
    clearBulk,
  };
}
