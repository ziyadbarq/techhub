/**
 * Asset Kits Table Component
 */

"use client";
"use no memo";

import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";

import { DataTable, DataTableColumnHeader } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";

import type { AssetKitDTO } from "@/interface-adapters/dtos/generated/asset-kit.dto";
import { deleteAssetKitAction } from "@/interface-adapters/controllers/asset-kit.controller";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { useDeleteDialog } from "@/hooks/use-delete-dialog";
import { buildSelectColumn, buildActionsColumn } from "@/lib/table-utils";

interface AssetKitsTableProps {
  data: AssetKitDTO[];
  loading?: boolean;
  onView: (kit: AssetKitDTO) => void;
  onEdit: (kit: AssetKitDTO) => void;
  onRefresh: () => void;
}

export function AssetKitsTable({
  data,
  loading = false,
  onView,
  onEdit,
  onRefresh,
}: AssetKitsTableProps) {
  // Use reusable hooks
  const deleteDialog = useDeleteDialog<AssetKitDTO>({
    onDelete: (kit) => deleteAssetKitAction(kit.id),
    onSuccess: onRefresh,
    getItemName: (kit) => kit.name,
    entityName: "Asset Kit",
  });

  const baseColumns = React.useMemo<ColumnDef<AssetKitDTO>[]>(
    () => [
      buildSelectColumn<AssetKitDTO>(),
      {
        accessorKey: "code",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Code" />
        ),
        cell: ({ row }) => (
          <div className="font-mono font-medium">
            {row.getValue<string>("code")}
          </div>
        ),
        meta: {
          label: "Code",
        },
      },
      {
        accessorKey: "name",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Name" />
        ),
        cell: ({ row }) => <div>{row.getValue<string>("name")}</div>,
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
          const desc = row.getValue<string | null>("description");
          return (
            <div className="max-w-[300px] truncate">
              {desc || (
                <span className="text-muted-foreground">No description</span>
              )}
            </div>
          );
        },
        meta: {
          label: "Description",
        },
      },
      {
        accessorKey: "isActive",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Status" />
        ),
        cell: ({ row }) => {
          const isActive = row.getValue<boolean>("isActive");
          return (
            <Badge
              variant="outline"
              className={
                isActive
                  ? "border-green-500/20 bg-green-500/10 text-green-500"
                  : "border-gray-500/20 bg-gray-500/10 text-gray-500"
              }
            >
              {isActive ? "Active" : "Inactive"}
            </Badge>
          );
        },
        meta: {
          label: "Status",
        },
      },
    ],
    [],
  );

  // Actions column using reusable builder
  const actionsColumn = React.useMemo(
    () =>
      buildActionsColumn<AssetKitDTO>([
        {
          type: "view",
          label: "View",
          onClick: onView,
        },
        {
          type: "edit",
          label: "Edit",
          permission: PERMISSIONS.ASSET_KITS_UPDATE,
          onClick: onEdit,
        },
        {
          type: "delete",
          label: "Delete",
          permission: PERMISSIONS.ASSET_KITS_DELETE,
          variant: "destructive",
          separator: true,
          onClick: deleteDialog.openDialog,
        },
      ]),
    [onView, onEdit, deleteDialog.openDialog],
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
