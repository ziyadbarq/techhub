/**
 * Person Role Assignments Table Component
 */

"use client";

import * as React from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, Trash2, Pencil, UserCog } from "lucide-react";
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
import type { PersonRoleAssignmentDTO } from "@/interface-adapters/presenters/person-role-assignment.presenter";
import { deletePersonRoleAssignmentAction } from "@/interface-adapters/controllers/person-role-assignment.controller";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { usePermissions } from "@/hooks/use-permissions";

interface PersonRoleAssignmentsTableProps {
  data: PersonRoleAssignmentDTO[];
  loading?: boolean;
  onEdit: (assignment: PersonRoleAssignmentDTO) => void;
  onRefresh: () => void;
}

export function PersonRoleAssignmentsTable({
  data,
  loading = false,
  onEdit,
  onRefresh,
}: PersonRoleAssignmentsTableProps) {
  const [selectedRows, setSelectedRows] = React.useState<
    PersonRoleAssignmentDTO[]
  >([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [assignmentToDelete, setAssignmentToDelete] =
    React.useState<PersonRoleAssignmentDTO | null>(null);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const { hasPermission } = usePermissions();

  const handleDelete = async (assignment: PersonRoleAssignmentDTO) => {
    setIsDeleting(true);
    try {
      const result = await deletePersonRoleAssignmentAction(assignment.id);
      if (result.success) {
        toast.success("Assignment deleted successfully");
        onRefresh();
      } else {
        toast.error(result.error);
      }
    } catch (_error) {
      toast.error("Failed to delete assignment");
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setAssignmentToDelete(null);
    }
  };

  const handleBulkDelete = async () => {
    setIsDeleting(true);
    try {
      const results = await Promise.all(
        selectedRows.map((a) => deletePersonRoleAssignmentAction(a.id)),
      );
      const failed = results.filter((r) => !r.success).length;
      if (failed === 0) {
        toast.success(
          `${selectedRows.length} assignments deleted successfully`,
        );
      } else {
        toast.warning(
          `${selectedRows.length - failed} assignments deleted, ${failed} failed`,
        );
      }
      onRefresh();
    } catch (_error) {
      toast.error("Failed to delete assignments");
    } finally {
      setIsDeleting(false);
      setBulkDeleteDialogOpen(false);
      setSelectedRows([]);
    }
  };

  const columns: ColumnDef<PersonRoleAssignmentDTO>[] = [
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
      accessorKey: "personId",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Assignment" />
      ),
      cell: ({ row }) => (
        <div className="flex items-start gap-2">
          <UserCog className="text-muted-foreground mt-0.5 h-4 w-4" />
          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium">
              Person: {row.original.personId.slice(0, 8)}
            </span>
            <span className="text-muted-foreground text-xs">
              Role: {row.original.roleId.slice(0, 8)}
            </span>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "roleId",
      header: "Role ID",
      cell: ({ row }) => (
        <span className="text-muted-foreground text-sm">
          {row.getValue("roleId")}
        </span>
      ),
      enableHiding: true,
    },
    {
      accessorKey: "scope",
      header: "Scope",
      cell: ({ row }) => {
        const scope = row.getValue("scope") as string | null;
        return scope ? <Badge variant="outline">{scope}</Badge> : null;
      },
    },
    {
      accessorKey: "isPrimary",
      header: "Primary",
      cell: ({ row }) => {
        const isPrimary = row.getValue("isPrimary") as boolean;
        return isPrimary ? <Badge variant="default">Primary</Badge> : null;
      },
    },
    {
      id: "dates",
      header: "Period",
      cell: ({ row }) => {
        const startDate = row.original.startDate
          ? new Date(row.original.startDate)
          : null;
        const endDate = row.original.endDate
          ? new Date(row.original.endDate)
          : null;
        return (
          <div className="text-muted-foreground text-sm">
            {startDate && <div>From: {format(startDate, "MMM d, yyyy")}</div>}
            {endDate && <div>To: {format(endDate, "MMM d, yyyy")}</div>}
            {!startDate && !endDate && "—"}
          </div>
        );
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
        const assignment = row.original;
        const canUpdate = hasPermission(
          PERMISSIONS.PERSON_ROLE_ASSIGNMENTS_UPDATE,
        );
        const canDelete = hasPermission(
          PERMISSIONS.PERSON_ROLE_ASSIGNMENTS_DELETE,
        );
        if (!canUpdate && !canDelete) return null;
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
                <DropdownMenuItem onClick={() => onEdit(assignment)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
              )}
              {canUpdate && canDelete && <DropdownMenuSeparator />}
              {canDelete && (
                <DropdownMenuItem
                  onClick={() => {
                    setAssignmentToDelete(assignment);
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
        searchKey="personId"
        searchPlaceholder="Search assignments..."
        selectable
        onSelectionChange={setSelectedRows}
        showColumnToggle
        emptyMessage="No assignments found. Create one to get started!"
        pagination={{ pageSize: 10 }}
        toolbarActions={
          selectedRows.length > 0 &&
          hasPermission(PERMISSIONS.PERSON_ROLE_ASSIGNMENTS_DELETE) && (
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
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this role assignment. This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                assignmentToDelete && handleDelete(assignmentToDelete)
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
              Delete {selectedRows.length} assignments?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the selected role assignments. This
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
