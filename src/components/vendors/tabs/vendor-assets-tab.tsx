/**
 * Vendor Assets Tab
 *
 * Displays assets purchased from this vendor.
 */

"use no memo";
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { type ColumnDef } from "@tanstack/react-table";
import { Package, DollarSign } from "lucide-react";
import { DataTable, DataTableColumnHeader } from "@/components/ui/data-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  listVendorAssetsAction,
  type VendorAssetDTO,
} from "@/interface-adapters/controllers/vendor-details.controller";
import { formatSAR } from "@/lib/utils";

interface VendorAssetsTabProps {
  vendorId: string;
  totalValue: number;
  assetCount: number;
}

export function VendorAssetsTab({
  vendorId,
  totalValue,
  assetCount,
}: VendorAssetsTabProps) {
  const [assets, setAssets] = useState<VendorAssetDTO[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAssets() {
      if (assetCount === 0) {
        setLoading(false);
        return;
      }
      setLoading(true);
      const result = await listVendorAssetsAction(vendorId);
      if (result.success && result.data) {
        setAssets(result.data);
      }
      setLoading(false);
    }
    loadAssets();
  }, [vendorId, assetCount]);

  const columns: ColumnDef<VendorAssetDTO>[] = [
    {
      accessorKey: "assetTag",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Asset Tag" />
      ),
      cell: ({ row }) => {
        const asset = row.original;
        return (
          <div className="flex flex-col gap-1">
            <Link
              href={`/assets/${asset.assetTag}`}
              className="text-primary font-medium hover:underline"
            >
              {asset.assetTag}
            </Link>
            {asset.serialNumber && (
              <span className="text-muted-foreground text-xs">
                S/N: {asset.serialNumber}
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
      accessorKey: "modelName",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Model" />
      ),
      cell: ({ row }) => {
        const modelName = row.getValue("modelName") as string | null;
        return modelName ? (
          <span className="text-sm">{modelName}</span>
        ) : (
          <span className="text-muted-foreground text-sm">—</span>
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
      accessorKey: "lifecycleState",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="State" />
      ),
      cell: ({ row }) => {
        const state = row.getValue("lifecycleState") as string | null;
        return state ? (
          <Badge variant="secondary">{state}</Badge>
        ) : (
          <span className="text-muted-foreground text-sm">—</span>
        );
      },
      meta: {
        label: "State",
      },
    },
    {
      accessorKey: "locationName",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Location" />
      ),
      cell: ({ row }) => {
        const location = row.getValue("locationName") as string | null;
        return location ? (
          <span className="text-sm">{location}</span>
        ) : (
          <span className="text-muted-foreground text-sm">—</span>
        );
      },
      meta: {
        label: "Location",
      },
    },
    {
      accessorKey: "purchaseCostSar",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Cost" />
      ),
      cell: ({ row }) => {
        const cost = row.getValue("purchaseCostSar") as number | null;
        return cost ? (
          <span className="text-sm font-medium">{formatSAR(cost)}</span>
        ) : (
          <span className="text-muted-foreground text-sm">—</span>
        );
      },
      meta: {
        label: "Cost",
      },
    },
  ];

  if (assetCount === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Package className="text-muted-foreground mb-4 h-12 w-12" />
          <p className="text-muted-foreground mb-4 text-center">
            No assets found for this vendor.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">Loading assets...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardContent className="flex items-center gap-3 pt-4">
            <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-full">
              <Package className="text-primary h-5 w-5" />
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Total Assets</p>
              <p className="text-xl font-semibold">{assetCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-4">
            <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-full">
              <DollarSign className="text-primary h-5 w-5" />
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Total Value</p>
              <p className="text-xl font-semibold">{formatSAR(totalValue)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Assets Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Assets</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={assets}
            loading={loading}
            searchable
            searchKey="assetTag"
            searchPlaceholder="Search assets..."
            emptyMessage="No assets found."
            pagination={{
              pageSize: 10,
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
