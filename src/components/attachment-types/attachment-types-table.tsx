"use client";
"use no memo";

import * as React from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";

import { DataTable, DataTableColumnHeader } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";

import type { AttachmentTypeDTO } from "@/interface-adapters/presenters/attachment-type.presenter";
import { deleteAttachmentType } from "@/interface-adapters/controllers/attachment-type.controller";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { useDeleteDialog } from "@/hooks/use-delete-dialog";
import { useColumnVisibilityEnhanced } from "@/hooks";
import { buildSelectColumn, buildActionsColumn } from "@/lib/table-utils";

interface AttachmentTypesTableProps {
  data: AttachmentTypeDTO[];
  loading?: boolean;
  onEdit: (attachmentType: AttachmentTypeDTO) => void;
  onRefresh: () => void;
}

export function AttachmentTypesTable({
  data,
  loading = false,
  onEdit,
  onRefresh,
}: AttachmentTypesTableProps) {
  // Use reusable delete dialog hook
  const deleteDialog = useDeleteDialog<AttachmentTypeDTO>({
    onDelete: (attachmentType) => deleteAttachmentType(attachmentType.id),
    onSuccess: onRefresh,
    getItemName: (attachmentType) => attachmentType.name,
    entityName: "Attachment Type",
  });

  const baseColumns = React.useMemo<ColumnDef<AttachmentTypeDTO>[]>(
    () => [
      buildSelectColumn<AttachmentTypeDTO>(),
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
        accessorKey: "allowedExtensions",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Allowed Extensions" />
        ),
        cell: ({ row }) => {
          const extensions = row.getValue("allowedExtensions") as string[];
          if (!extensions || extensions.length === 0) {
            return (
              <span className="text-muted-foreground text-sm">All files</span>
            );
          }
          return (
            <div className="flex flex-wrap gap-1">
              {extensions.slice(0, 3).map((ext) => (
                <Badge key={ext} variant="secondary" className="text-xs">
                  .{ext}
                </Badge>
              ))}
              {extensions.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{extensions.length - 3}
                </Badge>
              )}
            </div>
          );
        },
        meta: {
          label: "Allowed Extensions",
          hiddenByDefault: true,
        },
        enableSorting: false,
      },
      {
        accessorKey: "maxFileSizeMB",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Max Size (MB)" />
        ),
        cell: ({ row }) => {
          const maxSize = row.getValue("maxFileSizeMB") as number;
          return <span className="text-sm">{maxSize} MB</span>;
        },
        meta: {
          label: "Max Size (MB)",
          hiddenByDefault: true,
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
          hiddenByDefault: true,
        },
      },
    ],
    [],
  );

  // Actions column using reusable builder
  const actionsColumn = React.useMemo(
    () =>
      buildActionsColumn<AttachmentTypeDTO>([
        {
          type: "edit",
          label: "Edit",
          permission: PERMISSIONS.ATTACHMENT_TYPES_UPDATE,
          onClick: onEdit,
        },
        {
          type: "delete",
          label: "Delete",
          permission: PERMISSIONS.ATTACHMENT_TYPES_DELETE,
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

  // Use enhanced column visibility hook with localStorage persistence
  const { visibility, onVisibilityChange } =
    useColumnVisibilityEnhanced<AttachmentTypeDTO>({
      storageKey: "attachment-types-table-columns",
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
