/**
 * Organization Units Table Component
 */

"use client";

import * as React from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";

import { DataTable, DataTableColumnHeader } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";

import type { OrganizationUnitDTO } from "@/interface-adapters/presenters/organization-unit.presenter";
import { deleteOrganizationUnitAction } from "@/interface-adapters/controllers/organization-unit.controller";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { useDeleteDialog } from "@/hooks/use-delete-dialog";
import { buildSelectColumn, buildActionsColumn } from "@/lib/table-utils";

interface OrganizationUnitsTableProps {
  data: OrganizationUnitDTO[];
  loading?: boolean;
  onEdit: (unit: OrganizationUnitDTO) => void;
  onRefresh: () => void;
}

export function OrganizationUnitsTable({
  data,
  loading = false,
  onEdit,
  onRefresh,
}: OrganizationUnitsTableProps) {
  // Use reusable hooks
  const deleteDialog = useDeleteDialog<OrganizationUnitDTO>({
    onDelete: (unit) => deleteOrganizationUnitAction(unit.id),
    onSuccess: onRefresh,
    getItemName: (unit) => unit.name,
    entityName: "Organization Unit",
  });

  const baseColumns = React.useMemo<ColumnDef<OrganizationUnitDTO>[]>(
    () => [
      buildSelectColumn<OrganizationUnitDTO>(),
      {
        accessorKey: "name",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Name" />
        ),
        cell: ({ row }) => (
          <div className="flex flex-col gap-1">
            <span className="font-medium">{row.getValue("name")}</span>
            <span className="text-muted-foreground text-xs">
              {row.original.code}
            </span>
          </div>
        ),
        meta: {
          label: "Name",
        },
      },
      {
        accessorKey: "unitType",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Type" />
        ),
        cell: ({ row }) => (
          <Badge variant="outline">{row.getValue("unitType")}</Badge>
        ),
        meta: {
          label: "Type",
        },
      },
      {
        accessorKey: "costCenter",
        header: "Cost Center",
        cell: ({ row }) => {
          const costCenter = row.getValue("costCenter") as string | null;
          return costCenter ? (
            <span className="text-sm">{costCenter}</span>
          ) : (
            <span className="text-muted-foreground text-sm">—</span>
          );
        },
        meta: {
          label: "Cost Center",
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
            <Badge
              variant={isActive ? "default" : "secondary"}
              className={isActive ? "bg-success text-white" : ""}
            >
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
      buildActionsColumn<OrganizationUnitDTO>([
        {
          type: "edit",
          label: "Edit",
          permission: PERMISSIONS.ORGANIZATION_UNITS_UPDATE,
          onClick: onEdit,
        },
        {
          type: "delete",
          label: "Delete",
          permission: PERMISSIONS.ORGANIZATION_UNITS_DELETE,
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
