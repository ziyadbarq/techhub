/**
 * Lifecycle States Table Component
 */

"use client";

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

import type { LifecycleStateDTO } from "@/interface-adapters/presenters/lifecycle-state.presenter";
import { deleteLifecycleStateAction } from "@/interface-adapters/controllers/lifecycle-state.controller";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { usePermissions } from "@/hooks/use-permissions";

interface LifecycleStatesTableProps {
  data: LifecycleStateDTO[];
  loading?: boolean;
  onEdit: (state: LifecycleStateDTO) => void;
  onRefresh: () => void;
}

export function LifecycleStatesTable({
  data,
  loading = false,
  onEdit,
  onRefresh,
}: LifecycleStatesTableProps) {
  const [selectedRows, setSelectedRows] = React.useState<LifecycleStateDTO[]>(
    [],
  );
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [stateToDelete, setStateToDelete] =
    React.useState<LifecycleStateDTO | null>(null);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);

  const { hasPermission } = usePermissions();

  const handleDelete = async (state: LifecycleStateDTO) => {
    setIsDeleting(true);
    try {
      const result = await deleteLifecycleStateAction(state.id);
      if (result.success) {
        toast.success("Lifecycle state deleted successfully");
        onRefresh();
      } else {
        toast.error(result.error);
      }
    } catch (_error) {
      toast.error("Failed to delete lifecycle state");
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setStateToDelete(null);
    }
  };

  const handleBulkDelete = async () => {
    setIsDeleting(true);
    try {
      const results = await Promise.all(
        selectedRows.map((state) => deleteLifecycleStateAction(state.id)),
      );

      const failed = results.filter((r) => !r.success).length;
      if (failed === 0) {
        toast.success(`${selectedRows.length} states deleted successfully`);
      } else {
        toast.warning(
          `${selectedRows.length - failed} states deleted, ${failed} failed`,
        );
      }
      onRefresh();
    } catch (_error) {
      toast.error("Failed to delete states");
    } finally {
      setIsDeleting(false);
      setBulkDeleteDialogOpen(false);
      setSelectedRows([]);
    }
  };

  const columns: ColumnDef<LifecycleStateDTO>[] = [
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
      accessorKey: "stateType",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Type" />
      ),
      cell: ({ row }) => {
        const stateType = row.getValue("stateType") as string;
        return <Badge variant="outline">{stateType}</Badge>;
      },
      meta: {
        label: "Type",
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
    {
      id: "actions",
      cell: ({ row }) => {
        const state = row.original;
        const canUpdate = hasPermission(PERMISSIONS.LIFECYCLE_STATES_UPDATE);
        const canDelete = hasPermission(PERMISSIONS.LIFECYCLE_STATES_DELETE);

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
                <DropdownMenuItem onClick={() => onEdit(state)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
              )}
              {canUpdate && canDelete && <DropdownMenuSeparator />}
              {canDelete && (
                <DropdownMenuItem
                  onClick={() => {
                    setStateToDelete(state);
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
        searchPlaceholder="Search lifecycle states..."
        selectable
        onSelectionChange={setSelectedRows}
        showColumnToggle
        emptyMessage="No lifecycle states found. Create one to get started!"
        pagination={{
          pageSize: 10,
        }}
        toolbarActions={
          selectedRows.length > 0 &&
          hasPermission(PERMISSIONS.LIFECYCLE_STATES_DELETE) && (
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
              This will permanently delete the lifecycle state &quot;
              {stateToDelete?.name}
              &quot;. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => stateToDelete && handleDelete(stateToDelete)}
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
              Delete {selectedRows.length} states?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the selected lifecycle states. This
              action cannot be undone.
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
