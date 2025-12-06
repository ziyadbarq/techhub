"use no memo";

/**
 * License Entitlements Table Component
 */

"use client";

import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Package, CheckCircle2, XCircle, Clock } from "lucide-react";
import { format } from "date-fns";

import { DataTable, DataTableColumnHeader } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { CurrencyDisplay } from "@/components/ui/currency-display";

import type { LicenseEntitlementDTO } from "@/interface-adapters/dtos/generated/license-entitlement.dto";
import type { LicenseProductDTO } from "@/interface-adapters/presenters/license-product.presenter";
import { deleteLicenseEntitlement } from "@/interface-adapters/controllers/license-entitlement.controller";
import { listLicenseProducts } from "@/interface-adapters/controllers/license-product.controller";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { useDeleteDialog } from "@/hooks/use-delete-dialog";
import { useExchangeRates } from "@/hooks/use-exchange-rates";
import { useColumnVisibilityEnhanced } from "@/hooks";
import { buildSelectColumn, buildActionsColumn } from "@/lib/table-utils";

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
  const [products, setProducts] = React.useState<
    Map<string, LicenseProductDTO>
  >(new Map());

  // Use reusable hooks
  const deleteDialog = useDeleteDialog<LicenseEntitlementDTO>({
    onDelete: (entitlement) => deleteLicenseEntitlement(entitlement.id),
    onSuccess: onRefresh,
    getItemName: (entitlement) => {
      const product = products.get(entitlement.licenseProductId);
      return product?.name ?? `Entitlement ${entitlement.id}`;
    },
    entityName: "License Entitlement",
    description:
      "This will permanently delete this license entitlement and all associated allocation records. This action cannot be undone.",
  });

  const { calculateSARAmount } = useExchangeRates();

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

  const baseColumns = React.useMemo<ColumnDef<LicenseEntitlementDTO>[]>(
    () => [
      buildSelectColumn<LicenseEntitlementDTO>(),
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
          label: "Unit Cost",
          hiddenByDefault: true,
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
    ],
    [calculateSARAmount, products],
  );

  // Actions column using reusable builder
  const actionsColumn = React.useMemo(
    () =>
      buildActionsColumn<LicenseEntitlementDTO>([
        {
          type: "view",
          label: "View Details",
          onClick: onView,
        },
        {
          type: "edit",
          label: "Edit",
          permission: PERMISSIONS.LICENSE_ENTITLEMENTS_UPDATE,
          onClick: onEdit,
        },
        {
          type: "delete",
          label: "Delete",
          permission: PERMISSIONS.LICENSE_ENTITLEMENTS_DELETE,
          variant: "destructive",
          separator: true,
          onClick: deleteDialog.openDialog,
        },
      ]),
    [onView, onEdit, deleteDialog.openDialog],
  );

  // Merge static columns + actions column
  const allColumns = React.useMemo(() => {
    return [...baseColumns, actionsColumn];
  }, [baseColumns, actionsColumn]);

  // Column visibility with persistence
  const { visibility, onVisibilityChange } =
    useColumnVisibilityEnhanced<LicenseEntitlementDTO>({
      storageKey: "license-entitlements-table-columns",
      columns: allColumns,
    });

  return (
    <>
      <DataTable
        columns={allColumns}
        data={data}
        loading={loading}
        searchable
        searchPlaceholder="Search entitlements..."
        searchKey="licenseProductId"
        initialColumnVisibility={visibility}
        onColumnVisibilityChange={onVisibilityChange}
      />

      {/* Delete Confirmation Dialog */}
      <deleteDialog.DialogComponent />
    </>
  );
}
