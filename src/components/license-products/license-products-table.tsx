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

import type { LicenseProductDTO } from "@/interface-adapters/presenters/license-product.presenter";
import { deleteLicenseProduct } from "@/interface-adapters/controllers/license-product.controller";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { usePermissions } from "@/hooks/use-permissions";

interface LicenseProductsTableProps {
  data: LicenseProductDTO[];
  loading?: boolean;
  onEdit: (licenseProduct: LicenseProductDTO) => void;
  onRefresh: () => void;
}

const metricTypeLabels = {
  per_device: "Per Device",
  per_user: "Per User",
  per_core: "Per Core",
  per_vm: "Per VM",
  per_cluster: "Per Cluster",
};

export function LicenseProductsTable({
  data,
  loading = false,
  onEdit,
  onRefresh,
}: LicenseProductsTableProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [licenseProductToDelete, setLicenseProductToDelete] =
    React.useState<LicenseProductDTO | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);

  const { hasPermission } = usePermissions();

  const handleDelete = async (licenseProduct: LicenseProductDTO) => {
    setIsDeleting(true);
    try {
      const result = await deleteLicenseProduct(licenseProduct.id);
      if (result.success) {
        toast.success("License product deleted successfully");
        onRefresh();
      } else {
        toast.error(result.error);
      }
    } catch (_error) {
      toast.error("Failed to delete license product");
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setLicenseProductToDelete(null);
    }
  };

  const columns: ColumnDef<LicenseProductDTO>[] = [
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
      accessorKey: "metricType",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Metric Type" />
      ),
      cell: ({ row }) => {
        const metricType = row.getValue(
          "metricType",
        ) as keyof typeof metricTypeLabels;
        return (
          <Badge variant="secondary">
            {metricTypeLabels[metricType] || metricType}
          </Badge>
        );
      },
      meta: {
        label: "Metric Type",
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
          <span className="text-muted-foreground line-clamp-2 text-sm">
            {description || "—"}
          </span>
        );
      },
      meta: {
        label: "Description",
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
        const licenseProduct = row.original;
        const canUpdate = hasPermission(PERMISSIONS.LICENSE_PRODUCTS_UPDATE);
        const canDelete = hasPermission(PERMISSIONS.LICENSE_PRODUCTS_DELETE);

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
                <DropdownMenuItem onClick={() => onEdit(licenseProduct)}>
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
                      setLicenseProductToDelete(licenseProduct);
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
              This will permanently delete the license product &quot;
              {licenseProductToDelete?.name}&quot;. This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                licenseProductToDelete && handleDelete(licenseProductToDelete)
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
