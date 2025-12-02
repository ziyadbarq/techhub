/**
 * useDeleteDialog Hook
 *
 * Reusable hook for delete confirmation dialogs with proper state management.
 * Eliminates ~50 lines of boilerplate per table component.
 *
 * @example
 * ```tsx
 * const deleteDialog = useDeleteDialog({
 *   onDelete: (asset) => deleteAssetAction(asset.assetTag),
 *   onSuccess: onRefresh,
 *   getItemName: (asset) => asset.assetTag,
 *   entityName: "Asset",
 * });
 *
 * // In actions column
 * onClick: deleteDialog.openDialog
 *
 * // In JSX
 * <deleteDialog.DialogComponent />
 * ```
 */

"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { ActionResponse } from "@/interface-adapters/controllers/types";

export interface UseDeleteDialogOptions<T> {
  /** Function to delete the item - should return ActionResponse or simple success/error result */
  onDelete: (
    item: T,
  ) => Promise<
    | ActionResponse<unknown>
    | { success: true }
    | { success: false; error: string }
  >;
  /** Callback after successful deletion */
  onSuccess: () => void;
  /** Function to get display name for the item */
  getItemName: (item: T) => string;
  /** Entity name for messages (e.g., "Asset", "Vendor") */
  entityName?: string;
  /** Custom description for the dialog */
  description?: string;
}

export interface UseDeleteDialogReturn<T> {
  /** Function to open the dialog with an item */
  openDialog: (item: T) => void;
  /** Dialog component to render */
  DialogComponent: () => React.JSX.Element;
  /** Whether the dialog is open */
  isOpen: boolean;
  /** Whether delete is in progress */
  isDeleting: boolean;
}

export function useDeleteDialog<T>({
  onDelete,
  onSuccess,
  getItemName,
  entityName = "item",
  description,
}: UseDeleteDialogOptions<T>): UseDeleteDialogReturn<T> {
  const [isOpen, setIsOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<T | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const openDialog = useCallback((item: T) => {
    setItemToDelete(item);
    setIsOpen(true);
  }, []);

  const handleDelete = useCallback(async () => {
    if (!itemToDelete) return;

    setIsDeleting(true);
    try {
      const result = await onDelete(itemToDelete);
      if (result.success) {
        toast.success(`${entityName} deleted successfully`);
        onSuccess();
        setIsOpen(false);
        setItemToDelete(null);
      } else {
        toast.error(
          result.error || `Failed to delete ${entityName.toLowerCase()}`,
        );
      }
    } catch (_error) {
      toast.error(`Failed to delete ${entityName.toLowerCase()}`);
    } finally {
      setIsDeleting(false);
    }
  }, [itemToDelete, onDelete, onSuccess, entityName]);

  const DialogComponent = useCallback(
    () => (
      <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {entityName}?</AlertDialogTitle>
            <AlertDialogDescription>
              {description ||
                `This will permanently delete "${itemToDelete ? getItemName(itemToDelete) : ""}". This action cannot be undone.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    ),
    [
      isOpen,
      itemToDelete,
      isDeleting,
      handleDelete,
      entityName,
      getItemName,
      description,
    ],
  );

  return {
    openDialog,
    DialogComponent,
    isOpen,
    isDeleting,
  };
}
