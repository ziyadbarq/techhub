/**
 * Lifecycle Transitions Table Component
 */

"use client";

import * as React from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { ArrowRight } from "lucide-react";

import { DataTable, DataTableColumnHeader } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";

import type { LifecycleTransitionDTO } from "@/interface-adapters/presenters/lifecycle-transition.presenter";
import { deleteLifecycleTransitionAction } from "@/interface-adapters/controllers/lifecycle-transition.controller";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { useDeleteDialog } from "@/hooks/use-delete-dialog";
import { buildSelectColumn, buildActionsColumn } from "@/lib/table-utils";

interface LifecycleTransitionsTableProps {
  data: LifecycleTransitionDTO[];
  loading?: boolean;
  onEdit: (transition: LifecycleTransitionDTO) => void;
  onRefresh: () => void;
}

export function LifecycleTransitionsTable({
  data,
  loading = false,
  onEdit,
  onRefresh,
}: LifecycleTransitionsTableProps) {
  // Use reusable delete dialog hook
  const deleteDialog = useDeleteDialog<LifecycleTransitionDTO>({
    onDelete: (transition) => deleteLifecycleTransitionAction(transition.id),
    onSuccess: onRefresh,
    getItemName: (transition) => transition.name,
    entityName: "Lifecycle Transition",
  });

  const [_selectedRows, _setSelectedRows] = React.useState<
    LifecycleTransitionDTO[]
  >([]);

  const baseColumns = React.useMemo<ColumnDef<LifecycleTransitionDTO>[]>(
    () => [
      buildSelectColumn<LifecycleTransitionDTO>(),
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
        id: "flow",
        header: "Flow",
        cell: ({ row }) => (
          <div className="flex items-center gap-2 text-sm">
            <Badge variant="outline">
              {row.original.fromStateName || "Unknown"}
            </Badge>
            <ArrowRight className="text-muted-foreground h-4 w-4" />
            <Badge variant="outline">
              {row.original.toStateName || "Unknown"}
            </Badge>
          </div>
        ),
        meta: {
          label: "Flow",
        },
      },
      {
        accessorKey: "requiresApproval",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Approval" />
        ),
        cell: ({ row }) => {
          const requiresApproval = row.getValue("requiresApproval") as boolean;
          return requiresApproval ? (
            <Badge variant="secondary">Required</Badge>
          ) : (
            <span className="text-muted-foreground text-sm">None</span>
          );
        },
        meta: {
          label: "Approval",
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
    ],
    [],
  );

  // Actions column using reusable builder
  const actionsColumn = React.useMemo(
    () =>
      buildActionsColumn<LifecycleTransitionDTO>([
        {
          type: "edit",
          label: "Edit",
          permission: PERMISSIONS.LIFECYCLE_TRANSITIONS_UPDATE,
          onClick: onEdit,
        },
        {
          type: "delete",
          label: "Delete",
          permission: PERMISSIONS.LIFECYCLE_TRANSITIONS_DELETE,
          variant: "destructive",
          separator: true,
          onClick: deleteDialog.openDialog,
        },
      ]),
    [onEdit, deleteDialog.openDialog],
  );

  // Merge static columns + actions column
  const columns = React.useMemo(() => {
    return [...baseColumns, actionsColumn];
  }, [baseColumns, actionsColumn]);

  return (
    <>
      <DataTable
        columns={columns}
        data={data}
        loading={loading}
        searchable
        searchKey="name"
        searchPlaceholder="Search transitions..."
        selectable
        onSelectionChange={_setSelectedRows}
        showColumnToggle
        emptyMessage="No transitions found. Create one to get started!"
        pagination={{
          pageSize: 10,
        }}
      />

      {/* Delete Confirmation Dialog */}
      <deleteDialog.DialogComponent />
    </>
  );
}
