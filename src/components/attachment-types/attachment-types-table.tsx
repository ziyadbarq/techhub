"use client";
"use no memo";

import * as React from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, Trash2, Pencil } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

import { DataTable, DataTableColumnHeader } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

import type { AttachmentTypeDTO } from "@/interface-adapters/presenters/attachment-type.presenter";
import { deleteAttachmentType } from "@/interface-adapters/controllers/attachment-type.controller";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { usePermissions } from "@/hooks/use-permissions";

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
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [attachmentTypeToDelete, setAttachmentTypeToDelete] =
    React.useState<AttachmentTypeDTO | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);

  const { hasPermission } = usePermissions();

  const handleDelete = async (attachmentType: AttachmentTypeDTO) => {
    setIsDeleting(true);
    try {
      const result = await deleteAttachmentType(attachmentType.id);
      if (result.success) {
        toast.success("Attachment type deleted successfully");
        onRefresh();
      } else {
        toast.error(result.error);
      }
    } catch (_error) {
      toast.error("Failed to delete attachment type");
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setAttachmentTypeToDelete(null);
    }
  };

  const columns: ColumnDef<AttachmentTypeDTO>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
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
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const attachmentType = row.original;
        const canUpdate = hasPermission(PERMISSIONS.ATTACHMENT_TYPES_UPDATE);
        const canDelete = hasPermission(PERMISSIONS.ATTACHMENT_TYPES_DELETE);

        if (!canUpdate && !canDelete) {
          return null;
        }

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              {canUpdate && (
                <DropdownMenuItem onClick={() => onEdit(attachmentType)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
              )}
              {canDelete && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={() => {
                      setAttachmentTypeToDelete(attachmentType);
                      setDeleteDialogOpen(true);
                    }}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  return (
    <>
      <DataTable columns={columns} data={data} loading={loading} />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the attachment type &quot;
              {attachmentTypeToDelete?.name}&quot;. This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                attachmentTypeToDelete && handleDelete(attachmentTypeToDelete)
              }
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
