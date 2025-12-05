/**
 * Field Definitions Table Component
 */

"use client";
"use no memo";

import * as React from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { FileCode } from "lucide-react";
import { format } from "date-fns";

import { DataTable, DataTableColumnHeader } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";

import type { FieldDefinitionDTO } from "@/interface-adapters/presenters/field-definition.presenter";
import { deleteFieldDefinitionAction } from "@/interface-adapters/controllers/field-definition.controller";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { useDeleteDialog } from "@/hooks/use-delete-dialog";
import { buildSelectColumn, buildActionsColumn } from "@/lib/table-utils";
import { FieldDataTypeEnum } from "@/core/domain/value-objects/foundation-enums";

interface FieldDefinitionsTableProps {
  data: FieldDefinitionDTO[];
  loading?: boolean;
  onEdit: (field: FieldDefinitionDTO) => void;
  onRefresh: () => void;
}

const fieldTypeColors: Partial<Record<FieldDataTypeEnum, string>> = {
  [FieldDataTypeEnum.STRING]:
    "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  [FieldDataTypeEnum.TEXT]:
    "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  [FieldDataTypeEnum.INTEGER]:
    "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  [FieldDataTypeEnum.DECIMAL]:
    "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  [FieldDataTypeEnum.BOOLEAN]:
    "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200",
  [FieldDataTypeEnum.DATE]:
    "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
  [FieldDataTypeEnum.DATETIME]:
    "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200",
  [FieldDataTypeEnum.JSON]:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
};

export function FieldDefinitionsTable({
  data,
  loading = false,
  onEdit,
  onRefresh,
}: FieldDefinitionsTableProps) {
  // Use reusable hooks
  const deleteDialog = useDeleteDialog<FieldDefinitionDTO>({
    onDelete: (field) => deleteFieldDefinitionAction(field.id),
    onSuccess: onRefresh,
    getItemName: (field) => field.label,
    entityName: "Field Definition",
  });

  const baseColumns = React.useMemo<ColumnDef<FieldDefinitionDTO>[]>(
    () => [
      buildSelectColumn<FieldDefinitionDTO>(),
      {
        accessorKey: "label",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Field" />
        ),
        cell: ({ row }) => (
          <div className="flex items-start gap-2">
            <FileCode className="text-muted-foreground mt-0.5 h-4 w-4" />
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium">{row.original.label}</span>
              <span className="text-muted-foreground font-mono text-xs">
                {row.original.name}
              </span>
            </div>
          </div>
        ),
        meta: {
          label: "Field",
        },
      },
      {
        accessorKey: "dataType",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Type" />
        ),
        cell: ({ row }) => {
          const fieldType = row.getValue("dataType") as FieldDataTypeEnum;
          return (
            <Badge
              variant="outline"
              className={
                fieldTypeColors[fieldType] ?? "bg-muted text-foreground"
              }
            >
              {fieldType}
            </Badge>
          );
        },
        meta: {
          label: "Type",
        },
      },
      {
        accessorKey: "entityType",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Entity" />
        ),
        cell: ({ row }) => (
          <Badge variant="secondary">
            {row.getValue("entityType") as string}
          </Badge>
        ),
        meta: {
          label: "Entity",
        },
      },
      {
        id: "constraints",
        header: "Constraints",
        cell: ({ row }) => {
          const isRequired = row.original.isRequired;
          const isUnique = row.original.isUnique;

          if (!isRequired && !isUnique)
            return <span className="text-muted-foreground">—</span>;

          return (
            <div className="flex gap-1">
              {isRequired && (
                <Badge variant="outline" className="text-xs">
                  Required
                </Badge>
              )}
              {isUnique && (
                <Badge variant="outline" className="text-xs">
                  Unique
                </Badge>
              )}
            </div>
          );
        },
        meta: {
          label: "Constraints",
        },
      },
      {
        accessorKey: "displayOrder",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Order" />
        ),
        cell: ({ row }) => (
          <span className="text-muted-foreground">
            {row.getValue("displayOrder") as number}
          </span>
        ),
        meta: {
          label: "Order",
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
      buildActionsColumn<FieldDefinitionDTO>([
        {
          type: "edit",
          label: "Edit",
          permission: PERMISSIONS.FIELD_DEFINITIONS_UPDATE,
          onClick: onEdit,
        },
        {
          type: "delete",
          label: "Delete",
          permission: PERMISSIONS.FIELD_DEFINITIONS_DELETE,
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
