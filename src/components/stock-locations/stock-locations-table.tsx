/**
 * Stock Locations Table Component
 * Displays stock locations with filtering, sorting, and actions
 */

"use client";

import * as React from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, Trash2, Pencil, MapPin, Package } from "lucide-react";
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

import type { StockLocationDTO } from "@/interface-adapters/presenters/stock-location.presenter";
import { deleteStockLocationAction } from "@/interface-adapters/controllers/stock-location.controller";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { usePermissions } from "@/hooks/use-permissions";

interface StockLocationsTableProps {
  data: StockLocationDTO[];
  loading?: boolean;
  onEdit: (stockLocation: StockLocationDTO) => void;
  onRefresh: () => void;
}

export function StockLocationsTable({
  data,
  loading = false,
  onEdit,
  onRefresh,
}: StockLocationsTableProps) {
  const [selectedRows, setSelectedRows] = React.useState<StockLocationDTO[]>(
    [],
  );
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [stockLocationToDelete, setStockLocationToDelete] =
    React.useState<StockLocationDTO | null>(null);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);

  const { hasPermission } = usePermissions();

  const handleDelete = async (stockLocation: StockLocationDTO) => {
    setIsDeleting(true);
    try {
      const result = await deleteStockLocationAction(stockLocation.id);
      if (result.success) {
        toast.success("Stock location deleted successfully");
        onRefresh();
      } else {
        toast.error(result.error);
      }
    } catch (_error) {
      toast.error("Failed to delete stock location");
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setStockLocationToDelete(null);
    }
  };

  const handleBulkDelete = async () => {
    setIsDeleting(true);
    try {
      const results = await Promise.all(
        selectedRows.map((location) => deleteStockLocationAction(location.id)),
      );

      const failed = results.filter((r) => !r.success).length;
      if (failed === 0) {
        toast.success(`${selectedRows.length} locations deleted successfully`);
      } else {
        toast.warning(
          `${selectedRows.length - failed} locations deleted, ${failed} failed`,
        );
      }
      onRefresh();
    } catch (_error) {
      toast.error("Failed to delete locations");
    } finally {
      setIsDeleting(false);
      setBulkDeleteDialogOpen(false);
      setSelectedRows([]);
    }
  };

  const columns: ColumnDef<StockLocationDTO>[] = [
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
      accessorKey: "code",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Code" />
      ),
      cell: ({ row }) => {
        const code = row.getValue("code") as string;
        return (
          <div className="flex items-center gap-2">
            <Package className="text-muted-foreground h-4 w-4" />
            <span className="font-mono font-medium">{code}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Name" />
      ),
      cell: ({ row }) => {
        const name = row.getValue("name") as string;
        return <span className="font-medium">{name}</span>;
      },
    },
    {
      accessorKey: "locationId",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Physical Location" />
      ),
      cell: ({ row }) => {
        const locationId = row.getValue("locationId") as string | null;
        return locationId ? (
          <div className="flex items-center gap-2">
            <MapPin className="text-muted-foreground h-4 w-4" />
            <Badge variant="outline">Linked</Badge>
          </div>
        ) : (
          <span className="text-muted-foreground text-sm">Not linked</span>
        );
      },
    },
    {
      accessorKey: "description",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Description" />
      ),
      cell: ({ row }) => {
        const description = row.getValue("description") as string | null;
        return description ? (
          <span className="text-muted-foreground line-clamp-2 text-sm">
            {description}
          </span>
        ) : (
          <span className="text-muted-foreground text-sm">—</span>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const stockLocation = row.original;
        const canUpdate = hasPermission(PERMISSIONS.STOCK_LOCATIONS_UPDATE);
        const canDelete = hasPermission(PERMISSIONS.STOCK_LOCATIONS_DELETE);

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
                <DropdownMenuItem onClick={() => onEdit(stockLocation)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
              )}
              {canUpdate && canDelete && <DropdownMenuSeparator />}
              {canDelete && (
                <DropdownMenuItem
                  onClick={() => {
                    setStockLocationToDelete(stockLocation);
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
        searchPlaceholder="Search locations..."
        selectable
        onSelectionChange={setSelectedRows}
        showColumnToggle
        emptyMessage="No stock locations found. Create one to get started!"
        pagination={{
          pageSize: 10,
        }}
        toolbarActions={
          selectedRows.length > 0 &&
          hasPermission(PERMISSIONS.STOCK_LOCATIONS_DELETE) && (
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
              This will permanently delete the stock location &quot;
              {stockLocationToDelete?.name}&quot; ({stockLocationToDelete?.code}
              ). This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                stockLocationToDelete && handleDelete(stockLocationToDelete)
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
              Delete {selectedRows.length} locations?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the selected stock locations. This
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
