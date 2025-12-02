/**
 * Asset Categories Table Component
 */

"use client";

import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { format } from "date-fns";

import { DataTable, DataTableColumnHeader } from "@/components/ui/data-table";

import type { AssetCategoryDTO } from "@/interface-adapters/presenters/asset-category.presenter";
import { deleteAssetCategoryAction } from "@/interface-adapters/controllers/asset-category.controller";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { useDeleteDialog } from "@/hooks/use-delete-dialog";
import { buildSelectColumn, buildActionsColumn } from "@/lib/table-utils";

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
  // Use reusable delete dialog hook
  const deleteDialog = useDeleteDialog<AssetCategoryDTO>({
    onDelete: (category) => deleteAssetCategoryAction(category.id),
    onSuccess: onRefresh,
    getItemName: (category) => category.name,
    entityName: "Asset Category",
  });

  const baseColumns = React.useMemo<ColumnDef<AssetCategoryDTO>[]>(
    () => [
      buildSelectColumn<AssetCategoryDTO>(),
      {
        accessorKey: "name",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Name" />
        ),
        cell: ({ row }) => {
          const name = row.getValue("name") as string;
          return (
            <div className="flex flex-col gap-1">
              <Link
                href={`/asset-categories/${row.original.id}`}
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
      buildActionsColumn<AssetCategoryDTO>([
        {
          type: "edit",
          label: "Edit",
          permission: PERMISSIONS.ASSET_CATEGORIES_UPDATE,
          onClick: onEdit,
        },
        {
          type: "delete",
          label: "Delete",
          permission: PERMISSIONS.ASSET_CATEGORIES_DELETE,
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
