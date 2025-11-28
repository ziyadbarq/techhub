/**
 * Category Models Tab
 * Displays all asset models belonging to this category
 */

"use no memo";
"use client";

import Link from "next/link";
import { type ColumnDef } from "@tanstack/react-table";
import { Building2, Package, Plus } from "lucide-react";
import { format } from "date-fns";

import { DataTable, DataTableColumnHeader } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { EntityDisplay } from "@/components/ui/entity-display";
import type { AssetModelDTO } from "@/interface-adapters/presenters/asset-model.presenter";
import { usePermissions } from "@/hooks/use-permissions";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";

interface CategoryModelsTabProps {
  models: AssetModelDTO[];
  categoryId: string;
  onCreateModel?: () => void;
}

export function CategoryModelsTab({
  models,
  categoryId: _categoryId,
  onCreateModel,
}: CategoryModelsTabProps) {
  const { hasPermission } = usePermissions();
  const canCreateModels = hasPermission(PERMISSIONS.ASSET_MODELS_CREATE);

  const columns: ColumnDef<AssetModelDTO>[] = [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Model" />
      ),
      cell: ({ row }) => {
        const name = row.getValue("name") as string;
        return (
          <div className="flex flex-col gap-1">
            <Link
              href={`/asset-models/${row.original.id}`}
              className="text-primary font-medium hover:underline"
            >
              {name}
            </Link>
            <span className="text-muted-foreground text-xs">
              {row.original.code}
            </span>
          </div>
        );
      },
      meta: {
        label: "Model",
      },
    },
    {
      accessorKey: "vendorId",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Manufacturer" />
      ),
      cell: ({ row }) => (
        <EntityDisplay name={row.original.vendorName} icon={Building2} />
      ),
      meta: {
        label: "Manufacturer",
      },
    },
    {
      accessorKey: "defaultWarrantyMonths",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Warranty" />
      ),
      cell: ({ row }) => {
        const months = row.getValue("defaultWarrantyMonths") as number | null;
        if (!months) {
          return <span className="text-muted-foreground text-sm">—</span>;
        }
        const years = Math.floor(months / 12);
        const remainingMonths = months % 12;
        const parts = [];
        if (years > 0) parts.push(`${years}y`);
        if (remainingMonths > 0) parts.push(`${remainingMonths}m`);
        return (
          <Badge variant="secondary" className="text-xs">
            {parts.join(" ")}
          </Badge>
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
  ];

  if (models.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Package className="text-muted-foreground mb-4 h-12 w-12" />
          <p className="text-muted-foreground mb-4 text-center">
            No models in this category yet.
          </p>
          {canCreateModels && onCreateModel && (
            <Button onClick={onCreateModel}>
              <Plus className="mr-2 h-4 w-4" />
              Create Model
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {canCreateModels && onCreateModel && (
        <div className="flex justify-end">
          <Button onClick={onCreateModel}>
            <Plus className="mr-2 h-4 w-4" />
            Create Model
          </Button>
        </div>
      )}
      <DataTable columns={columns} data={models} />
    </div>
  );
}
