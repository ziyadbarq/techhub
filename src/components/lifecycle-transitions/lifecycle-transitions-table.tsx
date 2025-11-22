/**
 * Lifecycle Transitions Table Component
 */

"use client";

import * as React from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, Trash2, Pencil, ArrowRight } from "lucide-react";
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

import type { LifecycleTransitionDTO } from "@/interface-adapters/presenters/lifecycle-transition.presenter";
import { deleteLifecycleTransitionAction } from "@/interface-adapters/controllers/lifecycle-transition.controller";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { usePermissions } from "@/hooks/use-permissions";

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
  const [selectedRows, setSelectedRows] = React.useState<
    LifecycleTransitionDTO[]
  >([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [transitionToDelete, setTransitionToDelete] =
    React.useState<LifecycleTransitionDTO | null>(null);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);

  const { hasPermission } = usePermissions();

  const handleDelete = async (transition: LifecycleTransitionDTO) => {
    setIsDeleting(true);
    try {
      const result = await deleteLifecycleTransitionAction(transition.id);
      if (result.success) {
        toast.success("Lifecycle transition deleted successfully");
        onRefresh();
      } else {
        toast.error(result.error);
      }
    } catch (_error) {
      toast.error("Failed to delete lifecycle transition");
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setTransitionToDelete(null);
    }
  };

  const handleBulkDelete = async () => {
    setIsDeleting(true);
    try {
      const results = await Promise.all(
        selectedRows.map((t) => deleteLifecycleTransitionAction(t.id)),
      );

      const failed = results.filter((r) => !r.success).length;
      if (failed === 0) {
        toast.success(
          `${selectedRows.length} transitions deleted successfully`,
        );
      } else {
        toast.warning(
          `${selectedRows.length - failed} transitions deleted, ${failed} failed`,
        );
      }
      onRefresh();
    } catch (_error) {
      toast.error("Failed to delete transitions");
    } finally {
      setIsDeleting(false);
      setBulkDeleteDialogOpen(false);
      setSelectedRows([]);
    }
  };

  const columns: ColumnDef<LifecycleTransitionDTO>[] = [
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
            From: {row.original.fromStateId.slice(0, 8)}
          </Badge>
          <ArrowRight className="text-muted-foreground h-4 w-4" />
          <Badge variant="outline">
            To: {row.original.toStateId.slice(0, 8)}
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
    {
      id: "actions",
      cell: ({ row }) => {
        const transition = row.original;
        const canUpdate = hasPermission(
          PERMISSIONS.LIFECYCLE_TRANSITIONS_UPDATE,
        );
        const canDelete = hasPermission(
          PERMISSIONS.LIFECYCLE_TRANSITIONS_DELETE,
        );

        if (!canUpdate && !canDelete) {
          return null;
        }

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-sm">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              {canUpdate && (
                <DropdownMenuItem onClick={() => onEdit(transition)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
              )}
              {canUpdate && canDelete && <DropdownMenuSeparator />}
              {canDelete && (
                <DropdownMenuItem
                  onClick={() => {
                    setTransitionToDelete(transition);
                    setDeleteDialogOpen(true);
                  }}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

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
        onSelectionChange={setSelectedRows}
        showColumnToggle
        emptyMessage="No transitions found. Create one to get started!"
        pagination={{
          pageSize: 10,
        }}
        toolbarActions={
          selectedRows.length > 0 &&
          hasPermission(PERMISSIONS.LIFECYCLE_TRANSITIONS_DELETE) && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setBulkDeleteDialogOpen(true)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete ({selectedRows.length})
            </Button>
          )
        }
      />

      {/* Delete Dialogs */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the transition &quot;
              {transitionToDelete?.name}
              &quot;. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                transitionToDelete && handleDelete(transitionToDelete)
              }
              disabled={isDeleting}
              className="bg-destructive hover:bg-destructive/90 text-white"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={bulkDeleteDialogOpen}
        onOpenChange={setBulkDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete {selectedRows.length} transitions?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the selected transitions. This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              disabled={isDeleting}
              className="bg-destructive hover:bg-destructive/90 text-white"
            >
              {isDeleting ? "Deleting..." : "Delete All"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
