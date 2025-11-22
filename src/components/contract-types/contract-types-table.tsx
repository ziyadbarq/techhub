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

import type { ContractTypeDTO } from "@/interface-adapters/presenters/contract-type.presenter";
import { deleteContractType } from "@/interface-adapters/controllers/contract-type.controller";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { usePermissions } from "@/hooks/use-permissions";

interface ContractTypesTableProps {
  data: ContractTypeDTO[];
  loading?: boolean;
  onEdit: (contractType: ContractTypeDTO) => void;
  onRefresh: () => void;
}

export function ContractTypesTable({
  data,
  loading = false,
  onEdit,
  onRefresh,
}: ContractTypesTableProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [contractTypeToDelete, setContractTypeToDelete] =
    React.useState<ContractTypeDTO | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);

  const { hasPermission } = usePermissions();

  const handleDelete = async (contractType: ContractTypeDTO) => {
    setIsDeleting(true);
    try {
      const result = await deleteContractType(contractType.id);
      if (result.success) {
        toast.success("Contract type deleted successfully");
        onRefresh();
      } else {
        toast.error(result.error);
      }
    } catch (_error) {
      toast.error("Failed to delete contract type");
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setContractTypeToDelete(null);
    }
  };

  const columns: ColumnDef<ContractTypeDTO>[] = [
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
            <span className="text-muted-foreground text-xs">
              {row.original.code}
            </span>
          </div>
        );
      },
      meta: {
        label: "Name",
      },
    },
    {
      accessorKey: "description",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Description" />
      ),
      cell: ({ row }) => {
        const description = row.getValue("description") as string | null;
        return (
          <span className="text-muted-foreground text-sm">
            {description || "—"}
          </span>
        );
      },
      meta: {
        label: "Description",
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
        const contractType = row.original;
        const canUpdate = hasPermission(PERMISSIONS.CONTRACT_TYPES_UPDATE);
        const canDelete = hasPermission(PERMISSIONS.CONTRACT_TYPES_DELETE);

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
                <DropdownMenuItem onClick={() => onEdit(contractType)}>
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
                      setContractTypeToDelete(contractType);
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
              This will permanently delete the contract type &quot;
              {contractTypeToDelete?.name}&quot;. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                contractTypeToDelete && handleDelete(contractTypeToDelete)
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
