/**
 * Asset Categories Table Component
 */

"use client";

import * as React from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, Trash2, Pencil } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

import { DataTable, DataTableColumnHeader } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

import type { AssetCategoryDTO } from "@/interface-adapters/presenters/asset-category.presenter";
import { deleteAssetCategoryAction } from "@/interface-adapters/controllers/asset-category.controller";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { usePermissions } from "@/hooks/use-permissions";

interface AssetCategoriesTableProps {
  data: AssetCategoryDTO[];
  loading?: boolean;
  onEdit: (assetCategory: AssetCategoryDTO) => void;
  onRefresh: () => void;
}

export function AssetCategoriesTable({
  data,
  loading = false,
  onEdit,
  onRefresh,
}: AssetCategoriesTableProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [assetCategoryToDelete, setAssetCategoryToDelete] =
    React.useState<AssetCategoryDTO | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);

  const { hasPermission } = usePermissions();

  const handleDelete = async (assetCategory: AssetCategoryDTO) => {
    setIsDeleting(true);
    try {
      const result = await deleteAssetCategoryAction(assetCategory.id);
      if (result.success) {
        toast.success("Asset category deleted successfully");
        onRefresh();
      } else {
        toast.error(result.error);
      }
    } catch (_error) {
      toast.error("Failed to delete asset category");
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setAssetCategoryToDelete(null);
    }
  };

  const columns: ColumnDef<AssetCategoryDTO>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Name" />
      ),
      cell: ({ row }) => {
        const name = row.getValue("name") as string;
        return (
          <div className="flex flex-col gap-1">
            <span className="font-medium">{name}</span>
            <span className="text-muted-foreground text-xs">
              {row.original.code}
            </span>
          </div>
        );
      },
      meta: {
        label: "Name",
      },
    },
    {
      accessorKey: "description",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Description" />
      ),
      cell: ({ row }) => {
        const description = row.getValue("description") as string | null;
        return (
          <span className="text-muted-foreground text-sm">
            {description || "—"}
          </span>
        );
      },
      meta: {
        label: "Description",
      },
    },
    {
      accessorKey: "isConsumable",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Type" />
      ),
      cell: ({ row }) => {
        const isConsumable = row.getValue("isConsumable") as boolean;
        return (
          <Badge variant={isConsumable ? "secondary" : "default"}>
            {isConsumable ? "Consumable" : "Tracked"}
          </Badge>
        );
      },
      meta: {
        label: "Type",
      },
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Created" />
      ),
      cell: ({ row }) => {
        const createdAt = row.getValue("createdAt") as string;
        return (
          <span className="text-muted-foreground text-sm">
            {format(new Date(createdAt), "MMM d, yyyy")}
          </span>
        );
      },
      meta: {
        label: "Created",
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const assetCategory = row.original;
        const canUpdate = hasPermission(PERMISSIONS.ASSET_CATEGORIES_UPDATE);
        const canDelete = hasPermission(PERMISSIONS.ASSET_CATEGORIES_DELETE);

        if (!canUpdate && !canDelete) {
          return null;
        }

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {canUpdate && (
                <DropdownMenuItem onClick={() => onEdit(assetCategory)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
              )}
              {canDelete && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => {
                      setAssetCategoryToDelete(assetCategory);
                      setDeleteDialogOpen(true);
                    }}
                    className="text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  return (
    <>
      <DataTable columns={columns} data={data} loading={loading} />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Asset Category?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete &quot;{assetCategoryToDelete?.name}
              &quot;. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (assetCategoryToDelete) {
                  handleDelete(assetCategoryToDelete);
                }
              }}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
