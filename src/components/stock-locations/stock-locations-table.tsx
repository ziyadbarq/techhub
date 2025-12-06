/**
 * Stock Locations Table Component
 * Displays stock locations with filtering, sorting, and actions
 */

"use client";
"use no memo";

import * as React from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { MapPin, Package } from "lucide-react";

import { DataTable, DataTableColumnHeader } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";

import type { StockLocationDTO } from "@/interface-adapters/presenters/stock-location.presenter";
import { deleteStockLocationAction } from "@/interface-adapters/controllers/stock-location.controller";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { useDeleteDialog } from "@/hooks/use-delete-dialog";
import { useColumnVisibilityEnhanced } from "@/hooks";
import { buildSelectColumn, buildActionsColumn } from "@/lib/table-utils";

interface StockLocationsTableProps {
  data: StockLocationDTO[];
  loading?: boolean;
  onEdit: (stockLocation: StockLocationDTO) => void;
  onRefresh: () => void;
}

export function StockLocationsTable({
  data,
  loading = false,
  onEdit,
  onRefresh,
}: StockLocationsTableProps) {
  // Use reusable hooks
  const deleteDialog = useDeleteDialog<StockLocationDTO>({
    onDelete: (stockLocation) => deleteStockLocationAction(stockLocation.id),
    onSuccess: onRefresh,
    getItemName: (stockLocation) => stockLocation.name,
    entityName: "Stock Location",
  });

  const [_selectedRows, _setSelectedRows] = React.useState<StockLocationDTO[]>(
    [],
  );

  const baseColumns = React.useMemo<ColumnDef<StockLocationDTO>[]>(
    () => [
      buildSelectColumn<StockLocationDTO>(),
      {
        accessorKey: "code",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Code" />
        ),
        cell: ({ row }) => {
          const code = row.getValue("code") as string;
          return (
            <div className="flex items-center gap-2">
              <Package className="text-muted-foreground h-4 w-4" />
              <span className="font-mono font-medium">{code}</span>
            </div>
          );
        },
        meta: {
          label: "Code",
        },
      },
      {
        accessorKey: "name",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Name" />
        ),
        cell: ({ row }) => {
          const name = row.getValue("name") as string;
          return <span className="font-medium">{name}</span>;
        },
        meta: {
          label: "Name",
        },
      },
      {
        accessorKey: "locationId",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Physical Location" />
        ),
        cell: ({ row }) => {
          const locationId = row.getValue("locationId") as string | null;
          return locationId ? (
            <div className="flex items-center gap-2">
              <MapPin className="text-muted-foreground h-4 w-4" />
              <Badge variant="outline">Linked</Badge>
            </div>
          ) : (
            <span className="text-muted-foreground text-sm">Not linked</span>
          );
        },
        meta: {
          label: "Physical Location",
        },
      },
      {
        accessorKey: "description",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Description" />
        ),
        cell: ({ row }) => {
          const description = row.getValue("description") as string | null;
          return description ? (
            <span className="text-muted-foreground line-clamp-2 text-sm">
              {description}
            </span>
          ) : (
            <span className="text-muted-foreground text-sm">—</span>
          );
        },
        meta: {
          label: "Description",
          hiddenByDefault: true,
        },
      },
    ],
    [],
  );

  // Actions column using reusable builder
  const actionsColumn = React.useMemo(
    () =>
      buildActionsColumn<StockLocationDTO>([
        {
          type: "edit",
          label: "Edit",
          permission: PERMISSIONS.STOCK_LOCATIONS_UPDATE,
          onClick: onEdit,
        },
        {
          type: "delete",
          label: "Delete",
          permission: PERMISSIONS.STOCK_LOCATIONS_DELETE,
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

  // Column visibility with persistence
  const { visibility, onVisibilityChange } =
    useColumnVisibilityEnhanced<StockLocationDTO>({
      storageKey: "stock-locations-table-columns",
      columns: allColumns,
    });

  return (
    <>
      <DataTable
        columns={allColumns}
        data={data}
        loading={loading}
        initialColumnVisibility={visibility}
        onColumnVisibilityChange={onVisibilityChange}
      />

      {/* Delete Confirmation Dialog */}
      <deleteDialog.DialogComponent />
    </>
  );
}
