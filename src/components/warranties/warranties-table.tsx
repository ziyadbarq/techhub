/**
 * Warranties Table Component
 * Displays warranties with filtering, sorting, and actions
 */

"use client";

import * as React from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, Trash2, Pencil, Shield } from "lucide-react";
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

import type { WarrantyDTO } from "@/interface-adapters/presenters/warranty.presenter";
import { deleteWarrantyAction } from "@/interface-adapters/controllers/warranty.controller";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { usePermissions } from "@/hooks/use-permissions";
import { WarrantyStatusBadge } from "./warranty-status-badge";

interface WarrantiesTableProps {
  data: WarrantyDTO[];
  loading?: boolean;
  onEdit: (warranty: WarrantyDTO) => void;
  onRefresh: () => void;
  showAssetColumn?: boolean;
}

export function WarrantiesTable({
  data,
  loading = false,
  onEdit,
  onRefresh,
  showAssetColumn = true,
}: WarrantiesTableProps) {
  const [selectedRows, setSelectedRows] = React.useState<WarrantyDTO[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [warrantyToDelete, setWarrantyToDelete] =
    React.useState<WarrantyDTO | null>(null);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);

  const { hasPermission } = usePermissions();

  const handleDelete = async (warranty: WarrantyDTO) => {
    setIsDeleting(true);
    try {
      const result = await deleteWarrantyAction(warranty.id);
      if (result.success) {
        toast.success("Warranty deleted successfully");
        onRefresh();
      } else {
        toast.error(result.error);
      }
    } catch (_error) {
      toast.error("Failed to delete warranty");
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setWarrantyToDelete(null);
    }
  };

  const handleBulkDelete = async () => {
    setIsDeleting(true);
    try {
      const results = await Promise.all(
        selectedRows.map((warranty) => deleteWarrantyAction(warranty.id)),
      );

      const failed = results.filter((r) => !r.success).length;
      if (failed === 0) {
        toast.success(`${selectedRows.length} warranties deleted successfully`);
      } else {
        toast.warning(
          `${selectedRows.length - failed} warranties deleted, ${failed} failed`,
        );
      }
      onRefresh();
    } catch (_error) {
      toast.error("Failed to delete warranties");
    } finally {
      setIsDeleting(false);
      setBulkDeleteDialogOpen(false);
      setSelectedRows([]);
    }
  };

  const columns: ColumnDef<WarrantyDTO>[] = [
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
    ...(showAssetColumn
      ? [
          {
            accessorKey: "assetId",
            header: ({ column }) => (
              <DataTableColumnHeader column={column} title="Asset" />
            ),
            cell: ({ row }) => {
              const warranty = row.original;
              return (
                <div className="flex flex-col gap-1">
                  <span className="font-medium">
                    {warranty.assetTag || "N/A"}
                  </span>
                </div>
              );
            },
            meta: {
              label: "Asset",
            },
          } as ColumnDef<WarrantyDTO>,
        ]
      : []),
    {
      accessorKey: "policyReference",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Policy" />
      ),
      cell: ({ row }) => {
        const policy = row.getValue("policyReference") as string | null;
        return (
          <div className="flex items-center gap-2">
            <Shield className="text-muted-foreground h-4 w-4" />
            <span>{policy || "—"}</span>
          </div>
        );
      },
      meta: {
        label: "Policy",
      },
    },
    {
      accessorKey: "coverageType",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Coverage" />
      ),
      cell: ({ row }) => {
        const coverageType = row.getValue("coverageType") as string;
        return (
          <Badge variant="outline">{coverageType.replace(/_/g, " ")}</Badge>
        );
      },
      meta: {
        label: "Coverage",
      },
    },
    {
      accessorKey: "vendorName",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Vendor" />
      ),
      cell: ({ row }) => {
        const vendorName = row.getValue("vendorName") as string | null;
        return (
          <span className="text-sm">
            {vendorName || (
              <span className="text-muted-foreground">No vendor</span>
            )}
          </span>
        );
      },
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
        const date = new Date(row.getValue("startDate"));
        return (
          <span className="text-muted-foreground text-sm">
            {format(date, "MMM d, yyyy")}
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
        const date = new Date(row.getValue("endDate"));
        return (
          <span className="text-muted-foreground text-sm">
            {format(date, "MMM d, yyyy")}
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
        const warranty = row.original;
        return (
          <WarrantyStatusBadge
            isActive={warranty.isActive}
            isExpired={warranty.isExpired}
            isExpiringSoon={warranty.isExpiringSoon}
            daysRemaining={warranty.daysRemaining}
          />
        );
      },
      meta: {
        label: "Status",
      },
    },
    {
      accessorKey: "cost",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Cost" />
      ),
      cell: ({ row }) => {
        const cost = row.getValue("cost") as number | null;
        const currency = row.original.currency;
        if (cost === null)
          return <span className="text-muted-foreground">—</span>;
        return (
          <span className="text-sm">
            {new Intl.NumberFormat("en-US", {
              style: "currency",
              currency: currency || "USD",
            }).format(cost)}
          </span>
        );
      },
      meta: {
        label: "Cost",
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const warranty = row.original;
        const canUpdate = hasPermission(PERMISSIONS.WARRANTIES_UPDATE);
        const canDelete = hasPermission(PERMISSIONS.WARRANTIES_DELETE);

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
                <DropdownMenuItem onClick={() => onEdit(warranty)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
              )}
              {canUpdate && canDelete && <DropdownMenuSeparator />}
              {canDelete && (
                <DropdownMenuItem
                  onClick={() => {
                    setWarrantyToDelete(warranty);
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
        searchKey="policyReference"
        searchPlaceholder="Search warranties..."
        selectable
        onSelectionChange={setSelectedRows}
        showColumnToggle
        emptyMessage="No warranties found. Create one to get started!"
        pagination={{
          pageSize: 10,
        }}
        toolbarActions={
          selectedRows.length > 0 &&
          hasPermission(PERMISSIONS.WARRANTIES_DELETE) && (
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
              This will permanently delete the warranty for &quot;
              {warrantyToDelete?.assetTag || "this asset"}
              &quot;. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => warrantyToDelete && handleDelete(warrantyToDelete)}
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
              Delete {selectedRows.length} warranties?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the selected warranties. This action
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
