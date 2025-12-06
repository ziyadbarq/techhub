/**
 * License Products Table Component
 */

"use client";
"use no memo";

import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";

import { DataTable, DataTableColumnHeader } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";

import type { LicenseProductDTO } from "@/interface-adapters/presenters/license-product.presenter";
import { deleteLicenseProduct } from "@/interface-adapters/controllers/license-product.controller";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { useDeleteDialog } from "@/hooks/use-delete-dialog";
import { useColumnVisibilityEnhanced } from "@/hooks";
import { buildSelectColumn, buildActionsColumn } from "@/lib/table-utils";

interface LicenseProductsTableProps {
  data: LicenseProductDTO[];
  loading?: boolean;
  onEdit: (licenseProduct: LicenseProductDTO) => void;
  onRefresh: () => void;
}

const metricTypeLabels = {
  per_device: "Per Device",
  per_user: "Per User",
  per_core: "Per Core",
  per_vm: "Per VM",
  per_cluster: "Per Cluster",
};

export function LicenseProductsTable({
  data,
  loading = false,
  onEdit,
  onRefresh,
}: LicenseProductsTableProps) {
  // Use reusable hooks
  const deleteDialog = useDeleteDialog<LicenseProductDTO>({
    onDelete: (licenseProduct) => deleteLicenseProduct(licenseProduct.id),
    onSuccess: onRefresh,
    getItemName: (licenseProduct) => licenseProduct.name,
    entityName: "License Product",
  });

  const baseColumns = React.useMemo<ColumnDef<LicenseProductDTO>[]>(
    () => [
      buildSelectColumn<LicenseProductDTO>(),
      {
        accessorKey: "name",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Name" />
        ),
        cell: ({ row }) => {
          const name = row.getValue("name") as string;
          return (
            <div className="flex flex-col gap-1">
              <span className="font-medium">{name}</span>
              <span className="text-muted-foreground text-xs">
                {row.original.code}
              </span>
            </div>
          );
        },
        meta: {
          label: "Name",
        },
      },
      {
        accessorKey: "metricType",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Metric Type" />
        ),
        cell: ({ row }) => {
          const metricType = row.getValue(
            "metricType",
          ) as keyof typeof metricTypeLabels;
          return (
            <Badge variant="secondary">
              {metricTypeLabels[metricType] || metricType}
            </Badge>
          );
        },
        meta: {
          label: "Metric Type",
        },
      },
      {
        accessorKey: "description",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Description" />
        ),
        cell: ({ row }) => {
          const description = row.getValue("description") as string | null;
          return (
            <span className="text-muted-foreground line-clamp-2 text-sm">
              {description || "—"}
            </span>
          );
        },
        meta: {
          label: "Description",
          hiddenByDefault: true,
        },
      },
      {
        accessorKey: "createdAt",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Created" />
        ),
        cell: ({ row }) => {
          const date = row.getValue("createdAt") as Date;
          return (
            <span className="text-muted-foreground text-sm">
              {format(new Date(date), "MMM d, yyyy")}
            </span>
          );
        },
        meta: {
          label: "Created",
          hiddenByDefault: true,
        },
      },
    ],
    [],
  );

  // Actions column using reusable builder
  const actionsColumn = React.useMemo(
    () =>
      buildActionsColumn<LicenseProductDTO>([
        {
          type: "edit",
          label: "Edit",
          permission: PERMISSIONS.LICENSE_PRODUCTS_UPDATE,
          onClick: onEdit,
        },
        {
          type: "delete",
          label: "Delete",
          permission: PERMISSIONS.LICENSE_PRODUCTS_DELETE,
          variant: "destructive",
          separator: true,
          onClick: deleteDialog.openDialog,
        },
      ]),
    [onEdit, deleteDialog.openDialog],
  );

  // Merge static columns + actions column
  const allColumns = React.useMemo(() => {
    return [...baseColumns, actionsColumn];
  }, [baseColumns, actionsColumn]);

  // Column visibility with persistence
  const { visibility, onVisibilityChange } =
    useColumnVisibilityEnhanced<LicenseProductDTO>({
      storageKey: "license-products-table-columns",
      columns: allColumns,
    });

  return (
    <>
      <DataTable
        columns={allColumns}
        data={data}
        loading={loading}
        initialColumnVisibility={visibility}
        onColumnVisibilityChange={onVisibilityChange}
      />

      {/* Delete Confirmation Dialog */}
      <deleteDialog.DialogComponent />
    </>
  );
}
