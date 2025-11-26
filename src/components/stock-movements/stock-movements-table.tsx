/**
 * Stock Movements Table Component
 * Displays stock movements with filtering, sorting, and actions
 */

"use client";

import * as React from "react";
import { type ColumnDef } from "@tanstack/react-table";
import {
  MoreHorizontal,
  Trash2,
  ArrowDownToLine,
  ArrowUpFromLine,
  ArrowRightLeft,
  Settings,
  Tag,
  Warehouse,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

import { DataTable, DataTableColumnHeader } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { EntityDisplay } from "@/components/ui/entity-display";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
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

import type { StockMovementDTO } from "@/interface-adapters/presenters/stock-movement.presenter";
import { deleteStockMovementAction } from "@/interface-adapters/controllers/stock-movement.controller";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { usePermissions } from "@/hooks/use-permissions";

interface StockMovementsTableProps {
  data: StockMovementDTO[];
  loading?: boolean;
  onRefresh: () => void;
}

const MovementTypeIcon = ({ type }: { type: string }) => {
  switch (type) {
    case "IN":
      return <ArrowDownToLine className="h-4 w-4" />;
    case "OUT":
      return <ArrowUpFromLine className="h-4 w-4" />;
    case "TRANSFER":
      return <ArrowRightLeft className="h-4 w-4" />;
    case "ADJUSTMENT":
      return <Settings className="h-4 w-4" />;
    default:
      return null;
  }
};

export function StockMovementsTable({
  data,
  loading = false,
  onRefresh,
}: StockMovementsTableProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [stockMovementToDelete, setStockMovementToDelete] =
    React.useState<StockMovementDTO | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);

  const { hasPermission } = usePermissions();

  const handleDelete = async (stockMovement: StockMovementDTO) => {
    setIsDeleting(true);
    try {
      const result = await deleteStockMovementAction(stockMovement.id);
      if (result.success) {
        toast.success("Stock movement deleted successfully");
        onRefresh();
      } else {
        toast.error(result.error);
      }
    } catch (_error) {
      toast.error("Failed to delete stock movement");
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setStockMovementToDelete(null);
    }
  };

  const columns: ColumnDef<StockMovementDTO>[] = [
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
      accessorKey: "movementType",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Type" />
      ),
      cell: ({ row }) => {
        const type = row.getValue("movementType") as string;
        const movement = row.original;

        let colorClass = "";
        if (movement.isReceiving) {
          colorClass = "bg-green-500/10 text-green-700 dark:text-green-400";
        } else if (movement.isIssuing) {
          colorClass = "bg-blue-500/10 text-blue-700 dark:text-blue-400";
        } else if (movement.isTransfer) {
          colorClass = "bg-purple-500/10 text-purple-700 dark:text-purple-400";
        } else if (movement.isAdjustment) {
          colorClass = "bg-orange-500/10 text-orange-700 dark:text-orange-400";
        }

        return (
          <Badge variant="outline" className={`gap-1.5 ${colorClass}`}>
            <MovementTypeIcon type={type} />
            {type}
          </Badge>
        );
      },
      meta: {
        label: "Type",
      },
    },
    {
      accessorKey: "assetTag",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Asset" />
      ),
      cell: ({ row }) => (
        <EntityDisplay name={row.original.assetTag} icon={Tag} />
      ),
      meta: {
        label: "Asset",
      },
    },
    {
      accessorKey: "quantity",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Quantity" />
      ),
      cell: ({ row }) => {
        const quantity = row.getValue("quantity") as number;
        return <span className="font-medium">{quantity}</span>;
      },
      meta: {
        label: "Quantity",
      },
    },
    {
      accessorKey: "stockLocationFromName",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="From" />
      ),
      cell: ({ row }) => (
        <EntityDisplay
          name={row.original.stockLocationFromName}
          icon={Warehouse}
        />
      ),
      meta: {
        label: "From",
      },
    },
    {
      accessorKey: "stockLocationToName",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="To" />
      ),
      cell: ({ row }) => (
        <EntityDisplay
          name={row.original.stockLocationToName}
          icon={Warehouse}
        />
      ),
      meta: {
        label: "To",
      },
    },
    {
      accessorKey: "reason",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Reason" />
      ),
      cell: ({ row }) => {
        const reason = row.getValue("reason") as string | null;
        return (
          <span className="text-muted-foreground block max-w-[200px] truncate text-sm">
            {reason || "—"}
          </span>
        );
      },
      meta: {
        label: "Reason",
      },
    },
    {
      accessorKey: "occurredAt",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Occurred" />
      ),
      cell: ({ row }) => {
        const occurredAt = row.getValue("occurredAt") as string;
        return (
          <span className="text-muted-foreground text-sm">
            {format(new Date(occurredAt), "MMM d, yyyy HH:mm")}
          </span>
        );
      },
      meta: {
        label: "Occurred",
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const stockMovement = row.original;
        const canDelete = hasPermission(PERMISSIONS.STOCK_MOVEMENTS_DELETE);

        if (!canDelete) {
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
              <DropdownMenuItem
                onClick={() => {
                  setStockMovementToDelete(stockMovement);
                  setDeleteDialogOpen(true);
                }}
                className="text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete (Correction)
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
        searchKey="reason"
        searchPlaceholder="Search by reason..."
        selectable
        showColumnToggle
        emptyMessage="No stock movements found. Create one to get started!"
        pagination={{
          pageSize: 20,
        }}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Stock Movement?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this stock movement record. This
              action should only be used for corrections and cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (stockMovementToDelete) {
                  handleDelete(stockMovementToDelete);
                }
              }}
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
