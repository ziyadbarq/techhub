"use client";
"use no memo";

import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Download, FileIcon, Image } from "lucide-react";

import { DataTable, DataTableColumnHeader } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";

import type { AttachmentDTO } from "@/interface-adapters/presenters/attachment.presenter";
import { deleteAttachment } from "@/interface-adapters/controllers/attachment.controller";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { useDeleteDialog } from "@/hooks/use-delete-dialog";
import { buildSelectColumn, buildActionsColumn } from "@/lib/table-utils";
import { formatDate } from "@/lib/utils/date-format";

// Helper function to format file size
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024)
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

// Helper function to get file icon
function getFileIcon(mimeType: string | null) {
  if (!mimeType) return <FileIcon className="h-4 w-4" />;
  if (mimeType.startsWith("image/"))
    return <Image className="h-4 w-4 text-blue-500" />;
  return <FileIcon className="h-4 w-4" />;
}

interface AttachmentsTableProps {
  data: AttachmentDTO[];
  loading?: boolean;
  onDownload?: (attachment: AttachmentDTO) => void;
  onRefresh?: () => void;
}

export function AttachmentsTable({
  data,
  loading = false,
  onDownload,
  onRefresh,
}: AttachmentsTableProps) {
  // Use reusable delete dialog hook
  const deleteDialog = useDeleteDialog<AttachmentDTO>({
    onDelete: (attachment) => deleteAttachment(attachment.id),
    onSuccess: onRefresh || (() => {}),
    getItemName: (attachment) => attachment.fileName,
    entityName: "Attachment",
  });

  const baseColumns = React.useMemo<ColumnDef<AttachmentDTO>[]>(
    () => [
      buildSelectColumn<AttachmentDTO>(),
      {
        accessorKey: "fileName",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="File Name" />
        ),
        cell: ({ row }) => {
          const attachment = row.original;
          return (
            <div className="flex items-center gap-2">
              {getFileIcon(attachment.mimeType)}
              <span className="font-medium">{attachment.fileName}</span>
            </div>
          );
        },
        meta: {
          label: "File Name",
        },
      },
      {
        accessorKey: "attachmentType",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Type" />
        ),
        cell: ({ row }) => {
          const typeId = row.original.attachmentTypeId;
          return typeId ? (
            <Badge variant="outline">{typeId}</Badge>
          ) : (
            <span className="text-muted-foreground">-</span>
          );
        },
        meta: {
          label: "Type",
        },
      },
      {
        accessorKey: "targetType",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Entity Type" />
        ),
        cell: ({ row }) => (
          <Badge variant="secondary">{row.original.targetType}</Badge>
        ),
        meta: {
          label: "Entity Type",
        },
      },
      {
        accessorKey: "sizeBytes",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Size" />
        ),
        cell: ({ row }) => (
          <span className="text-sm">
            {formatFileSize(Number(row.original.sizeBytes))}
          </span>
        ),
        meta: {
          label: "Size",
        },
      },
      {
        accessorKey: "uploadedAt",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Uploaded" />
        ),
        cell: ({ row }) => formatDate(row.original.uploadedAt),
        meta: {
          label: "Uploaded",
        },
      },
    ],
    [],
  );

  // Actions column with download and delete
  const actionsColumn = React.useMemo(
    () =>
      buildActionsColumn<AttachmentDTO>([
        {
          type: "custom",
          label: "Download",
          icon: Download,
          onClick: (attachment) => {
            if (onDownload) {
              onDownload(attachment);
            }
          },
          hidden: () => !onDownload,
        },
        {
          type: "delete",
          label: "Delete",
          permission: PERMISSIONS.ATTACHMENTS_DELETE,
          variant: "destructive",
          separator: true,
          onClick: deleteDialog.openDialog,
        },
      ]),
    [onDownload, deleteDialog.openDialog],
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
        emptyMessage="No attachments found"
      />

      {/* Delete Confirmation Dialog */}
      <deleteDialog.DialogComponent />
    </>
  );
}
