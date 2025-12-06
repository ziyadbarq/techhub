/**
 * Business Processes Table Component
 */

"use client";
"use no memo";

import * as React from "react";
import { useRouter } from "next/navigation";
import { type ColumnDef } from "@tanstack/react-table";

import { DataTable, DataTableColumnHeader } from "@/components/ui/data-table";

import type { BusinessProcessDTO } from "@/interface-adapters/presenters/service.presenter";
import { deleteBusinessProcessAction } from "@/interface-adapters/controllers/business-process.controller";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { useDeleteDialog } from "@/hooks/use-delete-dialog";
import { useColumnVisibilityEnhanced } from "@/hooks";
import { buildActionsColumn } from "@/lib/table-utils";

interface BusinessProcessesTableProps {
  data: BusinessProcessDTO[];
  loading?: boolean;
  onEdit?: (process: BusinessProcessDTO) => void;
  onRefresh?: () => void;
}

export function BusinessProcessesTable({
  data,
  loading = false,
  onEdit,
  onRefresh,
}: BusinessProcessesTableProps) {
  const router = useRouter();

  // Use reusable delete dialog hook
  const deleteDialog = useDeleteDialog<BusinessProcessDTO>({
    onDelete: (process) => deleteBusinessProcessAction(process.id),
    onSuccess: () => {
      if (onRefresh) {
        onRefresh();
      } else {
        router.refresh();
      }
    },
    getItemName: (process) => process.code,
    entityName: "Business Process",
  });

  // Base columns (static)
  const baseColumns = React.useMemo<ColumnDef<BusinessProcessDTO>[]>(
    () => [
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
          return <span className="text-sm">{name}</span>;
        },
        meta: {
          label: "Name",
        },
      },
      {
        accessorKey: "category",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Category" />
        ),
        cell: ({ row }) => {
          const category = row.getValue("category") as string | null;
          return (
            <span className="text-sm">
              {category || <span className="text-muted-foreground">—</span>}
            </span>
          );
        },
        meta: {
          label: "Category",
        },
        filterFn: (row, id, value: string[]) => {
          return value.includes(row.getValue(id));
        },
      },
      {
        accessorKey: "description",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Description" />
        ),
        cell: ({ row }) => {
          const description = row.getValue("description") as string | null;
          if (!description) {
            return <span className="text-muted-foreground text-sm">—</span>;
          }
          return <span className="line-clamp-2 text-sm">{description}</span>;
        },
        meta: {
          label: "Description",
          hiddenByDefault: true,
        },
      },
    ],
    [],
  );

  // Actions column using reusable builder
  const actionsColumn = React.useMemo(
    () =>
      buildActionsColumn<BusinessProcessDTO>([
        {
          type: "view",
          label: "View Details",
          permission: PERMISSIONS.BUSINESS_PROCESSES_VIEW,
          onClick: (process) =>
            router.push(`/business-processes/${process.id}`),
        },
        ...(onEdit
          ? [
              {
                type: "edit" as const,
                label: "Edit",
                permission: PERMISSIONS.BUSINESS_PROCESSES_MANAGE,
                onClick: onEdit,
              },
            ]
          : []),
        {
          type: "delete",
          label: "Delete",
          permission: PERMISSIONS.BUSINESS_PROCESSES_MANAGE,
          variant: "destructive",
          separator: true,
          onClick: deleteDialog.openDialog,
        },
      ]),
    [onEdit, deleteDialog.openDialog, router],
  );

  // Merge columns with actions
  const allColumns = React.useMemo(() => {
    return [...baseColumns, actionsColumn];
  }, [baseColumns, actionsColumn]);

  // Column visibility with persistence
  const { visibility, onVisibilityChange } =
    useColumnVisibilityEnhanced<BusinessProcessDTO>({
      storageKey: "business-processes-table-columns",
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
