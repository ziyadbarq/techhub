"use client";

import * as React from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, Trash2, Pencil, Eye, Building2 } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import Link from "next/link";

import { DataTable, DataTableColumnHeader } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { EntityDisplay } from "@/components/ui/entity-display";
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

import type { ContractDTO } from "@/interface-adapters/presenters/contract.presenter";
import { deleteContract } from "@/interface-adapters/controllers/contract.controller";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { usePermissions } from "@/hooks/use-permissions";

interface ContractsTableProps {
  data: ContractDTO[];
  loading?: boolean;
  onEdit: (contract: ContractDTO) => void;
  onRefresh: () => void;
}

export function ContractsTable({
  data,
  loading = false,
  onEdit,
  onRefresh,
}: ContractsTableProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [contractToDelete, setContractToDelete] =
    React.useState<ContractDTO | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);

  const { hasPermission } = usePermissions();

  const handleDelete = async (contract: ContractDTO) => {
    setIsDeleting(true);
    try {
      const result = await deleteContract(contract.id);
      if (result.success) {
        toast.success("Contract deleted successfully");
        onRefresh();
      } else {
        toast.error(result.error);
      }
    } catch (_error) {
      toast.error("Failed to delete contract");
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setContractToDelete(null);
    }
  };

  const columns: ColumnDef<ContractDTO>[] = [
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
        <DataTableColumnHeader column={column} title="Contract Name" />
      ),
      cell: ({ row }) => {
        const name = row.getValue("name") as string;
        const contractNumber = row.original.contractNumber;
        return (
          <div className="flex flex-col gap-1">
            <Link
              href={`/contracts/${row.original.id}`}
              className="font-medium hover:underline"
            >
              {name}
            </Link>
            {contractNumber && (
              <span className="text-muted-foreground text-xs">
                {contractNumber}
              </span>
            )}
          </div>
        );
      },
      meta: {
        label: "Contract Name",
      },
    },
    {
      accessorKey: "vendorId",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Vendor" />
      ),
      cell: ({ row }) => (
        <EntityDisplay name={row.original.vendorName} icon={Building2} />
      ),
      meta: {
        label: "Vendor",
      },
    },
    {
      accessorKey: "startDate",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Start Date" />
      ),
      cell: ({ row }) => {
        const date = row.getValue("startDate") as Date;
        return (
          <span className="text-sm">
            {format(new Date(date), "MMM d, yyyy")}
          </span>
        );
      },
      meta: {
        label: "Start Date",
      },
    },
    {
      accessorKey: "endDate",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="End Date" />
      ),
      cell: ({ row }) => {
        const date = row.getValue("endDate") as Date | null;
        if (!date) return <span className="text-muted-foreground">—</span>;
        return (
          <span className="text-sm">
            {format(new Date(date), "MMM d, yyyy")}
          </span>
        );
      },
      meta: {
        label: "End Date",
      },
    },
    {
      id: "status",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Status" />
      ),
      cell: ({ row }) => {
        const contract = row.original;
        const isActive = contract.isActive ?? true;
        const isExpired = contract.isExpired ?? false;
        const autoRenew = contract.autoRenew;

        if (isExpired) {
          return <Badge variant="destructive">Expired</Badge>;
        }
        if (isActive) {
          return (
            <div className="flex gap-1">
              <Badge variant="default">Active</Badge>
              {autoRenew && (
                <Badge variant="secondary" className="text-xs">
                  Auto-Renew
                </Badge>
              )}
            </div>
          );
        }
        return <Badge variant="secondary">Inactive</Badge>;
      },
      meta: {
        label: "Status",
      },
    },
    {
      accessorKey: "totalValue",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Value" />
      ),
      cell: ({ row }) => {
        const value = row.getValue("totalValue") as number | null;
        const currency = row.original.currency || "SAR";
        if (!value) return <span className="text-muted-foreground">—</span>;
        return (
          <span className="text-sm font-medium">
            {value.toLocaleString()} {currency}
          </span>
        );
      },
      meta: {
        label: "Value",
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const contract = row.original;
        const canView = hasPermission(PERMISSIONS.CONTRACTS_VIEW);
        const canUpdate = hasPermission(PERMISSIONS.CONTRACTS_UPDATE);
        const canDelete = hasPermission(PERMISSIONS.CONTRACTS_DELETE);

        if (!canView && !canUpdate && !canDelete) {
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
              {canView && (
                <DropdownMenuItem asChild>
                  <Link href={`/contracts/${contract.id}`}>
                    <Eye className="mr-2 h-4 w-4" />
                    View Details
                  </Link>
                </DropdownMenuItem>
              )}
              {canUpdate && (
                <DropdownMenuItem onClick={() => onEdit(contract)}>
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
                      setContractToDelete(contract);
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
              This will permanently delete the contract &quot;
              {contractToDelete?.name}&quot;. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => contractToDelete && handleDelete(contractToDelete)}
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
