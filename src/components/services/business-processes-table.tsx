/**
 * Business Processes Table Component
 */

"use client";
"use no memo";

import * as React from "react";
import { useRouter } from "next/navigation";
import { type ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, Trash2, Eye, Pencil } from "lucide-react";
import { toast } from "sonner";

import { DataTable, DataTableColumnHeader } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
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

import type { BusinessProcessDTO } from "@/interface-adapters/presenters/service.presenter";
import { deleteBusinessProcessAction } from "@/interface-adapters/controllers/business-process.controller";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { usePermissions } from "@/hooks/use-permissions";

interface BusinessProcessesTableProps {
  data: BusinessProcessDTO[];
  loading?: boolean;
  onEdit?: (process: BusinessProcessDTO) => void;
}

export function BusinessProcessesTable({
  data,
  loading = false,
  onEdit,
}: BusinessProcessesTableProps) {
  const router = useRouter();
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [processToDelete, setProcessToDelete] =
    React.useState<BusinessProcessDTO | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);

  const { hasPermission } = usePermissions();

  const handleDelete = async (process: BusinessProcessDTO) => {
    setIsDeleting(true);
    try {
      const result = await deleteBusinessProcessAction(process.id);
      if (result.success) {
        toast.success("Business process deleted successfully");
        router.refresh();
      } else {
        toast.error(result.error || "Failed to delete business process");
      }
    } catch (_error) {
      toast.error("Failed to delete business process");
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setProcessToDelete(null);
    }
  };

  const columns: ColumnDef<BusinessProcessDTO>[] = [
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
      filterFn: (row, id, value) => {
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
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const process = row.original;
        const canView = hasPermission(PERMISSIONS.BUSINESS_PROCESSES_VIEW);
        const canManage = hasPermission(PERMISSIONS.BUSINESS_PROCESSES_MANAGE);

        if (!canView && !canManage) {
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
              <DropdownMenuSeparator />
              {canView && (
                <DropdownMenuItem
                  onClick={() =>
                    router.push(`/business-processes/${process.id}`)
                  }
                >
                  <Eye className="mr-2 h-4 w-4" />
                  View Details
                </DropdownMenuItem>
              )}
              {canManage && onEdit && (
                <DropdownMenuItem onClick={() => onEdit(process)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
              )}
              {canManage && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => {
                      setProcessToDelete(process);
                      setDeleteDialogOpen(true);
                    }}
                    className="text-destructive"
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Business Process?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete business process &quot;
              {processToDelete?.code}&quot;. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (processToDelete) {
                  handleDelete(processToDelete);
                }
              }}
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
