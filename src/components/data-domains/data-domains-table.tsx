"use client";
"use no memo";

import * as React from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";

import { DataTable, DataTableColumnHeader } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";

import type { DataDomainDTO } from "@/interface-adapters/presenters/data-domain.presenter";
import { deleteDataDomain } from "@/interface-adapters/controllers/data-domain.controller";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { useDeleteDialog } from "@/hooks/use-delete-dialog";
import { buildSelectColumn, buildActionsColumn } from "@/lib/table-utils";

interface DataDomainsTableProps {
  data: DataDomainDTO[];
  loading?: boolean;
  onEdit: (dataDomain: DataDomainDTO) => void;
  onRefresh: () => void;
}

export function DataDomainsTable({
  data,
  loading = false,
  onEdit,
  onRefresh,
}: DataDomainsTableProps) {
  // Use reusable hooks
  const deleteDialog = useDeleteDialog<DataDomainDTO>({
    onDelete: (dataDomain) => deleteDataDomain(dataDomain.id),
    onSuccess: onRefresh,
    getItemName: (dataDomain) => dataDomain.name,
    entityName: "Data Domain",
  });

  const baseColumns = React.useMemo<ColumnDef<DataDomainDTO>[]>(
    () => [
      buildSelectColumn<DataDomainDTO>(),
      {
        accessorKey: "code",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Code" />
        ),
        cell: ({ row }) => {
          const code = row.getValue("code") as string;
          return <span className="font-mono text-sm font-medium">{code}</span>;
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
          const date = row.getValue("createdAt") as Date;
          return (
            <span className="text-muted-foreground text-sm">
              {format(new Date(date), "MMM d, yyyy")}
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
      buildActionsColumn<DataDomainDTO>([
        {
          type: "edit",
          label: "Edit",
          permission: PERMISSIONS.DATA_DOMAINS_UPDATE,
          onClick: onEdit,
        },
        {
          type: "delete",
          label: "Delete",
          permission: PERMISSIONS.DATA_DOMAINS_DELETE,
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
