/**
 * Lifecycle Models Table Component
 */

"use client";
"use no memo";

import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";

import { DataTable, DataTableColumnHeader } from "@/components/ui/data-table";

import type { LifecycleModelDTO } from "@/interface-adapters/presenters/lifecycle-model.presenter";
import { deleteLifecycleModelAction } from "@/interface-adapters/controllers/lifecycle-model.controller";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { useDeleteDialog } from "@/hooks/use-delete-dialog";
import { useColumnVisibilityEnhanced } from "@/hooks";
import { buildSelectColumn, buildActionsColumn } from "@/lib/table-utils";

interface LifecycleModelsTableProps {
  data: LifecycleModelDTO[];
  loading?: boolean;
  onEdit: (model: LifecycleModelDTO) => void;
  onRefresh: () => void;
}

export function LifecycleModelsTable({
  data,
  loading = false,
  onEdit,
  onRefresh,
}: LifecycleModelsTableProps) {
  // Use reusable hooks
  const deleteDialog = useDeleteDialog<LifecycleModelDTO>({
    onDelete: (model) => deleteLifecycleModelAction(model.id),
    onSuccess: onRefresh,
    getItemName: (model) => model.name,
    entityName: "Lifecycle Model",
  });

  const baseColumns = React.useMemo<ColumnDef<LifecycleModelDTO>[]>(
    () => [
      buildSelectColumn<LifecycleModelDTO>(),
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
          hiddenByDefault: true,
        },
      },
      {
        accessorKey: "updatedAt",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Updated" />
        ),
        cell: ({ row }) => {
          const date = new Date(row.getValue("updatedAt"));
          return (
            <span className="text-muted-foreground text-sm">
              {format(date, "MMM d, yyyy")}
            </span>
          );
        },
        meta: {
          label: "Updated",
          hiddenByDefault: true,
        },
      },
    ],
    [],
  );

  // Actions column using reusable builder
  const actionsColumn = React.useMemo(
    () =>
      buildActionsColumn<LifecycleModelDTO>([
        {
          type: "edit",
          label: "Edit",
          permission: PERMISSIONS.LIFECYCLE_MODELS_UPDATE,
          onClick: onEdit,
        },
        {
          type: "delete",
          label: "Delete",
          permission: PERMISSIONS.LIFECYCLE_MODELS_DELETE,
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
    useColumnVisibilityEnhanced<LifecycleModelDTO>({
      storageKey: "lifecycle-models-table-columns",
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
