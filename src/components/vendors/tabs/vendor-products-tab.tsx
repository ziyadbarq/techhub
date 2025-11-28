/**
 * Vendor Products Tab
 *
 * Displays asset models and license products from this vendor.
 */

"use no memo";
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { type ColumnDef } from "@tanstack/react-table";
import { Package, Key } from "lucide-react";
import { DataTable, DataTableColumnHeader } from "@/components/ui/data-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  listVendorAssetModelsAction,
  listVendorLicenseProductsAction,
  type VendorAssetModelDTO,
  type VendorLicenseProductDTO,
} from "@/interface-adapters/controllers/vendor-details.controller";

interface VendorProductsTabProps {
  vendorId: string;
  assetModelsCount: number;
  licenseProductsCount: number;
}

export function VendorProductsTab({
  vendorId,
  assetModelsCount,
  licenseProductsCount,
}: VendorProductsTabProps) {
  const [assetModels, setAssetModels] = useState<VendorAssetModelDTO[]>([]);
  const [licenseProducts, setLicenseProducts] = useState<
    VendorLicenseProductDTO[]
  >([]);
  const [loadingModels, setLoadingModels] = useState(true);
  const [loadingLicenses, setLoadingLicenses] = useState(true);

  useEffect(() => {
    async function loadData() {
      if (assetModelsCount > 0) {
        setLoadingModels(true);
        const result = await listVendorAssetModelsAction(vendorId);
        if (result.success && result.data) {
          setAssetModels(result.data);
        }
        setLoadingModels(false);
      } else {
        setLoadingModels(false);
      }

      if (licenseProductsCount > 0) {
        setLoadingLicenses(true);
        const result = await listVendorLicenseProductsAction(vendorId);
        if (result.success && result.data) {
          setLicenseProducts(result.data);
        }
        setLoadingLicenses(false);
      } else {
        setLoadingLicenses(false);
      }
    }
    loadData();
  }, [vendorId, assetModelsCount, licenseProductsCount]);

  const modelColumns: ColumnDef<VendorAssetModelDTO>[] = [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Model" />
      ),
      cell: ({ row }) => {
        const model = row.original;
        return (
          <div className="flex flex-col gap-1">
            <Link
              href={`/asset-models/${model.id}`}
              className="text-primary font-medium hover:underline"
            >
              {model.name}
            </Link>
            <span className="text-muted-foreground text-xs">{model.code}</span>
          </div>
        );
      },
      meta: {
        label: "Model",
      },
    },
    {
      accessorKey: "categoryName",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Category" />
      ),
      cell: ({ row }) => {
        const category = row.getValue("categoryName") as string | null;
        return category ? (
          <Badge variant="outline">{category}</Badge>
        ) : (
          <span className="text-muted-foreground text-sm">—</span>
        );
      },
      meta: {
        label: "Category",
      },
    },
    {
      accessorKey: "defaultWarrantyMonths",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Warranty" />
      ),
      cell: ({ row }) => {
        const months = row.getValue("defaultWarrantyMonths") as number | null;
        return months ? (
          <span className="text-sm">{months} months</span>
        ) : (
          <span className="text-muted-foreground text-sm">—</span>
        );
      },
      meta: {
        label: "Warranty",
      },
    },
    {
      accessorKey: "assetCount",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Assets" />
      ),
      cell: ({ row }) => {
        const count = row.getValue("assetCount") as number;
        return (
          <Badge variant="secondary">
            {count} asset{count !== 1 ? "s" : ""}
          </Badge>
        );
      },
      meta: {
        label: "Assets",
      },
    },
  ];

  const licenseColumns: ColumnDef<VendorLicenseProductDTO>[] = [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Product" />
      ),
      cell: ({ row }) => {
        const product = row.original;
        return (
          <div className="flex flex-col gap-1">
            <Link
              href={`/licenses/products/${product.id}`}
              className="text-primary font-medium hover:underline"
            >
              {product.name}
            </Link>
            <span className="text-muted-foreground text-xs">
              {product.code}
            </span>
          </div>
        );
      },
      meta: {
        label: "Product",
      },
    },
    {
      accessorKey: "metricType",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Metric Type" />
      ),
      cell: ({ row }) => {
        const metricType = row.getValue("metricType") as string;
        return <Badge variant="outline">{metricType}</Badge>;
      },
      meta: {
        label: "Metric Type",
      },
    },
    {
      accessorKey: "entitlementCount",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Entitlements" />
      ),
      cell: ({ row }) => {
        const count = row.getValue("entitlementCount") as number;
        return (
          <Badge variant="secondary">
            {count} entitlement{count !== 1 ? "s" : ""}
          </Badge>
        );
      },
      meta: {
        label: "Entitlements",
      },
    },
  ];

  const hasNoProducts = assetModelsCount === 0 && licenseProductsCount === 0;

  if (hasNoProducts) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Package className="text-muted-foreground mb-4 h-12 w-12" />
          <p className="text-muted-foreground mb-4 text-center">
            No products found for this vendor.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Asset Models Section */}
      {assetModelsCount > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Package className="h-4 w-4" />
              Asset Models
              <Badge variant="secondary" className="ml-2">
                {assetModelsCount}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={modelColumns}
              data={assetModels}
              loading={loadingModels}
              searchable
              searchKey="name"
              searchPlaceholder="Search models..."
              emptyMessage="No asset models found."
              pagination={{
                pageSize: 5,
              }}
            />
          </CardContent>
        </Card>
      )}

      {/* License Products Section */}
      {licenseProductsCount > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Key className="h-4 w-4" />
              License Products
              <Badge variant="secondary" className="ml-2">
                {licenseProductsCount}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={licenseColumns}
              data={licenseProducts}
              loading={loadingLicenses}
              searchable
              searchKey="name"
              searchPlaceholder="Search license products..."
              emptyMessage="No license products found."
              pagination={{
                pageSize: 5,
              }}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
