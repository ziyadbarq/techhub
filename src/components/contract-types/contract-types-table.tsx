/**
 * Contract Types Table Component
 */

"use client";

import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";

import { DataTable, DataTableColumnHeader } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";

import type { ContractTypeDTO } from "@/interface-adapters/presenters/contract-type.presenter";
import { deleteContractType } from "@/interface-adapters/controllers/contract-type.controller";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { useDeleteDialog } from "@/hooks/use-delete-dialog";
import { buildSelectColumn, buildActionsColumn } from "@/lib/table-utils";

interface ContractTypesTableProps {
  data: ContractTypeDTO[];
  loading?: boolean;
  onEdit: (contractType: ContractTypeDTO) => void;
  onRefresh: () => void;
}

export function ContractTypesTable({
  data,
  loading = false,
  onEdit,
  onRefresh,
}: ContractTypesTableProps) {
  // Use reusable hooks
  const deleteDialog = useDeleteDialog<ContractTypeDTO>({
    onDelete: (contractType) => deleteContractType(contractType.id),
    onSuccess: onRefresh,
    getItemName: (contractType) => contractType.name,
    entityName: "Contract Type",
  });

  const baseColumns = React.useMemo<ColumnDef<ContractTypeDTO>[]>(
    () => [
      buildSelectColumn<ContractTypeDTO>(),
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
        accessorKey: "isActive",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Status" />
        ),
        cell: ({ row }) => {
          const isActive = row.getValue("isActive") as boolean;
          return (
            <Badge variant={isActive ? "default" : "secondary"}>
              {isActive ? "Active" : "Inactive"}
            </Badge>
          );
        },
        meta: {
          label: "Status",
        },
      },
      {
        accessorKey: "createdAt",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Created" />
        ),
        cell: ({ row }) => {
          const date = new Date(row.getValue("createdAt"));
          return (
            <span className="text-muted-foreground text-sm">
              {format(date, "MMM d, yyyy")}
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
      buildActionsColumn<ContractTypeDTO>([
        {
          type: "edit",
          label: "Edit",
          permission: PERMISSIONS.CONTRACT_TYPES_UPDATE,
          onClick: onEdit,
        },
        {
          type: "delete",
          label: "Delete",
          permission: PERMISSIONS.CONTRACT_TYPES_DELETE,
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
