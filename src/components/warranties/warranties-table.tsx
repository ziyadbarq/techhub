/**
 * Warranties Table Component
 * Displays warranties with filtering, sorting, and actions
 */

"use client";
"use no memo";

import * as React from "react";
import Link from "next/link";
import { type ColumnDef } from "@tanstack/react-table";
import { Shield } from "lucide-react";
import { format } from "date-fns";

import { DataTable, DataTableColumnHeader } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { CurrencyDisplay } from "@/components/ui/currency-display";

import type { WarrantyDTO } from "@/interface-adapters/presenters/warranty.presenter";
import { deleteWarrantyAction } from "@/interface-adapters/controllers/warranty.controller";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { useDeleteDialog } from "@/hooks/use-delete-dialog";
import { useExchangeRates } from "@/hooks/use-exchange-rates";
import { useColumnVisibilityEnhanced } from "@/hooks";
import { buildSelectColumn, buildActionsColumn } from "@/lib/table-utils";
import { WarrantyStatusBadge } from "./warranty-status-badge";

interface WarrantiesTableProps {
  data: WarrantyDTO[];
  loading?: boolean;
  onEdit: (warranty: WarrantyDTO) => void;
  onRefresh: () => void;
  showAssetColumn?: boolean;
}

export function WarrantiesTable({
  data,
  loading = false,
  onEdit,
  onRefresh,
  showAssetColumn = true,
}: WarrantiesTableProps) {
  const [_selectedRows, _setSelectedRows] = React.useState<WarrantyDTO[]>([]);

  // Use reusable hooks
  const deleteDialog = useDeleteDialog<WarrantyDTO>({
    onDelete: (warranty) => deleteWarrantyAction(warranty.id),
    onSuccess: onRefresh,
    getItemName: (warranty) => warranty.policyReference || "this warranty",
    entityName: "Warranty",
  });

  const { calculateSARAmount } = useExchangeRates();

  const baseColumns = React.useMemo<ColumnDef<WarrantyDTO>[]>(
    () => [
      buildSelectColumn<WarrantyDTO>(),
      ...(showAssetColumn
        ? [
            {
              accessorKey: "assetId",
              header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Asset" />
              ),
              cell: ({ row }) => {
                const warranty = row.original;
                return (
                  <div className="flex flex-col gap-1">
                    {warranty.assetTag ? (
                      <Link
                        href={`/assets/${encodeURIComponent(warranty.assetTag)}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {warranty.assetTag}
                      </Link>
                    ) : (
                      <span className="font-medium">N/A</span>
                    )}
                  </div>
                );
              },
              meta: {
                label: "Asset",
              },
            } as ColumnDef<WarrantyDTO>,
          ]
        : []),
      {
        accessorKey: "policyReference",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Policy" />
        ),
        cell: ({ row }) => {
          const policy = row.getValue("policyReference") as string | null;
          return (
            <div className="flex items-center gap-2">
              <Shield className="text-muted-foreground h-4 w-4" />
              <span>{policy || "—"}</span>
            </div>
          );
        },
        meta: {
          label: "Policy",
        },
      },
      {
        accessorKey: "coverageType",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Coverage" />
        ),
        cell: ({ row }) => {
          const coverageType = row.getValue("coverageType") as string;
          return (
            <Badge variant="outline">{coverageType.replace(/_/g, " ")}</Badge>
          );
        },
        meta: {
          label: "Coverage",
        },
      },
      {
        accessorKey: "vendorName",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Vendor" />
        ),
        cell: ({ row }) => {
          const vendorName = row.getValue("vendorName") as string | null;
          return (
            <span className="text-sm">
              {vendorName || (
                <span className="text-muted-foreground">No vendor</span>
              )}
            </span>
          );
        },
        meta: {
          label: "Vendor",
        },
      },
      {
        accessorKey: "startDate",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Start Date" />
        ),
        cell: ({ row }) => {
          const date = new Date(row.getValue("startDate"));
          return (
            <span className="text-muted-foreground text-sm">
              {format(date, "MMM d, yyyy")}
            </span>
          );
        },
        meta: {
          label: "Start Date",
        },
      },
      {
        accessorKey: "endDate",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="End Date" />
        ),
        cell: ({ row }) => {
          const date = new Date(row.getValue("endDate"));
          return (
            <span className="text-muted-foreground text-sm">
              {format(date, "MMM d, yyyy")}
            </span>
          );
        },
        meta: {
          label: "End Date",
        },
      },
      {
        id: "status",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Status" />
        ),
        cell: ({ row }) => {
          const warranty = row.original;
          return (
            <WarrantyStatusBadge
              isActive={warranty.isActive}
              isExpired={warranty.isExpired}
              isExpiringSoon={warranty.isExpiringSoon}
              daysRemaining={warranty.daysRemaining}
            />
          );
        },
        meta: {
          label: "Status",
        },
      },
      {
        accessorKey: "cost",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Cost" />
        ),
        cell: ({ row }) => {
          const cost = row.getValue("cost") as number | null;
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
          hiddenByDefault: true,
        },
      },
    ],
    [showAssetColumn, calculateSARAmount],
  );

  // Actions column using reusable builder
  const actionsColumn = React.useMemo(
    () =>
      buildActionsColumn<WarrantyDTO>([
        {
          type: "edit",
          label: "Edit",
          permission: PERMISSIONS.WARRANTIES_UPDATE,
          onClick: onEdit,
        },
        {
          type: "delete",
          label: "Delete",
          permission: PERMISSIONS.WARRANTIES_DELETE,
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
    useColumnVisibilityEnhanced<WarrantyDTO>({
      storageKey: "warranties-table-columns",
      columns: allColumns,
    });

  return (
    <>
      <DataTable
        columns={allColumns}
        data={data}
        loading={loading}
        searchable
        searchKey="policyReference"
        searchPlaceholder="Search warranties..."
        selectable
        onSelectionChange={_setSelectedRows}
        showColumnToggle
        emptyMessage="No warranties found. Create one to get started!"
        initialColumnVisibility={visibility}
        onColumnVisibilityChange={onVisibilityChange}
      />

      {/* Delete Confirmation Dialog */}
      <deleteDialog.DialogComponent />
    </>
  );
}
