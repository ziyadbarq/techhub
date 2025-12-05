/**
 * Vendors Table Component
 */

"use client";
"use no memo";

import * as React from "react";
import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import { ExternalLink } from "lucide-react";
import { format } from "date-fns";

import { DataTable, DataTableColumnHeader } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";

import type { VendorDTO } from "@/interface-adapters/presenters/vendor.presenter";
import { deleteVendorAction } from "@/interface-adapters/controllers/vendor.controller";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { useDeleteDialog } from "@/hooks/use-delete-dialog";
import { buildSelectColumn, buildActionsColumn } from "@/lib/table-utils";

interface VendorsTableProps {
  data: VendorDTO[];
  loading?: boolean;
  onEdit: (vendor: VendorDTO) => void;
  onRefresh: () => void;
}

export function VendorsTable({
  data,
  loading = false,
  onEdit,
  onRefresh,
}: VendorsTableProps) {
  // Use reusable hooks
  const deleteDialog = useDeleteDialog<VendorDTO>({
    onDelete: (vendor) => deleteVendorAction(vendor.id),
    onSuccess: onRefresh,
    getItemName: (vendor) => vendor.name,
    entityName: "Vendor",
  });

  const baseColumns = React.useMemo<ColumnDef<VendorDTO>[]>(
    () => [
      buildSelectColumn<VendorDTO>(),
      {
        accessorKey: "name",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Name" />
        ),
        cell: ({ row }) => {
          const vendor = row.original;
          return (
            <div className="flex flex-col gap-1">
              <Link
                href={`/vendors/${vendor.id}`}
                className="text-primary font-medium hover:underline"
              >
                {vendor.name}
              </Link>
              <span className="text-muted-foreground text-xs">
                {vendor.code}
              </span>
            </div>
          );
        },
        meta: {
          label: "Name",
        },
      },
      {
        accessorKey: "vendorType",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Type" />
        ),
        cell: ({ row }) => {
          const vendorType = row.getValue("vendorType") as string;
          return <Badge variant="outline">{vendorType}</Badge>;
        },
        meta: {
          label: "Type",
        },
      },
      {
        accessorKey: "email",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Contact" />
        ),
        cell: ({ row }) => {
          const email = row.getValue("email") as string | null;
          const phone = row.original.phone;
          return (
            <div className="flex flex-col gap-1 text-sm">
              {email && <span className="text-muted-foreground">{email}</span>}
              {phone && <span className="text-muted-foreground">{phone}</span>}
              {!email && !phone && (
                <span className="text-muted-foreground">No contact</span>
              )}
            </div>
          );
        },
        meta: {
          label: "Contact",
        },
      },
      {
        accessorKey: "website",
        header: "Website",
        cell: ({ row }) => {
          const website = row.getValue("website") as string | null;
          return website ? (
            <a
              href={website}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary flex items-center gap-1 text-sm hover:underline"
            >
              <ExternalLink className="h-3 w-3" />
              Visit
            </a>
          ) : null;
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
            <Badge
              variant={isActive ? "default" : "secondary"}
              className={isActive ? "bg-success text-white" : ""}
            >
              {isActive ? "Active" : "Inactive"}
            </Badge>
          );
        },
        meta: {
          label: "Status",
        },
      },
      {
        accessorKey: "createdAt",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Created" />
        ),
        cell: ({ row }) => {
          const date = new Date(row.getValue("createdAt"));
          return (
            <span className="text-muted-foreground text-sm">
              {format(date, "MMM d, yyyy")}
            </span>
          );
        },
        meta: {
          label: "Created",
        },
      },
    ],
    [],
  );

  // Actions column using reusable builder
  const actionsColumn = React.useMemo(
    () =>
      buildActionsColumn<VendorDTO>([
        {
          type: "edit",
          label: "Edit",
          permission: PERMISSIONS.VENDORS_UPDATE,
          onClick: onEdit,
        },
        {
          type: "delete",
          label: "Delete",
          permission: PERMISSIONS.VENDORS_DELETE,
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

  return (
    <>
      <DataTable columns={allColumns} data={data} loading={loading} />

      {/* Delete Confirmation Dialog */}
      <deleteDialog.DialogComponent />
    </>
  );
}
