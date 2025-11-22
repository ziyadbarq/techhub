"use client";
"use no memo";

import * as React from "react";
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { ArrowUpDown, Download, Trash2, FileIcon, Image } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import type { AttachmentDTO } from "@/interface-adapters/presenters/attachment.presenter";
import { deleteAttachment } from "@/interface-adapters/controllers/attachment.controller";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { usePermissions } from "@/hooks/use-permissions";
import { useToast } from "@/hooks/use-toast";

interface AttachmentsTableProps {
  data: AttachmentDTO[];
  loading?: boolean;
  onDownload?: (attachment: AttachmentDTO) => void;
  onRefresh?: () => void;
}

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

export function AttachmentsTable({
  data,
  loading = false,
  onDownload,
  onRefresh,
}: AttachmentsTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [selectedAttachment, setSelectedAttachment] =
    React.useState<AttachmentDTO | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);

  const { hasPermission } = usePermissions();
  const canDelete = hasPermission(PERMISSIONS.ATTACHMENTS_DELETE);
  const { toast } = useToast();

  const handleDelete = async () => {
    if (!selectedAttachment) return;

    setIsDeleting(true);
    try {
      const result = await deleteAttachment(selectedAttachment.id);
      if (result.success) {
        toast({
          title: "Success",
          description: "Attachment deleted successfully",
        });
        onRefresh?.();
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.error || "Failed to delete attachment",
        });
      }
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setSelectedAttachment(null);
    }
  };

  const columns: ColumnDef<AttachmentDTO>[] = [
    {
      accessorKey: "fileName",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            File Name
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const attachment = row.original;
        return (
          <div className="flex items-center gap-2">
            {getFileIcon(attachment.mimeType)}
            <span className="font-medium">{attachment.fileName}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "attachmentType",
      header: "Type",
      cell: ({ row }) => {
        const typeName = row.original.attachmentType?.name;
        return typeName ? (
          <Badge variant="outline">{typeName}</Badge>
        ) : (
          <span className="text-muted-foreground">-</span>
        );
      },
    },
    {
      accessorKey: "targetType",
      header: "Entity Type",
      cell: ({ row }) => {
        return (
          <Badge variant="secondary">{row.original.targetType}</Badge>
        );
      },
    },
    {
      accessorKey: "sizeBytes",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Size
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        return (
          <span className="text-sm">
            {formatFileSize(Number(row.original.sizeBytes))}
          </span>
        );
      },
    },
    {
      accessorKey: "uploadedAt",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Uploaded
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        return new Date(row.original.uploadedAt).toLocaleDateString();
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const attachment = row.original;

        return (
          <div className="flex items-center gap-2">
            {onDownload && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDownload(attachment)}
              >
                <Download className="h-4 w-4" />
              </Button>
            )}
            {canDelete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedAttachment(attachment);
                  setDeleteDialogOpen(true);
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    state: {
      sorting,
    },
  });

  if (loading) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Loading attachments...
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No attachments found
      </div>
    );
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Attachment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedAttachment?.fileName}"?
              This action cannot be undone and will permanently delete the file.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
