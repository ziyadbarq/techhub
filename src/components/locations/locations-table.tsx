/**
 * Locations Table Component
 */

"use client";

import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { MapPin } from "lucide-react";
import { format } from "date-fns";

import { DataTable, DataTableColumnHeader } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";

import type { LocationDTO } from "@/interface-adapters/presenters/location.presenter";
import { deleteLocationAction } from "@/interface-adapters/controllers/location.controller";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { useDeleteDialog } from "@/hooks/use-delete-dialog";
import { buildSelectColumn, buildActionsColumn } from "@/lib/table-utils";

interface LocationsTableProps {
  data: LocationDTO[];
  loading?: boolean;
  onEdit: (location: LocationDTO) => void;
  onRefresh: () => void;
}

export function LocationsTable({
  data,
  loading = false,
  onEdit,
  onRefresh,
}: LocationsTableProps) {
  // Use reusable hooks
  const deleteDialog = useDeleteDialog<LocationDTO>({
    onDelete: (location) => deleteLocationAction(location.id),
    onSuccess: onRefresh,
    getItemName: (location) => location.name,
    entityName: "Location",
  });

  const baseColumns = React.useMemo<ColumnDef<LocationDTO>[]>(
    () => [
      buildSelectColumn<LocationDTO>(),
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
        accessorKey: "locationType",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Type" />
        ),
        cell: ({ row }) => (
          <Badge variant="outline">{row.getValue("locationType")}</Badge>
        ),
        meta: {
          label: "Type",
        },
      },
      {
        id: "address",
        header: "Address",
        cell: ({ row }) => {
          const { address, city, state, country } = row.original;
          const parts = [address, city, state, country].filter(Boolean);
          return parts.length > 0 ? (
            <div className="flex items-start gap-2">
              <MapPin className="text-muted-foreground mt-0.5 h-4 w-4" />
              <span className="text-sm">{parts.join(", ")}</span>
            </div>
          ) : null;
        },
        meta: {
          label: "Address",
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
      buildActionsColumn<LocationDTO>([
        {
          type: "edit",
          label: "Edit",
          permission: PERMISSIONS.LOCATIONS_UPDATE,
          onClick: onEdit,
        },
        {
          type: "delete",
          label: "Delete",
          permission: PERMISSIONS.LOCATIONS_DELETE,
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
