/**
 * Model Assets Tab
 * Displays a table of assets using this model
 */

"use client";

import Link from "next/link";
import { format } from "date-fns";
import { type ColumnDef } from "@tanstack/react-table";
import { ExternalLink, Package } from "lucide-react";

import { DataTable, DataTableColumnHeader } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { AssetDTO } from "@/interface-adapters/presenters/asset.presenter";

interface ModelAssetsTabProps {
  assets: AssetDTO[];
  modelId: string;
}

export function ModelAssetsTab({ assets, modelId }: ModelAssetsTabProps) {
  const columns: ColumnDef<AssetDTO>[] = [
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
    },
    {
      accessorKey: "condition",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Condition" />
      ),
      cell: ({ row }) => {
        const condition = row.getValue("condition") as string | null;
        if (!condition) {
          return <span className="text-muted-foreground">—</span>;
        }

        const conditionVariant: Record<
          string,
          "default" | "secondary" | "outline" | "destructive"
        > = {
          NEW: "default",
          GOOD: "secondary",
          FAIR: "outline",
          POOR: "destructive",
        };

        return (
          <Badge variant={conditionVariant[condition] || "outline"}>
            {condition}
          </Badge>
        );
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
            {locationName || (
              <span className="text-muted-foreground">Not assigned</span>
            )}
          </span>
        );
      },
    },
    {
      accessorKey: "lifecycleStateName",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Lifecycle State" />
      ),
      cell: ({ row }) => {
        const stateName = row.original.lifecycleStateName;
        return (
          <span className="text-sm">
            {stateName || (
              <span className="text-muted-foreground">Not set</span>
            )}
          </span>
        );
      },
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Added" />
      ),
      cell: ({ row }) => {
        const createdAt = row.getValue("createdAt") as string;
        return (
          <span className="text-muted-foreground text-sm">
            {format(new Date(createdAt), "MMM d, yyyy")}
          </span>
        );
      },
    },
  ];

  if (assets.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Package className="text-muted-foreground mb-4 h-12 w-12" />
          <p className="text-muted-foreground text-center">
            No assets are using this model yet.
          </p>
          <Button variant="outline" className="mt-4" asChild>
            <Link href={`/assets?assetModelId=${modelId}`}>
              <ExternalLink className="mr-2 h-4 w-4" />
              View All Assets
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Assets Using This Model</CardTitle>
            <CardDescription>
              {assets.length} asset{assets.length !== 1 ? "s" : ""} found
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/assets?assetModelId=${modelId}`}>
              <ExternalLink className="mr-2 h-4 w-4" />
              View in Assets
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <DataTable columns={columns} data={assets} />
      </CardContent>
    </Card>
  );
}
