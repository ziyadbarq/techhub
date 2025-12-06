/**
 * Contracts Table Component
 */

"use client";
"use no memo";

import * as React from "react";
import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";

import { DataTable, DataTableColumnHeader } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { EntityDisplay } from "@/components/ui/entity-display";
import { Building2 } from "lucide-react";

import type { ContractDTO } from "@/interface-adapters/presenters/contract.presenter";
import { deleteContract } from "@/interface-adapters/controllers/contract.controller";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { useDeleteDialog } from "@/hooks/use-delete-dialog";
import { useColumnVisibilityEnhanced } from "@/hooks";
import { buildSelectColumn, buildActionsColumn } from "@/lib/table-utils";

interface ContractsTableProps {
  data: ContractDTO[];
  loading?: boolean;
  onEdit: (contract: ContractDTO) => void;
  onRefresh: () => void;
}

export function ContractsTable({
  data,
  loading = false,
  onEdit,
  onRefresh,
}: ContractsTableProps) {
  // Use reusable hooks
  const deleteDialog = useDeleteDialog<ContractDTO>({
    onDelete: (contract) => deleteContract(contract.id),
    onSuccess: onRefresh,
    getItemName: (contract) => contract.name,
    entityName: "Contract",
  });

  const baseColumns = React.useMemo<ColumnDef<ContractDTO>[]>(
    () => [
      buildSelectColumn<ContractDTO>(),
      {
        accessorKey: "name",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Contract Name" />
        ),
        cell: ({ row }) => {
          const contract = row.original;
          const name = row.getValue("name") as string;
          const contractNumber = contract.contractNumber;
          return (
            <div className="flex flex-col gap-1">
              <Link
                href={`/contracts/${contract.id}`}
                className="text-primary font-medium hover:underline"
              >
                {name}
              </Link>
              {contractNumber && (
                <span className="text-muted-foreground text-xs">
                  {contractNumber}
                </span>
              )}
            </div>
          );
        },
        meta: {
          label: "Contract Name",
        },
      },
      {
        accessorKey: "vendorId",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Vendor" />
        ),
        cell: ({ row }) => (
          <EntityDisplay name={row.original.vendorName} icon={Building2} />
        ),
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
          const date = row.getValue("startDate") as string;
          return (
            <span className="text-sm">
              {format(new Date(date), "MMM d, yyyy")}
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
          const date = row.getValue("endDate") as string | null;
          if (!date) return <span className="text-muted-foreground">—</span>;
          return (
            <span className="text-sm">
              {format(new Date(date), "MMM d, yyyy")}
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
          const contract = row.original;
          const isActive = contract.isActive ?? true;
          const isExpired = contract.isExpired ?? false;
          const autoRenew = contract.autoRenew;

          if (isExpired) {
            return <Badge variant="destructive">Expired</Badge>;
          }
          if (isActive) {
            return (
              <div className="flex gap-1">
                <Badge variant="default">Active</Badge>
                {autoRenew && (
                  <Badge variant="secondary" className="text-xs">
                    Auto-Renew
                  </Badge>
                )}
              </div>
            );
          }
          return <Badge variant="secondary">Inactive</Badge>;
        },
        meta: {
          label: "Status",
        },
      },
      {
        accessorKey: "totalValue",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Value" />
        ),
        cell: ({ row }) => {
          const value = row.getValue("totalValue") as number | null;
          const currency = row.original.currency || "SAR";
          if (!value) return <span className="text-muted-foreground">—</span>;
          return (
            <span className="text-sm font-medium">
              {value.toLocaleString()} {currency}
            </span>
          );
        },
        meta: {
          label: "Value",
          hiddenByDefault: true,
        },
      },
    ],
    [],
  );

  // Actions column using reusable builder
  const actionsColumn = React.useMemo(
    () =>
      buildActionsColumn<ContractDTO>([
        {
          type: "edit",
          label: "Edit",
          permission: PERMISSIONS.CONTRACTS_UPDATE,
          onClick: onEdit,
        },
        {
          type: "delete",
          label: "Delete",
          permission: PERMISSIONS.CONTRACTS_DELETE,
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
    useColumnVisibilityEnhanced<ContractDTO>({
      storageKey: "contracts-table-columns",
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
