/**
 * Exchange Rates Table Component
 */

"use client";
"use no memo";

import * as React from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { TrendingUp } from "lucide-react";
import { format } from "date-fns";

import { DataTable, DataTableColumnHeader } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";

import type { ExchangeRateResponseDTO } from "@/interface-adapters/presenters/exchange-rate.presenter";
import { deleteExchangeRateAction } from "@/interface-adapters/controllers/exchange-rate.controller";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { getCurrencySymbol } from "@/lib/utils";
import { useDeleteDialog } from "@/hooks/use-delete-dialog";
import { useColumnVisibilityEnhanced } from "@/hooks";
import { buildSelectColumn, buildActionsColumn } from "@/lib/table-utils";

interface FxRatesTableProps {
  data: ExchangeRateResponseDTO[];
  loading?: boolean;
  onEdit: (rate: ExchangeRateResponseDTO) => void;
  onRefresh: () => void;
}

export function FxRatesTable({
  data,
  loading = false,
  onEdit,
  onRefresh,
}: FxRatesTableProps) {
  // Use reusable delete dialog hook
  const deleteDialog = useDeleteDialog<ExchangeRateResponseDTO>({
    onDelete: (rate) => deleteExchangeRateAction(rate.id),
    onSuccess: onRefresh,
    getItemName: (rate) => rate.currency,
    entityName: "Exchange Rate",
    description:
      "This will mark the exchange rate as inactive. Existing asset values in this currency will remain unchanged.",
  });

  const baseColumns = React.useMemo<ColumnDef<ExchangeRateResponseDTO>[]>(
    () => [
      buildSelectColumn<ExchangeRateResponseDTO>(),
      {
        accessorKey: "currency",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Currency" />
        ),
        cell: ({ row }) => {
          const currency = row.getValue("currency") as string;
          const symbol = getCurrencySymbol(currency);
          return (
            <div className="flex flex-col gap-1">
              <span className="font-medium">
                {currency} ({symbol})
              </span>
            </div>
          );
        },
        meta: {
          label: "Currency",
        },
      },
      {
        accessorKey: "rateToSAR",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Rate to SAR" />
        ),
        cell: ({ row }) => {
          const rate = row.getValue("rateToSAR") as number;
          const currency = row.original.currency;
          return (
            <div className="flex items-center gap-2">
              <TrendingUp className="text-muted-foreground h-4 w-4" />
              <span className="font-mono">
                1 {currency} = {rate.toFixed(6)} SAR
              </span>
            </div>
          );
        },
        meta: {
          label: "Rate to SAR",
        },
      },
      {
        accessorKey: "isActive",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Status" />
        ),
        cell: ({ row }) => {
          const isActive = row.getValue("isActive") as boolean;
          return (
            <Badge variant={isActive ? "default" : "outline"}>
              {isActive ? "Active" : "Inactive"}
            </Badge>
          );
        },
        filterFn: (row, id, value: string) => {
          if (value === "all") return true;
          const isActive = row.getValue(id) as boolean;
          return value === "active" ? isActive : !isActive;
        },
        meta: {
          label: "Status",
          filterOptions: [
            { label: "All", value: "all" },
            { label: "Active", value: "active" },
            { label: "Inactive", value: "inactive" },
          ],
        },
      },
      {
        accessorKey: "updatedAt",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Last Updated" />
        ),
        cell: ({ row }) => {
          const date = row.getValue("updatedAt") as Date;
          return (
            <span className="text-muted-foreground text-sm">
              {format(new Date(date), "MMM d, yyyy")}
            </span>
          );
        },
        meta: {
          label: "Last Updated",
          hiddenByDefault: true,
        },
      },
    ],
    [],
  );

  // Actions column using reusable builder
  const actionsColumn = React.useMemo(
    () =>
      buildActionsColumn<ExchangeRateResponseDTO>([
        {
          type: "edit",
          label: "Edit Rate",
          permission: PERMISSIONS.FX_RATES_UPDATE,
          onClick: onEdit,
        },
        {
          type: "delete",
          label: "Delete",
          permission: PERMISSIONS.FX_RATES_DELETE,
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
    useColumnVisibilityEnhanced<ExchangeRateResponseDTO>({
      storageKey: "fx-rates-table-columns",
      columns: allColumns,
    });

  return (
    <>
      <DataTable
        columns={allColumns}
        data={data}
        loading={loading}
        searchKey="currency"
        searchPlaceholder="Search currencies..."
        initialColumnVisibility={visibility}
        onColumnVisibilityChange={onVisibilityChange}
      />

      {/* Delete Confirmation Dialog */}
      <deleteDialog.DialogComponent />
    </>
  );
}
