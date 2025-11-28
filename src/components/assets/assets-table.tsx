/**
 * Assets Table Component
 */

"use client";

import * as React from "react";
import Link from "next/link";
import { type ColumnDef } from "@tanstack/react-table";
import {
  MoreHorizontal,
  Trash2,
  Pencil,
  CheckCircle2,
  XCircle,
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
import { CurrencyDisplay } from "@/components/ui/currency-display";

import type { AssetDTO } from "@/interface-adapters/presenters/asset.presenter";
import { deleteAssetAction } from "@/interface-adapters/controllers/asset.controller";
import { listExchangeRatesAction } from "@/interface-adapters/controllers/exchange-rate.controller";
import type { ExchangeRateResponseDTO } from "@/interface-adapters/presenters/exchange-rate.presenter";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { usePermissions } from "@/hooks/use-permissions";
import { useCustomFieldColumns } from "./custom-field-columns";

interface AssetsTableProps {
  data: AssetDTO[];
  loading?: boolean;
  onEdit: (asset: AssetDTO) => void;
  onRefresh: () => void;
}

export function AssetsTable({
  data,
  loading = false,
  onEdit,
  onRefresh,
}: AssetsTableProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [assetToDelete, setAssetToDelete] = React.useState<AssetDTO | null>(
    null,
  );
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [exchangeRates, setExchangeRates] = React.useState<
    Map<string, ExchangeRateResponseDTO>
  >(new Map());

  const { hasPermission } = usePermissions();

  // Fetch custom field columns based on asset categories
  const { columns: customFieldColumns, isLoading: loadingCustomFields } =
    useCustomFieldColumns(data);

  // Fetch exchange rates on mount
  React.useEffect(() => {
    async function fetchExchangeRates() {
      try {
        const result = await listExchangeRatesAction({ onlyActive: true });
        if (result.success && result.data) {
          const ratesMap = new Map<string, ExchangeRateResponseDTO>();
          result.data.forEach((rate) => {
            ratesMap.set(rate.currency, rate);
          });
          setExchangeRates(ratesMap);
        }
      } catch (error) {
        // Silently fail - the table will still work with single currency display
        console.error("Failed to fetch exchange rates:", error);
      }
    }

    fetchExchangeRates();
  }, []);

  // Helper function to calculate SAR conversion
  const calculateSARAmount = React.useCallback(
    (
      amount: number,
      currency: string,
    ): { sarAmount?: number; exchangeRate?: number } => {
      // If already in SAR, no conversion needed
      if (currency === "SAR") {
        return { sarAmount: amount, exchangeRate: 1.0 };
      }

      // Get exchange rate for the currency
      const rate = exchangeRates.get(currency);
      if (!rate) {
        return {}; // No conversion available
      }

      // Calculate SAR amount
      const sarAmount = amount * rate.rateToSAR;
      return { sarAmount, exchangeRate: rate.rateToSAR };
    },
    [exchangeRates],
  );

  const handleDelete = async (asset: AssetDTO) => {
    setIsDeleting(true);
    try {
      const result = await deleteAssetAction(asset.assetTag);
      if (result.success) {
        toast.success("Asset deleted successfully");
        onRefresh();
      } else {
        toast.error(result.error);
      }
    } catch (_error) {
      toast.error("Failed to delete asset");
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setAssetToDelete(null);
    }
  };

  const baseColumns = React.useMemo<ColumnDef<AssetDTO>[]>(
    () => [
      {
        id: "select",
        header: ({ table }) => (
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && "indeterminate")
            }
            onCheckedChange={(value) =>
              table.toggleAllPageRowsSelected(!!value)
            }
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
        accessorKey: "assetTag",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Asset Tag" />
        ),
        cell: ({ row }) => {
          const asset = row.original;
          const assetTag = row.getValue("assetTag") as string;
          const serialNumber = asset.serialNumber;
          return (
            <div className="flex flex-col gap-1">
              <Link
                href={`/assets/${asset.assetTag}`}
                className="text-primary font-medium hover:underline"
              >
                {assetTag}
              </Link>
              {serialNumber && (
                <span className="text-muted-foreground text-xs">
                  S/N: {serialNumber}
                </span>
              )}
            </div>
          );
        },
        meta: {
          label: "Asset Tag",
        },
      },
      {
        accessorKey: "categoryName",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Category" />
        ),
        cell: ({ row }) => {
          const categoryName = row.original.categoryName;
          return (
            <span className="text-sm">
              {categoryName || <span className="text-muted-foreground">—</span>}
            </span>
          );
        },
        meta: {
          label: "Category",
        },
      },
      {
        accessorKey: "modelName",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Model" />
        ),
        cell: ({ row }) => {
          const modelName = row.original.modelName;
          const vendorName = row.original.vendorName;

          if (!modelName && !vendorName) {
            return <span className="text-muted-foreground text-sm">—</span>;
          }

          return (
            <div className="flex flex-col gap-1">
              {modelName && <span className="text-sm">{modelName}</span>}
              {vendorName && (
                <span className="text-muted-foreground text-xs">
                  {vendorName}
                </span>
              )}
            </div>
          );
        },
        meta: {
          label: "Model",
        },
      },
      {
        accessorKey: "stockLocationName",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Location" />
        ),
        cell: ({ row }) => {
          const locationName = row.original.stockLocationName;
          return (
            <span className="text-sm">
              {locationName || <span className="text-muted-foreground">—</span>}
            </span>
          );
        },
        meta: {
          label: "Location",
        },
      },
      {
        accessorKey: "lifecycleStateName",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Status" />
        ),
        cell: ({ row }) => {
          const stateName = row.original.lifecycleStateName;
          return (
            <span className="text-sm">
              {stateName || <span className="text-muted-foreground">—</span>}
            </span>
          );
        },
        meta: {
          label: "Status",
        },
      },
      {
        accessorKey: "purchaseDate",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Purchase Date" />
        ),
        cell: ({ row }) => {
          const purchaseDate = row.getValue("purchaseDate") as string | null;
          if (!purchaseDate) {
            return <span className="text-muted-foreground text-sm">—</span>;
          }
          return (
            <span className="text-sm">
              {format(new Date(purchaseDate), "MMM d, yyyy")}
            </span>
          );
        },
        meta: {
          label: "Purchase Date",
        },
      },
      {
        accessorKey: "purchaseCost",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Cost" />
        ),
        cell: ({ row }) => {
          const cost = row.getValue("purchaseCost") as number | null;
          const currency = row.original.currency || "SAR";

          if (!cost) {
            return <span className="text-muted-foreground text-sm">—</span>;
          }

          // Calculate SAR conversion
          const { sarAmount, exchangeRate } = calculateSARAmount(
            cost,
            currency,
          );

          return (
            <CurrencyDisplay
              amount={cost}
              currency={currency}
              sarAmount={sarAmount}
              exchangeRate={exchangeRate}
              mode="dual"
              className="text-sm"
            />
          );
        },
        meta: {
          label: "Cost",
        },
      },
      {
        accessorKey: "isUnderWarranty",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Warranty" />
        ),
        cell: ({ row }) => {
          const isUnderWarranty = row.getValue("isUnderWarranty") as boolean;
          const warrantyEndDate = row.original.warrantyEndDate;

          if (!warrantyEndDate) {
            return <span className="text-muted-foreground text-sm">—</span>;
          }

          return (
            <div className="flex items-center gap-2">
              {isUnderWarranty ? (
                <Badge variant="default" className="gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Active
                </Badge>
              ) : (
                <Badge variant="secondary" className="gap-1">
                  <XCircle className="h-3 w-3" />
                  Expired
                </Badge>
              )}
            </div>
          );
        },
        meta: {
          label: "Warranty",
        },
      },
      {
        accessorKey: "createdAt",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Created" />
        ),
        cell: ({ row }) => {
          const createdAt = row.getValue("createdAt") as string;
          return (
            <span className="text-muted-foreground text-sm">
              {format(new Date(createdAt), "MMM d, yyyy")}
            </span>
          );
        },
        meta: {
          label: "Created",
        },
      },
    ],
    [calculateSARAmount],
  );

  // Actions column defined separately so we can append it after custom columns
  const actionsColumn = React.useMemo<ColumnDef<AssetDTO>>(
    () => ({
      id: "actions",
      cell: ({ row }) => {
        const asset = row.original;
        const canUpdate = hasPermission(PERMISSIONS.ASSETS_UPDATE);
        const canDelete = hasPermission(PERMISSIONS.ASSETS_DELETE);

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
                <DropdownMenuItem onClick={() => onEdit(asset)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
              )}
              {canDelete && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => {
                      setAssetToDelete(asset);
                      setDeleteDialogOpen(true);
                    }}
                    className="text-destructive"
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
    }),
    [hasPermission, onEdit],
  );

  // Merge static columns + custom field columns + actions column
  const allColumns = React.useMemo(() => {
    return [...baseColumns, ...customFieldColumns, actionsColumn];
  }, [baseColumns, customFieldColumns, actionsColumn]);

  // Build initial column visibility - hide custom columns by default
  const initialColumnVisibility = React.useMemo(() => {
    const visibility: Record<string, boolean> = {
      stockLocationName: false,
      purchaseDate: false,
      purchaseCost: false,
      isUnderWarranty: false,
    };
    // Hide all custom field columns by default
    for (const col of customFieldColumns) {
      if (col.id) {
        visibility[col.id] = false;
      }
    }
    return visibility;
  }, [customFieldColumns]);

  return (
    <>
      <DataTable
        columns={allColumns}
        data={data}
        loading={loading || loadingCustomFields}
        initialColumnVisibility={initialColumnVisibility}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Asset?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete asset &quot;{assetToDelete?.assetTag}
              &quot;. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (assetToDelete) {
                  handleDelete(assetToDelete);
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
