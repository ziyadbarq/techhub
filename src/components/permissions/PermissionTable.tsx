/**
 * PermissionTable Component
 *
 * Advanced data table for permissions using TanStack Table.
 * Features: sorting, filtering, grouping by resource, row actions.
 */

"use client";
"use no memo";

import * as React from "react";
import { type ColumnDef } from "@tanstack/react-table";
import {
  MoreHorizontal,
  Trash2,
  Pencil,
  Shield,
  ShieldCheck,
  ShieldOff,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import { DataTable, DataTableColumnHeader } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
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

import type { PermissionDTO } from "@/interface-adapters/presenters/permission.presenter";
import { deletePermissionAction } from "@/interface-adapters/controllers/permission.controller";

interface PermissionTableProps {
  data: PermissionDTO[];
  loading?: boolean;
  onRefresh: () => void;
}

export function PermissionTable({
  data,
  loading = false,
  onRefresh,
}: PermissionTableProps) {
  const router = useRouter();
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [permissionToDelete, setPermissionToDelete] =
    React.useState<PermissionDTO | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);

  const handleDelete = async (permission: PermissionDTO) => {
    setIsDeleting(true);
    try {
      const result = await deletePermissionAction(permission.id);
      if (result.success) {
        toast.success("Permission deleted successfully");
        onRefresh();
      } else {
        toast.error(result.error);
      }
    } catch (_error) {
      toast.error("Failed to delete permission");
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setPermissionToDelete(null);
    }
  };

  const handleEdit = (permission: PermissionDTO) => {
    router.push(`/admin/permissions/${encodeURIComponent(permission.name)}`);
  };

  const getStatusBadge = (permission: PermissionDTO) => {
    if (!permission.isActive) {
      return (
        <Badge variant="outline" className="text-muted-foreground">
          <ShieldOff className="mr-1 h-3 w-3" />
          Inactive
        </Badge>
      );
    }

    if (permission.isSystem) {
      return (
        <Badge variant="default" className="bg-primary">
          <ShieldCheck className="mr-1 h-3 w-3" />
          System
        </Badge>
      );
    }

    return (
      <Badge variant="outline" className="text-foreground">
        <Shield className="mr-1 h-3 w-3" />
        Active
      </Badge>
    );
  };

  const columns: ColumnDef<PermissionDTO>[] = [
    {
      accessorKey: "resource",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Resource" />
      ),
      cell: ({ row }) => {
        const resource = row.getValue("resource") as string;
        return (
          <span className="font-medium capitalize">
            {resource.replace(/-/g, " ")}
          </span>
        );
      },
      filterFn: (row, id, value) => {
        return value.includes(row.getValue(id));
      },
      meta: {
        label: "Resource",
      },
    },
    {
      accessorKey: "action",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Action" />
      ),
      cell: ({ row }) => {
        const action = row.getValue("action") as string;
        return (
          <span className="text-muted-foreground capitalize">
            {action.replace(/:/g, " ")}
          </span>
        );
      },
      meta: {
        label: "Action",
      },
    },
    {
      accessorKey: "displayName",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Display Name" />
      ),
      cell: ({ row }) => {
        const displayName = row.getValue("displayName") as string;
        const description = row.original.description;
        return (
          <div className="flex flex-col gap-1">
            <span className="font-medium">{displayName}</span>
            {description && (
              <span className="text-muted-foreground line-clamp-1 text-xs">
                {description}
              </span>
            )}
          </div>
        );
      },
      meta: {
        label: "Display Name",
      },
    },
    {
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Permission Key" />
      ),
      cell: ({ row }) => {
        const name = row.getValue("name") as string;
        return (
          <code className="bg-muted text-foreground rounded px-2 py-1 font-mono text-xs">
            {name}
          </code>
        );
      },
      meta: {
        label: "Permission Key",
      },
    },
    {
      id: "status",
      header: "Status",
      cell: ({ row }) => getStatusBadge(row.original),
      filterFn: (row, id, value) => {
        const permission = row.original;
        if (value.includes("system")) return permission.isSystem;
        if (value.includes("active"))
          return permission.isActive && !permission.isSystem;
        if (value.includes("inactive")) return !permission.isActive;
        return false;
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
        const permission = row.original;

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
              <DropdownMenuItem onClick={() => handleEdit(permission)}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              {!permission.isSystem && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => {
                      setPermissionToDelete(permission);
                      setDeleteDialogOpen(true);
                    }}
                    className="text-destructive focus:text-destructive"
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
      <DataTable
        columns={columns}
        data={data}
        loading={loading}
        searchable
        searchKey="displayName"
        searchPlaceholder="Search permissions..."
        showColumnToggle
        emptyMessage="No permissions found. Create one to get started!"
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Permission</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the permission{" "}
              <strong>{permissionToDelete?.name}</strong>? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                permissionToDelete && handleDelete(permissionToDelete)
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
