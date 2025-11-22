/**
 * Exchange Rates Table Component
 */

"use client";
"use no memo";

import * as React from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, Trash2, Pencil, TrendingUp } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

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

import type { ExchangeRateResponseDTO } from "@/interface-adapters/presenters/exchange-rate.presenter";
import { deleteExchangeRateAction } from "@/interface-adapters/controllers/exchange-rate.controller";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { usePermissions } from "@/hooks/use-permissions";
import { getCurrencySymbol } from "@/lib/utils";

interface FxRatesTableProps {
  data: ExchangeRateResponseDTO[];
  loading?: boolean;
  onEdit: (rate: ExchangeRateResponseDTO) => void;
  onRefresh: () => void;
}

export function FxRatesTable({
  data,
  loading = false,
  onEdit,
  onRefresh,
}: FxRatesTableProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [rateToDelete, setRateToDelete] =
    React.useState<ExchangeRateResponseDTO | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);

  const { hasPermission } = usePermissions();

  const handleDelete = async (rate: ExchangeRateResponseDTO) => {
    setIsDeleting(true);
    try {
      const result = await deleteExchangeRateAction(rate.id);
      if (result.success) {
        toast.success(
          `Exchange rate for ${rate.currency} deleted successfully`,
        );
        onRefresh();
      } else {
        toast.error(result.error);
      }
    } catch (_error) {
      toast.error("Failed to delete exchange rate");
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setRateToDelete(null);
    }
  };

  const columns: ColumnDef<ExchangeRateResponseDTO>[] = [
    {
      accessorKey: "currency",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Currency" />
      ),
      cell: ({ row }) => {
        const currency = row.getValue("currency") as string;
        const symbol = getCurrencySymbol(currency);
        return (
          <div className="flex flex-col gap-1">
            <span className="font-medium">
              {currency} ({symbol})
            </span>
          </div>
        );
      },
      meta: {
        label: "Currency",
      },
    },
    {
      accessorKey: "rateToSAR",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Rate to SAR" />
      ),
      cell: ({ row }) => {
        const rate = row.getValue("rateToSAR") as number;
        const currency = row.original.currency;
        return (
          <div className="flex items-center gap-2">
            <TrendingUp className="text-muted-foreground h-4 w-4" />
            <span className="font-mono">
              1 {currency} = {rate.toFixed(6)} SAR
            </span>
          </div>
        );
      },
      meta: {
        label: "Rate to SAR",
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
          <Badge variant={isActive ? "default" : "outline"}>
            {isActive ? "Active" : "Inactive"}
          </Badge>
        );
      },
      filterFn: (row, id, value: string) => {
        if (value === "all") return true;
        const isActive = row.getValue(id) as boolean;
        return value === "active" ? isActive : !isActive;
      },
      meta: {
        label: "Status",
        filterOptions: [
          { label: "All", value: "all" },
          { label: "Active", value: "active" },
          { label: "Inactive", value: "inactive" },
        ],
      },
    },
    {
      accessorKey: "updatedAt",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Last Updated" />
      ),
      cell: ({ row }) => {
        const date = row.getValue("updatedAt") as Date;
        return (
          <span className="text-muted-foreground text-sm">
            {format(new Date(date), "MMM d, yyyy")}
          </span>
        );
      },
      meta: {
        label: "Last Updated",
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const rate = row.original;
        const canUpdate = hasPermission(PERMISSIONS.FX_RATES_UPDATE);
        const canDelete = hasPermission(PERMISSIONS.FX_RATES_DELETE);

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
              <DropdownMenuSeparator />
              {canUpdate && (
                <DropdownMenuItem onClick={() => onEdit(rate)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit Rate
                </DropdownMenuItem>
              )}
              {canDelete && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => {
                      setRateToDelete(rate);
                      setDeleteDialogOpen(true);
                    }}
                    className="text-destructive focus:text-destructive"
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
      <DataTable
        columns={columns}
        data={data}
        loading={loading}
        searchKey="currency"
        searchPlaceholder="Search currencies..."
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Exchange Rate?</AlertDialogTitle>
            <AlertDialogDescription>
              This will mark the exchange rate for {rateToDelete?.currency} as
              inactive. This action cannot be undone. Existing asset values in
              this currency will remain unchanged.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => rateToDelete && handleDelete(rateToDelete)}
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
