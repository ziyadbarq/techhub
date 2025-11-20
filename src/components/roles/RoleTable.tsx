/**
 * Roles Table Component
 *
 * Advanced data table for roles using TanStack Table.
 * Features: sorting, filtering, pagination, actions (edit, delete, assign permissions).
 */

"use client";

import * as React from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, Trash2, Pencil, Shield } from "lucide-react";
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

import type { RoleDTO } from "@/interface-adapters/presenters/role.presenter";
import { deleteRoleAction } from "@/interface-adapters/controllers/role.controller";

interface RoleTableProps {
  data: RoleDTO[];
  loading?: boolean;
  onRefresh: () => void;
}

export function RoleTable({
  data,
  loading = false,
  onRefresh,
}: RoleTableProps) {
  const router = useRouter();
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [roleToDelete, setRoleToDelete] = React.useState<RoleDTO | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);

  const handleDelete = async (role: RoleDTO) => {
    setIsDeleting(true);
    try {
      const result = await deleteRoleAction(role.id);
      if (result.success) {
        toast.success("Role deleted successfully");
        onRefresh();
      } else {
        toast.error(result.error);
      }
    } catch (_error) {
      toast.error("Failed to delete role");
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setRoleToDelete(null);
    }
  };

  const getStatusBadge = (isActive: boolean, isSystem: boolean) => {
    if (isSystem) {
      return (
        <Badge
          variant="outline"
          className="border-barq-yellow text-barq-yellow"
        >
          System
        </Badge>
      );
    }
    if (isActive) {
      return (
        <Badge variant="default" className="bg-success text-white">
          Active
        </Badge>
      );
    }
    return <Badge variant="outline">Inactive</Badge>;
  };

  const columns: ColumnDef<RoleDTO>[] = [
    {
      accessorKey: "displayName",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Role" />
      ),
      cell: ({ row }) => {
        const displayName = row.getValue("displayName") as string;
        const name = row.original.name;
        return (
          <div className="flex flex-col gap-1">
            <span className="font-medium">{displayName}</span>
            <span className="text-muted-foreground font-mono text-xs">
              {name}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ row }) => {
        const description = row.getValue("description") as string | undefined;
        return (
          <span className="text-muted-foreground line-clamp-2 text-sm">
            {description || "-"}
          </span>
        );
      },
    },
    {
      accessorKey: "isSystem",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Status" />
      ),
      cell: ({ row }) =>
        getStatusBadge(row.original.isActive, row.getValue("isSystem")),
      filterFn: (row, id, value) => {
        return value.includes(row.getValue(id));
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
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const role = row.original;
        const isSystem = role.isSystem;

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
              <DropdownMenuItem
                onClick={() => router.push(`/admin/roles/${role.id}`)}
              >
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() =>
                  router.push(`/admin/roles/${role.id}/permissions`)
                }
              >
                <Shield className="mr-2 h-4 w-4" />
                Manage Permissions
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  setRoleToDelete(role);
                  setDeleteDialogOpen(true);
                }}
                disabled={isSystem}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
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
        searchPlaceholder="Search roles..."
        showColumnToggle
        emptyMessage="No roles found. Create one to get started!"
        pagination={{
          pageSize: 10,
        }}
      />

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the role &quot;
              {roleToDelete?.displayName}&quot;. This action cannot be undone.
              Users with this role will lose their permissions.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => roleToDelete && handleDelete(roleToDelete)}
              disabled={isDeleting}
              className="bg-destructive hover:bg-destructive/90 text-white"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
