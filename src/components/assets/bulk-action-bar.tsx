"use client";

/**
 * Bulk Action Bar Component
 *
 * Floating action bar that appears when assets are selected.
 * Provides bulk operations: delete, change status, export selected.
 */

import { useState } from "react";
import { Trash2, RefreshCw, Download, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { usePermissions } from "@/hooks/use-permissions";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import type { AssetDTO } from "@/interface-adapters/presenters/asset.presenter";
import type { AssetFilterOptions } from "@/interface-adapters/controllers/asset.controller";
import {
  bulkDeleteAssetsAction,
  bulkUpdateAssetStatusAction,
} from "@/interface-adapters/controllers/asset.controller";

interface BulkActionBarProps {
  selectedAssets: AssetDTO[];
  onClearSelection: () => void;
  onSuccess: () => void;
  onExportSelected: (assets: AssetDTO[]) => void;
  filterOptions: AssetFilterOptions | null;
}

export function BulkActionBar({
  selectedAssets,
  onClearSelection,
  onSuccess,
  onExportSelected,
  filterOptions,
}: BulkActionBarProps) {
  const { hasPermission } = usePermissions();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>("");

  const canDelete = hasPermission(PERMISSIONS.ASSETS_DELETE);
  const canUpdate = hasPermission(PERMISSIONS.ASSETS_UPDATE);

  const handleBulkDelete = async () => {
    if (selectedAssets.length === 0) return;

    setIsDeleting(true);
    try {
      const result = await bulkDeleteAssetsAction(
        selectedAssets.map((a) => a.id),
      );

      if (result.success && result.data) {
        const { deletedCount, skippedCount } = result.data;
        if (deletedCount > 0) {
          toast.success(`Deleted ${deletedCount} asset(s)`);
          if (skippedCount > 0) {
            toast.warning(
              `${skippedCount} asset(s) were skipped (may have active assignments)`,
            );
          }
          onClearSelection();
          onSuccess();
        } else if (skippedCount > 0) {
          toast.error(
            `Could not delete any assets. ${skippedCount} asset(s) have active assignments.`,
          );
        }
      } else if (!result.success) {
        toast.error(result.error);
      }
    } catch {
      toast.error("An error occurred while deleting assets");
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const handleBulkStatusChange = async () => {
    if (selectedAssets.length === 0 || !selectedStatus) return;

    setIsUpdating(true);
    try {
      const result = await bulkUpdateAssetStatusAction(
        selectedAssets.map((a) => a.id),
        selectedStatus,
      );

      if (result.success && result.data) {
        const { updatedCount, requestedCount } = result.data;
        if (updatedCount > 0) {
          toast.success(`Updated ${updatedCount} asset(s)`);
          if (updatedCount < requestedCount) {
            toast.warning(
              `${requestedCount - updatedCount} asset(s) could not be updated`,
            );
          }
          onClearSelection();
          onSuccess();
        }
      } else if (!result.success) {
        toast.error(result.error);
      }
    } catch {
      toast.error("An error occurred while updating assets");
    } finally {
      setIsUpdating(false);
      setShowStatusDialog(false);
      setSelectedStatus("");
    }
  };

  const handleExport = () => {
    onExportSelected(selectedAssets);
    toast.success(`Exporting ${selectedAssets.length} asset(s)...`);
  };

  if (selectedAssets.length === 0) {
    return null;
  }

  return (
    <>
      <Card className="border-primary/50 bg-primary/5">
        <CardContent className="flex items-center justify-between py-3">
          <div className="flex items-center gap-3">
            <span className="font-medium">
              {selectedAssets.length} asset
              {selectedAssets.length !== 1 ? "s" : ""} selected
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearSelection}
              className="h-7 gap-1 px-2"
            >
              <X className="h-3 w-3" />
              Clear
            </Button>
          </div>

          <div className="flex items-center gap-2">
            {/* Export Selected */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              className="gap-1"
            >
              <Download className="h-4 w-4" />
              Export
            </Button>

            {/* Change Status */}
            {canUpdate && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowStatusDialog(true)}
                disabled={isUpdating}
                className="gap-1"
              >
                <RefreshCw className="h-4 w-4" />
                Change Status
              </Button>
            )}

            {/* Delete */}
            {canDelete && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setShowDeleteDialog(true)}
                disabled={isDeleting}
                className="gap-1"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete {selectedAssets.length} Asset(s)?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. Assets with active assignments will
              be skipped.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Status Change Dialog */}
      <AlertDialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Change Status for {selectedAssets.length} Asset(s)
            </AlertDialogTitle>
            <AlertDialogDescription>
              Select a new lifecycle state to apply to all selected assets.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="py-4">
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Select new status..." />
              </SelectTrigger>
              <SelectContent>
                {filterOptions?.lifecycleStates.map((state) => (
                  <SelectItem key={state.value} value={state.value}>
                    {state.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isUpdating}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkStatusChange}
              disabled={isUpdating || !selectedStatus}
            >
              {isUpdating ? "Updating..." : "Update Status"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
