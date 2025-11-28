/**
 * Asset Models Table Component
 */

"use client";

import * as React from "react";
import Link from "next/link";
import { type ColumnDef } from "@tanstack/react-table";
import {
  MoreHorizontal,
  Trash2,
  Pencil,
  FolderTree,
  Building2,
  ExternalLink,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

import { DataTable, DataTableColumnHeader } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { EntityDisplay } from "@/components/ui/entity-display";
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

import type { AssetModelDTO } from "@/interface-adapters/presenters/asset-model.presenter";
import { deleteAssetModelAction } from "@/interface-adapters/controllers/asset-model.controller";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { usePermissions } from "@/hooks/use-permissions";

interface AssetModelsTableProps {
  data: AssetModelDTO[];
  loading?: boolean;
  onEdit: (assetModel: AssetModelDTO) => void;
  onRefresh: () => void;
}

export function AssetModelsTable({
  data,
  loading = false,
  onEdit,
  onRefresh,
}: AssetModelsTableProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [assetModelToDelete, setAssetModelToDelete] =
    React.useState<AssetModelDTO | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);

  const { hasPermission } = usePermissions();

  const handleDelete = async (assetModel: AssetModelDTO) => {
    setIsDeleting(true);
    try {
      const result = await deleteAssetModelAction(assetModel.id);
      if (result.success) {
        toast.success("Asset model deleted successfully");
        onRefresh();
      } else {
        toast.error(result.error);
      }
    } catch (_error) {
      toast.error("Failed to delete asset model");
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setAssetModelToDelete(null);
    }
  };

  const columns: ColumnDef<AssetModelDTO>[] = [
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
        <DataTableColumnHeader column={column} title="Model" />
      ),
      cell: ({ row }) => {
        const name = row.getValue("name") as string;
        return (
          <div className="flex flex-col gap-1">
            <Link
              href={`/asset-models/${row.original.id}`}
              className="text-primary font-medium hover:underline"
            >
              {name}
            </Link>
            <span className="text-muted-foreground text-xs">
              {row.original.code}
            </span>
          </div>
        );
      },
      meta: {
        label: "Model",
      },
    },
    {
      accessorKey: "assetCategoryId",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Category" />
      ),
      cell: ({ row }) => (
        <EntityDisplay name={row.original.categoryName} icon={FolderTree} />
      ),
      meta: {
        label: "Category",
      },
    },
    {
      accessorKey: "vendorId",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Manufacturer" />
      ),
      cell: ({ row }) => (
        <EntityDisplay name={row.original.vendorName} icon={Building2} />
      ),
      meta: {
        label: "Manufacturer",
      },
    },
    {
      accessorKey: "defaultWarrantyMonths",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Warranty" />
      ),
      cell: ({ row }) => {
        const months = row.getValue("defaultWarrantyMonths") as number | null;
        if (!months) {
          return <span className="text-muted-foreground text-sm">—</span>;
        }
        const years = Math.floor(months / 12);
        const remainingMonths = months % 12;
        const parts = [];
        if (years > 0) parts.push(`${years}y`);
        if (remainingMonths > 0) parts.push(`${remainingMonths}m`);
        return (
          <Badge variant="secondary" className="text-xs">
            {parts.join(" ")}
          </Badge>
        );
      },
      meta: {
        label: "Warranty",
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
        const assetModel = row.original;
        const canUpdate = hasPermission(PERMISSIONS.ASSET_MODELS_UPDATE);
        const canDelete = hasPermission(PERMISSIONS.ASSET_MODELS_DELETE);

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
              <DropdownMenuItem asChild>
                <Link href={`/asset-models/${assetModel.id}`}>
                  <ExternalLink className="mr-2 h-4 w-4" />
                  View Details
                </Link>
              </DropdownMenuItem>
              {canUpdate && (
                <DropdownMenuItem onClick={() => onEdit(assetModel)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
              )}
              {canDelete && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => {
                      setAssetModelToDelete(assetModel);
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
            <AlertDialogTitle>Delete Asset Model?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete &quot;{assetModelToDelete?.name}
              &quot;. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (assetModelToDelete) {
                  handleDelete(assetModelToDelete);
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
