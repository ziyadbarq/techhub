/**
 * Lifecycle States Table Component
 */

"use client";

import * as React from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";

import { DataTable, DataTableColumnHeader } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";

import type { LifecycleStateDTO } from "@/interface-adapters/presenters/lifecycle-state.presenter";
import { deleteLifecycleStateAction } from "@/interface-adapters/controllers/lifecycle-state.controller";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { useDeleteDialog } from "@/hooks/use-delete-dialog";
import { buildSelectColumn, buildActionsColumn } from "@/lib/table-utils";

interface LifecycleStatesTableProps {
  data: LifecycleStateDTO[];
  loading?: boolean;
  onEdit: (state: LifecycleStateDTO) => void;
  onRefresh: () => void;
}

export function LifecycleStatesTable({
  data,
  loading = false,
  onEdit,
  onRefresh,
}: LifecycleStatesTableProps) {
  // Use reusable hooks
  const deleteDialog = useDeleteDialog<LifecycleStateDTO>({
    onDelete: (state) => deleteLifecycleStateAction(state.id),
    onSuccess: onRefresh,
    getItemName: (state) => state.name,
    entityName: "Lifecycle State",
  });

  const baseColumns = React.useMemo<ColumnDef<LifecycleStateDTO>[]>(
    () => [
      buildSelectColumn<LifecycleStateDTO>(),
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
              {row.original.description && (
                <span className="text-muted-foreground line-clamp-1 text-xs">
                  {row.original.description}
                </span>
              )}
            </div>
          );
        },
        meta: {
          label: "Name",
        },
      },
      {
        accessorKey: "stateType",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Type" />
        ),
        cell: ({ row }) => {
          const stateType = row.getValue("stateType") as string;
          return <Badge variant="outline">{stateType}</Badge>;
        },
        meta: {
          label: "Type",
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
      buildActionsColumn<LifecycleStateDTO>([
        {
          type: "edit",
          label: "Edit",
          permission: PERMISSIONS.LIFECYCLE_STATES_UPDATE,
          onClick: onEdit,
        },
        {
          type: "delete",
          label: "Delete",
          permission: PERMISSIONS.LIFECYCLE_STATES_DELETE,
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
        searchable
        searchKey="name"
        searchPlaceholder="Search lifecycle states..."
        selectable
        showColumnToggle
        emptyMessage="No lifecycle states found. Create one to get started!"
        pagination={{
          pageSize: 10,
        }}
      />

      {/* Delete Confirmation Dialog */}
      <deleteDialog.DialogComponent />
    </>
  );
}
