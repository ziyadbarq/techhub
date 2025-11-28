/**
 * Category Assets Tab
 * Displays all assets belonging to this category
 */

"use no memo";
"use client";

import Link from "next/link";
import { type ColumnDef } from "@tanstack/react-table";
import { Package, MapPin, Shield, Plus } from "lucide-react";
import { format } from "date-fns";

import { DataTable, DataTableColumnHeader } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { AssetDTO } from "@/interface-adapters/presenters/asset.presenter";
import { usePermissions } from "@/hooks/use-permissions";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";

interface CategoryAssetsTabProps {
  assets: AssetDTO[];
  categoryId: string;
}

const conditionVariants: Record<
  string,
  "default" | "secondary" | "outline" | "destructive"
> = {
  NEW: "default",
  GOOD: "secondary",
  FAIR: "outline",
  POOR: "destructive",
};

export function CategoryAssetsTab({ assets }: CategoryAssetsTabProps) {
  const { hasPermission } = usePermissions();
  const canCreateAssets = hasPermission(PERMISSIONS.ASSETS_CREATE);

  const columns: ColumnDef<AssetDTO>[] = [
    {
      accessorKey: "assetTag",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Asset Tag" />
      ),
      cell: ({ row }) => {
        const assetTag = row.getValue("assetTag") as string;
        return (
          <div className="flex flex-col gap-1">
            <Link
              href={`/assets/${assetTag}`}
              className="text-primary font-mono font-medium hover:underline"
            >
              {assetTag}
            </Link>
            {row.original.serialNumber && (
              <span className="text-muted-foreground text-xs">
                S/N: {row.original.serialNumber}
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
        const modelName = row.original.modelName;
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
      accessorKey: "condition",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Condition" />
      ),
      cell: ({ row }) => {
        const condition = row.getValue("condition") as string | null;
        if (!condition) {
          return <span className="text-muted-foreground text-sm">—</span>;
        }
        return (
          <Badge variant={conditionVariants[condition] || "outline"}>
            {condition}
          </Badge>
        );
      },
      meta: {
        label: "Condition",
      },
    },
    {
      accessorKey: "stockLocationName",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Location" />
      ),
      cell: ({ row }) => {
        const location = row.original.stockLocationName;
        return location ? (
          <div className="flex items-center gap-1.5">
            <MapPin className="text-muted-foreground h-3.5 w-3.5" />
            <span className="text-sm">{location}</span>
          </div>
        ) : (
          <span className="text-muted-foreground text-sm">—</span>
        );
      },
      meta: {
        label: "Location",
      },
    },
    {
      accessorKey: "isUnderWarranty",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Warranty" />
      ),
      cell: ({ row }) => {
        const isUnderWarranty = row.original.isUnderWarranty;
        const warrantyEndDate = row.original.warrantyEndDate;
        if (!warrantyEndDate) {
          return <span className="text-muted-foreground text-sm">—</span>;
        }
        return (
          <div className="flex items-center gap-1.5">
            <Shield
              className={`h-3.5 w-3.5 ${isUnderWarranty ? "text-green-500" : "text-muted-foreground"}`}
            />
            <span className="text-sm">
              {isUnderWarranty ? "Active" : "Expired"}
            </span>
          </div>
        );
      },
      meta: {
        label: "Warranty",
      },
    },
    {
      accessorKey: "lifecycleStateName",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Status" />
      ),
      cell: ({ row }) => {
        const state = row.original.lifecycleStateName;
        return state ? (
          <Badge variant="outline">{state}</Badge>
        ) : (
          <span className="text-muted-foreground text-sm">—</span>
        );
      },
      meta: {
        label: "Status",
      },
    },
    {
      accessorKey: "purchaseDate",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Purchased" />
      ),
      cell: ({ row }) => {
        const purchaseDate = row.getValue("purchaseDate") as string | null;
        return purchaseDate ? (
          <span className="text-muted-foreground text-sm">
            {format(new Date(purchaseDate), "MMM d, yyyy")}
          </span>
        ) : (
          <span className="text-muted-foreground text-sm">—</span>
        );
      },
      meta: {
        label: "Purchased",
      },
    },
  ];

  if (assets.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Package className="text-muted-foreground mb-4 h-12 w-12" />
          <p className="text-muted-foreground mb-4 text-center">
            No assets in this category yet.
          </p>
          {canCreateAssets && (
            <Button asChild>
              <Link href="/assets?action=create">
                <Plus className="mr-2 h-4 w-4" />
                Create Asset
              </Link>
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {canCreateAssets && (
        <div className="flex justify-end">
          <Button asChild>
            <Link href="/assets?action=create">
              <Plus className="mr-2 h-4 w-4" />
              Create Asset
            </Link>
          </Button>
        </div>
      )}
      <DataTable columns={columns} data={assets} />
    </div>
  );
}
