/**
 * Asset Models Table Component
 */

"use client";

import * as React from "react";
import Link from "next/link";
import { type ColumnDef } from "@tanstack/react-table";
import { FolderTree, Building2 } from "lucide-react";
import { format } from "date-fns";

import { DataTable, DataTableColumnHeader } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { EntityDisplay } from "@/components/ui/entity-display";

import type { AssetModelDTO } from "@/interface-adapters/presenters/asset-model.presenter";
import { deleteAssetModelAction } from "@/interface-adapters/controllers/asset-model.controller";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { useDeleteDialog } from "@/hooks/use-delete-dialog";
import { buildSelectColumn, buildActionsColumn } from "@/lib/table-utils";

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
  // Use reusable hooks
  const deleteDialog = useDeleteDialog<AssetModelDTO>({
    onDelete: (assetModel) => deleteAssetModelAction(assetModel.id),
    onSuccess: onRefresh,
    getItemName: (assetModel) => assetModel.name,
    entityName: "Asset Model",
  });

  const baseColumns = React.useMemo<ColumnDef<AssetModelDTO>[]>(
    () => [
      buildSelectColumn<AssetModelDTO>(),
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
    ],
    [],
  );

  // Actions column using reusable builder
  const actionsColumn = React.useMemo(
    () =>
      buildActionsColumn<AssetModelDTO>([
        {
          type: "edit",
          label: "Edit",
          permission: PERMISSIONS.ASSET_MODELS_UPDATE,
          onClick: onEdit,
        },
        {
          type: "delete",
          label: "Delete",
          permission: PERMISSIONS.ASSET_MODELS_DELETE,
          variant: "destructive",
          separator: true,
          onClick: deleteDialog.openDialog,
        },
      ]),
    [onEdit, deleteDialog.openDialog],
  );

  // Merge static columns + actions column
  const allColumns = React.useMemo(() => {
    return [...baseColumns, actionsColumn];
  }, [baseColumns, actionsColumn]);

  return (
    <>
      <DataTable columns={allColumns} data={data} loading={loading} />

      {/* Delete Confirmation Dialog */}
      <deleteDialog.DialogComponent />
    </>
  );
}
