/**
 * Tasks Table Component
 *
 * Advanced data table for tasks using TanStack Table.
 * Features: sorting, filtering, pagination, bulk operations, CSV export/import.
 */

"use client";

import * as React from "react";
import { type ColumnDef } from "@tanstack/react-table";
import {
  MoreHorizontal,
  Trash2,
  Download,
  Upload,
  Pencil,
  CheckCircle2,
} from "lucide-react";
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

import type { TaskDTO } from "@/interface-adapters/presenters/task.presenter";
import { TaskStatus } from "@/core/domain/entities/task.entity";
import {
  deleteTaskAction,
  completeTaskAction,
} from "@/interface-adapters/controllers/task.controller";
import { exportTasksToCSV } from "@/interface-adapters/controllers/csv.controller";
import { PermissionGuard } from "@/components/auth/PermissionGuard";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { usePermissions } from "@/hooks/use-permissions";
import { useSession } from "@/lib/auth/client";

interface TasksTableProps {
  data: TaskDTO[];
  loading?: boolean;
  onEdit: (task: TaskDTO) => void;
  onRefresh: () => void;
  onImport: () => void;
}

export function TasksTable({
  data,
  loading = false,
  onEdit,
  onRefresh,
  onImport,
}: TasksTableProps) {
  const [selectedRows, setSelectedRows] = React.useState<TaskDTO[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [taskToDelete, setTaskToDelete] = React.useState<TaskDTO | null>(null);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = React.useState(false);
  const [isExporting, setIsExporting] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);

  // Get current user and permissions
  const { data: session } = useSession();
  const { hasPermission } = usePermissions();
  const currentUserId = session?.user?.id;

  // Helper to check if user can modify a task
  const canModifyTask = React.useCallback(
    (task: TaskDTO, action: "update" | "delete") => {
      const permission =
        action === "update"
          ? PERMISSIONS.TASKS_UPDATE
          : PERMISSIONS.TASKS_DELETE;
      const ownPermission =
        action === "update"
          ? PERMISSIONS.TASKS_UPDATE_OWN
          : PERMISSIONS.TASKS_DELETE_OWN;

      // Has full permission
      if (hasPermission(permission)) {
        return true;
      }

      // Has own permission and owns the task
      if (hasPermission(ownPermission) && task.createdBy === currentUserId) {
        return true;
      }

      return false;
    },
    [hasPermission, currentUserId],
  );

  const handleDelete = async (task: TaskDTO) => {
    setIsDeleting(true);
    try {
      const result = await deleteTaskAction(task.id);
      if (result.success) {
        toast.success("Task deleted successfully");
        onRefresh();
      } else {
        toast.error(result.error);
      }
    } catch (_error) {
      toast.error("Failed to delete task");
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setTaskToDelete(null);
    }
  };

  const handleBulkDelete = async () => {
    setIsDeleting(true);
    try {
      const results = await Promise.all(
        selectedRows.map((task) => deleteTaskAction(task.id)),
      );

      const failed = results.filter((r) => !r.success).length;
      if (failed === 0) {
        toast.success(`${selectedRows.length} tasks deleted successfully`);
      } else {
        toast.warning(
          `${selectedRows.length - failed} tasks deleted, ${failed} failed`,
        );
      }
      onRefresh();
    } catch (_error) {
      toast.error("Failed to delete tasks");
    } finally {
      setIsDeleting(false);
      setBulkDeleteDialogOpen(false);
      setSelectedRows([]);
    }
  };

  const handleComplete = async (task: TaskDTO) => {
    try {
      const result = await completeTaskAction(task.id);
      if (result.success) {
        toast.success("Task marked as complete");
        onRefresh();
      } else {
        toast.error(result.error);
      }
    } catch (_error) {
      toast.error("Failed to complete task");
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const tasksToExport = selectedRows.length > 0 ? selectedRows : data;
      const result = await exportTasksToCSV(tasksToExport);

      if (result.success && result.data) {
        // Create blob and download
        const blob = new Blob([result.data], { type: "text/csv" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `tasks-${format(new Date(), "yyyy-MM-dd-HHmmss")}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        toast.success(
          `Exported ${tasksToExport.length} task${tasksToExport.length !== 1 ? "s" : ""}`,
        );
      } else {
        toast.error(!result.success ? result.error : "Failed to export tasks");
      }
    } catch (_error) {
      toast.error("Failed to export tasks");
    } finally {
      setIsExporting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case TaskStatus.COMPLETED:
        return (
          <Badge variant="default" className="bg-success text-white">
            Completed
          </Badge>
        );
      case TaskStatus.IN_PROGRESS:
        return <Badge variant="default">In Progress</Badge>;
      case TaskStatus.PENDING:
        return <Badge variant="outline">Pending</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const columns: ColumnDef<TaskDTO>[] = [
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
      accessorKey: "title",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Title" />
      ),
      cell: ({ row }) => {
        const title = row.getValue("title") as string;
        return (
          <div className="flex flex-col gap-1">
            <span className="font-medium">{title}</span>
            {row.original.description && (
              <span className="text-muted-foreground line-clamp-1 text-xs">
                {row.original.description}
              </span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "status",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Status" />
      ),
      cell: ({ row }) => getStatusBadge(row.getValue("status")),
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
      accessorKey: "updatedAt",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Updated" />
      ),
      cell: ({ row }) => {
        const date = new Date(row.getValue("updatedAt"));
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
        const task = row.original;
        const isCompleted = task.status === TaskStatus.COMPLETED;
        const canUpdate = canModifyTask(task, "update");
        const canDelete = canModifyTask(task, "delete");

        // Don't show menu if user has no permissions
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
                <>
                  <DropdownMenuItem onClick={() => onEdit(task)}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                  {!isCompleted && (
                    <DropdownMenuItem onClick={() => handleComplete(task)}>
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Mark Complete
                    </DropdownMenuItem>
                  )}
                </>
              )}
              {canUpdate && canDelete && <DropdownMenuSeparator />}
              {canDelete && (
                <DropdownMenuItem
                  onClick={() => {
                    setTaskToDelete(task);
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
        searchKey="title"
        searchPlaceholder="Search tasks..."
        selectable
        onSelectionChange={setSelectedRows}
        showColumnToggle
        emptyMessage="No tasks found. Create one to get started!"
        pagination={{
          pageSize: 10,
        }}
        toolbarActions={
          <div className="flex items-center gap-2">
            {selectedRows.length > 0 &&
              hasPermission(PERMISSIONS.TASKS_DELETE) && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setBulkDeleteDialogOpen(true)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete ({selectedRows.length})
                </Button>
              )}
            <PermissionGuard permission={PERMISSIONS.TASKS_VIEW}>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExport}
                disabled={isExporting || data.length === 0}
              >
                <Download className="mr-2 h-4 w-4" />
                {isExporting ? "Exporting..." : "Export CSV"}
              </Button>
            </PermissionGuard>
            <PermissionGuard permission={PERMISSIONS.TASKS_CREATE}>
              <Button variant="outline" size="sm" onClick={onImport}>
                <Upload className="mr-2 h-4 w-4" />
                Import CSV
              </Button>
            </PermissionGuard>
          </div>
        }
      />

      {/* Single Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the task &quot;{taskToDelete?.title}
              &quot;. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => taskToDelete && handleDelete(taskToDelete)}
              disabled={isDeleting}
              className="bg-destructive hover:bg-destructive/90 text-white"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Delete Dialog */}
      <AlertDialog
        open={bulkDeleteDialogOpen}
        onOpenChange={setBulkDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete {selectedRows.length} tasks?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the selected tasks. This action
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
