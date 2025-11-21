/**
 * Field Definitions Table Component
 */

"use client";

import * as React from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, Trash2, Pencil, FileCode } from "lucide-react";
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
import type { FieldDefinitionDTO } from "@/interface-adapters/presenters/field-definition.presenter";
import { deleteFieldDefinitionAction } from "@/interface-adapters/controllers/field-definition.controller";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { usePermissions } from "@/hooks/use-permissions";
import { FieldDataTypeEnum } from "@/core/domain/value-objects/foundation-enums";

interface FieldDefinitionsTableProps {
  data: FieldDefinitionDTO[];
  loading?: boolean;
  onEdit: (field: FieldDefinitionDTO) => void;
  onRefresh: () => void;
}

const fieldTypeColors: Partial<Record<FieldDataTypeEnum, string>> = {
  [FieldDataTypeEnum.STRING]:
    "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  [FieldDataTypeEnum.TEXT]:
    "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  [FieldDataTypeEnum.INTEGER]:
    "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  [FieldDataTypeEnum.DECIMAL]:
    "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  [FieldDataTypeEnum.BOOLEAN]:
    "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200",
  [FieldDataTypeEnum.DATE]:
    "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
  [FieldDataTypeEnum.DATETIME]:
    "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200",
  [FieldDataTypeEnum.JSON]:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
};

export function FieldDefinitionsTable({
  data,
  loading = false,
  onEdit,
  onRefresh,
}: FieldDefinitionsTableProps) {
  const [selectedRows, setSelectedRows] = React.useState<FieldDefinitionDTO[]>(
    [],
  );
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [fieldToDelete, setFieldToDelete] =
    React.useState<FieldDefinitionDTO | null>(null);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const { hasPermission } = usePermissions();

  const handleDelete = async (field: FieldDefinitionDTO) => {
    setIsDeleting(true);
    try {
      const result = await deleteFieldDefinitionAction(field.id);
      if (result.success) {
        toast.success("Field definition deleted successfully");
        onRefresh();
      } else {
        toast.error(result.error);
      }
    } catch (_error) {
      toast.error("Failed to delete field definition");
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setFieldToDelete(null);
    }
  };

  const handleBulkDelete = async () => {
    setIsDeleting(true);
    try {
      const results = await Promise.all(
        selectedRows.map((f) => deleteFieldDefinitionAction(f.id)),
      );
      const failed = results.filter((r) => !r.success).length;

      if (failed === 0) {
        toast.success(
          `${selectedRows.length} field definition${selectedRows.length !== 1 ? "s" : ""} deleted successfully`,
        );
      } else {
        toast.warning(
          `${selectedRows.length - failed} deleted, ${failed} failed`,
        );
      }

      onRefresh();
    } catch (_error) {
      toast.error("Failed to delete field definitions");
    } finally {
      setIsDeleting(false);
      setBulkDeleteDialogOpen(false);
      setSelectedRows([]);
    }
  };

  const columns: ColumnDef<FieldDefinitionDTO>[] = [
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
      accessorKey: "label",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Field" />
      ),
      cell: ({ row }) => (
        <div className="flex items-start gap-2">
          <FileCode className="text-muted-foreground mt-0.5 h-4 w-4" />
          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium">{row.original.label}</span>
            <span className="text-muted-foreground font-mono text-xs">
              {row.original.name}
            </span>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "dataType",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Type" />
      ),
      cell: ({ row }) => {
        const fieldType = row.getValue("dataType") as FieldDataTypeEnum;
        return (
          <Badge
            variant="outline"
            className={fieldTypeColors[fieldType] ?? "bg-muted text-foreground"}
          >
            {fieldType}
          </Badge>
        );
      },
    },
    {
      accessorKey: "entityType",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Entity" />
      ),
      cell: ({ row }) => (
        <Badge variant="secondary">
          {row.getValue("entityType") as string}
        </Badge>
      ),
    },
    {
      id: "constraints",
      header: "Constraints",
      cell: ({ row }) => {
        const isRequired = row.original.isRequired;
        const isUnique = row.original.isUnique;

        if (!isRequired && !isUnique)
          return <span className="text-muted-foreground">—</span>;

        return (
          <div className="flex gap-1">
            {isRequired && (
              <Badge variant="outline" className="text-xs">
                Required
              </Badge>
            )}
            {isUnique && (
              <Badge variant="outline" className="text-xs">
                Unique
              </Badge>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "displayOrder",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Order" />
      ),
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {row.getValue("displayOrder") as number}
        </span>
      ),
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
        const field = row.original;
        const canUpdate = hasPermission(PERMISSIONS.FIELD_DEFINITIONS_UPDATE);
        const canDelete = hasPermission(PERMISSIONS.FIELD_DEFINITIONS_DELETE);

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
                <DropdownMenuItem onClick={() => onEdit(field)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
              )}
              {canUpdate && canDelete && <DropdownMenuSeparator />}
              {canDelete && (
                <DropdownMenuItem
                  onClick={() => {
                    setFieldToDelete(field);
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
        searchKey="label"
        searchPlaceholder="Search field definitions..."
        selectable
        onSelectionChange={setSelectedRows}
        showColumnToggle
        emptyMessage="No field definitions found. Create one to get started!"
        pagination={{
          pageSize: 10,
        }}
        toolbarActions={
          selectedRows.length > 0 &&
          hasPermission(PERMISSIONS.FIELD_DEFINITIONS_DELETE) && (
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
              This will permanently delete this field definition. This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => fieldToDelete && handleDelete(fieldToDelete)}
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
              Delete {selectedRows.length} field definition
              {selectedRows.length !== 1 ? "s" : ""}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the selected field definitions. This
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
