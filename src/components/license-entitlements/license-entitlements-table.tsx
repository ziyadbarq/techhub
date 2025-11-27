"use no memo";

/**
 * License Entitlements Table Component
 */

"use client";

import * as React from "react";
import { type ColumnDef } from "@tanstack/react-table";
import {
  MoreHorizontal,
  Trash2,
  Pencil,
  Eye,
  Package,
  CheckCircle2,
  XCircle,
  Clock,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

import { DataTable, DataTableColumnHeader } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { CurrencyDisplay } from "@/components/ui/currency-display";
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

import type { LicenseEntitlementDTO } from "@/interface-adapters/dtos/generated/license-entitlement.dto";
import type { LicenseProductDTO } from "@/interface-adapters/presenters/license-product.presenter";
import { deleteLicenseEntitlement } from "@/interface-adapters/controllers/license-entitlement.controller";
import { listLicenseProducts } from "@/interface-adapters/controllers/license-product.controller";
import { listExchangeRatesAction } from "@/interface-adapters/controllers/exchange-rate.controller";
import type { ExchangeRateResponseDTO } from "@/interface-adapters/presenters/exchange-rate.presenter";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { usePermissions } from "@/hooks/use-permissions";

interface LicenseEntitlementsTableProps {
  data: LicenseEntitlementDTO[];
  loading?: boolean;
  onEdit: (entitlement: LicenseEntitlementDTO) => void;
  onView: (entitlement: LicenseEntitlementDTO) => void;
  onRefresh: () => void;
}

export function LicenseEntitlementsTable({
  data,
  loading = false,
  onEdit,
  onView,
  onRefresh,
}: LicenseEntitlementsTableProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [entitlementToDelete, setEntitlementToDelete] =
    React.useState<LicenseEntitlementDTO | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [products, setProducts] = React.useState<
    Map<string, LicenseProductDTO>
  >(new Map());
  const [exchangeRates, setExchangeRates] = React.useState<
    Map<string, ExchangeRateResponseDTO>
  >(new Map());

  const { hasPermission } = usePermissions();
  const canEdit = hasPermission(PERMISSIONS.LICENSE_ENTITLEMENTS_UPDATE);
  const canDelete = hasPermission(PERMISSIONS.LICENSE_ENTITLEMENTS_DELETE);

  // Load products for display
  React.useEffect(() => {
    async function loadProducts() {
      try {
        const result = await listLicenseProducts();
        if (result.success) {
          const productMap = new Map<string, LicenseProductDTO>();
          for (const product of result.data) {
            productMap.set(product.id, product);
          }
          setProducts(productMap);
        }
      } catch {
        // Silent fail
      }
    }
    void loadProducts();
  }, []);

  // Load exchange rates for currency conversion
  React.useEffect(() => {
    async function loadRates() {
      try {
        const result = await listExchangeRatesAction({ onlyActive: true });
        if (result.success && result.data) {
          const rateMap = new Map<string, ExchangeRateResponseDTO>();
          for (const rate of result.data) {
            rateMap.set(rate.currency, rate);
          }
          setExchangeRates(rateMap);
        }
      } catch {
        // Silent fail
      }
    }
    void loadRates();
  }, []);

  const calculateSARAmount = (
    amount: number,
    currency: string,
  ): { sarAmount?: number; exchangeRate?: number } => {
    if (currency === "SAR") {
      return { sarAmount: amount, exchangeRate: 1.0 };
    }
    const rate = exchangeRates.get(currency);
    if (!rate) {
      return {};
    }
    return { sarAmount: amount * rate.rateToSAR, exchangeRate: rate.rateToSAR };
  };

  const handleDelete = async (entitlement: LicenseEntitlementDTO) => {
    setIsDeleting(true);
    try {
      const result = await deleteLicenseEntitlement(entitlement.id);
      if (result.success) {
        toast.success("License entitlement deleted successfully");
        onRefresh();
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error("Failed to delete license entitlement");
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setEntitlementToDelete(null);
    }
  };

  const getStatusBadge = (entitlement: LicenseEntitlementDTO) => {
    if (entitlement.isExpired) {
      return (
        <Badge variant="destructive" className="gap-1">
          <XCircle className="h-3 w-3" />
          Expired
        </Badge>
      );
    }
    if (entitlement.isActive) {
      return (
        <Badge variant="default" className="gap-1 bg-green-600">
          <CheckCircle2 className="h-3 w-3" />
          Active
        </Badge>
      );
    }
    return (
      <Badge variant="secondary" className="gap-1">
        <Clock className="h-3 w-3" />
        Pending
      </Badge>
    );
  };

  const columns: ColumnDef<LicenseEntitlementDTO>[] = [
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
      accessorKey: "licenseProductId",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="License Product" />
      ),
      cell: ({ row }) => {
        const product = products.get(row.original.licenseProductId);
        return (
          <div className="flex items-center gap-2">
            <Package className="text-muted-foreground h-4 w-4" />
            <div>
              <div className="font-medium">
                {product?.name ?? "Unknown Product"}
              </div>
              <div className="text-muted-foreground text-xs">
                {product?.code ?? "-"}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "purchasedQuantity",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Quantity" />
      ),
      cell: ({ row }) => (
        <div className="text-right font-medium">
          {row.original.purchasedQuantity.toLocaleString()}
        </div>
      ),
    },
    {
      accessorKey: "effectiveStart",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Effective Period" />
      ),
      cell: ({ row }) => {
        const start = new Date(row.original.effectiveStart);
        const end = row.original.effectiveEnd
          ? new Date(row.original.effectiveEnd)
          : null;
        return (
          <div className="text-sm">
            <div>{format(start, "MMM d, yyyy")}</div>
            <div className="text-muted-foreground">
              {end ? `to ${format(end, "MMM d, yyyy")}` : "Perpetual"}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "unitCost",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Unit Cost" />
      ),
      cell: ({ row }) => {
        const cost = row.original.unitCost;
        const currency = row.original.currency ?? "SAR";

        if (cost === null || cost === undefined) {
          return (
            <span className="text-muted-foreground text-sm">Not tracked</span>
          );
        }

        const { sarAmount, exchangeRate } = calculateSARAmount(cost, currency);

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
    },
    {
      accessorKey: "totalCost",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Total Cost" />
      ),
      cell: ({ row }) => {
        const totalCost = row.original.totalCost;
        const currency = row.original.currency ?? "SAR";

        if (totalCost === null || totalCost === undefined) {
          return <span className="text-muted-foreground text-sm">-</span>;
        }

        const { sarAmount, exchangeRate } = calculateSARAmount(
          totalCost,
          currency,
        );

        return (
          <CurrencyDisplay
            amount={totalCost}
            currency={currency}
            sarAmount={sarAmount}
            exchangeRate={exchangeRate}
            mode="dual"
            className="text-sm font-medium"
          />
        );
      },
    },
    {
      accessorKey: "isActive",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Status" />
      ),
      cell: ({ row }) => getStatusBadge(row.original),
      filterFn: (row, id, value) => {
        return value.includes(String(row.getValue(id)));
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const entitlement = row.original;

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
              <DropdownMenuItem onClick={() => onView(entitlement)}>
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
              {canEdit && (
                <DropdownMenuItem onClick={() => onEdit(entitlement)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
              )}
              {canDelete && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={() => {
                      setEntitlementToDelete(entitlement);
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
      <DataTable
        columns={columns}
        data={data}
        loading={loading}
        searchable
        searchPlaceholder="Search entitlements..."
        searchKey="licenseProductId"
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete License Entitlement</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this license entitlement? This
              action cannot be undone and will remove all associated allocation
              records.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                entitlementToDelete && handleDelete(entitlementToDelete)
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
