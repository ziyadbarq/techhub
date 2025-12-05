/**
 * Assets Table Component
 */

"use client";
"use no memo";

import * as React from "react";
import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";

import { DataTable, DataTableColumnHeader } from "@/components/ui/data-table";
import { CurrencyDisplay } from "@/components/ui/currency-display";

import type { AssetDTO } from "@/interface-adapters/presenters/asset.presenter";
import { deleteAssetAction } from "@/interface-adapters/controllers/asset.controller";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { useDeleteDialog } from "@/hooks/use-delete-dialog";
import { useExchangeRates } from "@/hooks/use-exchange-rates";
import { buildSelectColumn, buildActionsColumn } from "@/lib/table-utils";

interface AssetsTableProps {
  data: AssetDTO[];
  loading?: boolean;
  onEdit: (asset: AssetDTO) => void;
  onRefresh: () => void;
  onSelectionChange?: (selectedAssets: AssetDTO[]) => void;
}

export function AssetsTable({
  data,
  loading = false,
  onEdit,
  onRefresh,
  onSelectionChange,
}: AssetsTableProps) {
  // Use reusable hooks
  const deleteDialog = useDeleteDialog<AssetDTO>({
    onDelete: (asset) => deleteAssetAction(asset.assetTag),
    onSuccess: onRefresh,
    getItemName: (asset) => asset.assetTag,
    entityName: "Asset",
  });

  const { calculateSARAmount } = useExchangeRates();

  const baseColumns = React.useMemo<ColumnDef<AssetDTO>[]>(
    () => [
      buildSelectColumn<AssetDTO>(),
      {
        accessorKey: "assetTag",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Asset Tag" />
        ),
        cell: ({ row }) => {
          const asset = row.original;
          const assetTag = row.getValue("assetTag") as string;
          const serialNumber = asset.serialNumber;
          return (
            <div className="flex flex-col gap-1">
              <Link
                href={`/assets/${asset.assetTag}`}
                className="text-primary font-medium hover:underline"
              >
                {assetTag}
              </Link>
              {serialNumber && (
                <span className="text-muted-foreground text-xs">
                  S/N: {serialNumber}
                </span>
              )}
            </div>
          );
        },
        meta: {
          label: "Asset Tag",
        },
      },
      {
        accessorKey: "categoryName",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Category" />
        ),
        cell: ({ row }) => {
          const categoryName = row.original.categoryName;
          return (
            <span className="text-sm">
              {categoryName || <span className="text-muted-foreground">—</span>}
            </span>
          );
        },
        meta: {
          label: "Category",
        },
      },
      {
        accessorKey: "modelName",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Model" />
        ),
        cell: ({ row }) => {
          const modelName = row.original.modelName;
          const vendorName = row.original.vendorName;

          if (!modelName && !vendorName) {
            return <span className="text-muted-foreground text-sm">—</span>;
          }

          return (
            <div className="flex flex-col gap-1">
              {modelName && <span className="text-sm">{modelName}</span>}
              {vendorName && (
                <span className="text-muted-foreground text-xs">
                  {vendorName}
                </span>
              )}
            </div>
          );
        },
        meta: {
          label: "Model",
        },
      },
      {
        accessorKey: "stockLocationName",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Location" />
        ),
        cell: ({ row }) => {
          const locationName = row.original.stockLocationName;
          return (
            <span className="text-sm">
              {locationName || <span className="text-muted-foreground">—</span>}
            </span>
          );
        },
        meta: {
          label: "Location",
        },
      },
      {
        accessorKey: "lifecycleStateName",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Status" />
        ),
        cell: ({ row }) => {
          const stateName = row.original.lifecycleStateName;
          return (
            <span className="text-sm">
              {stateName || <span className="text-muted-foreground">—</span>}
            </span>
          );
        },
        meta: {
          label: "Status",
        },
      },
      {
        accessorKey: "purchaseDate",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Purchase Date" />
        ),
        cell: ({ row }) => {
          const purchaseDate = row.getValue("purchaseDate") as string | null;
          if (!purchaseDate) {
            return <span className="text-muted-foreground text-sm">—</span>;
          }
          return (
            <span className="text-sm">
              {format(new Date(purchaseDate), "MMM d, yyyy")}
            </span>
          );
        },
        meta: {
          label: "Purchase Date",
        },
      },
      {
        accessorKey: "purchaseCost",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Cost" />
        ),
        cell: ({ row }) => {
          const cost = row.getValue("purchaseCost") as number | null;
          const currency = row.original.currency || "SAR";

          if (!cost) {
            return <span className="text-muted-foreground text-sm">—</span>;
          }

          // Calculate SAR conversion
          const { sarAmount, exchangeRate } = calculateSARAmount(
            cost,
            currency,
          );

          return (
            <CurrencyDisplay
              amount={cost}
              currency={currency}
              sarAmount={sarAmount}
              exchangeRate={exchangeRate}
              mode="dual"
              className="text-sm"
            />
          );
        },
        meta: {
          label: "Cost",
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
    [calculateSARAmount],
  );

  // Actions column using reusable builder
  const actionsColumn = React.useMemo(
    () =>
      buildActionsColumn<AssetDTO>([
        {
          type: "edit",
          label: "Edit",
          permission: PERMISSIONS.ASSETS_UPDATE,
          onClick: onEdit,
        },
        {
          type: "delete",
          label: "Delete",
          permission: PERMISSIONS.ASSETS_DELETE,
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
      <DataTable
        columns={allColumns}
        data={data}
        loading={loading}
        onSelectionChange={onSelectionChange}
        selectable={!!onSelectionChange}
      />

      {/* Delete Confirmation Dialog */}
      <deleteDialog.DialogComponent />
    </>
  );
}
