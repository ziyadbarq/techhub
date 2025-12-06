/**
 * Vendor Contacts Table Component
 */

"use client";
"use no memo";

import * as React from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { Mail, Phone } from "lucide-react";
import { format } from "date-fns";

import { DataTable, DataTableColumnHeader } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";

import type { VendorContactDTO } from "@/interface-adapters/presenters/vendor-contact.presenter";
import { deleteVendorContactAction } from "@/interface-adapters/controllers/vendor-contact.controller";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { useDeleteDialog } from "@/hooks/use-delete-dialog";
import { useColumnVisibilityEnhanced } from "@/hooks";
import { buildSelectColumn, buildActionsColumn } from "@/lib/table-utils";

interface VendorContactsTableProps {
  data: VendorContactDTO[];
  loading?: boolean;
  onEdit: (contact: VendorContactDTO) => void;
  onRefresh: () => void;
}

export function VendorContactsTable({
  data,
  loading = false,
  onEdit,
  onRefresh,
}: VendorContactsTableProps) {
  const [_selectedRows, _setSelectedRows] = React.useState<VendorContactDTO[]>(
    [],
  );

  // Use reusable delete dialog hook
  const deleteDialog = useDeleteDialog<VendorContactDTO>({
    onDelete: (contact) => deleteVendorContactAction(contact.id),
    onSuccess: onRefresh,
    getItemName: (contact) => `${contact.firstName} ${contact.lastName}`,
    entityName: "Vendor Contact",
  });

  const baseColumns = React.useMemo<ColumnDef<VendorContactDTO>[]>(
    () => [
      buildSelectColumn<VendorContactDTO>(),
      {
        id: "name",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Name" />
        ),
        cell: ({ row }) => (
          <div className="flex flex-col gap-1">
            <span className="font-medium">
              {row.original.firstName} {row.original.lastName}
            </span>
            {row.original.title && (
              <span className="text-muted-foreground text-xs">
                {row.original.title}
              </span>
            )}
          </div>
        ),
        meta: {
          label: "Name",
        },
      },
      {
        accessorKey: "email",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Email" />
        ),
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Mail className="text-muted-foreground h-4 w-4" />
            <span className="text-sm">{row.getValue("email")}</span>
          </div>
        ),
        meta: {
          label: "Email",
        },
      },
      {
        accessorKey: "phone",
        header: "Phone",
        cell: ({ row }) => {
          const phone = row.getValue("phone") as string | null;
          return phone ? (
            <div className="flex items-center gap-2">
              <Phone className="text-muted-foreground h-4 w-4" />
              <span className="text-sm">{phone}</span>
            </div>
          ) : null;
        },
        meta: {
          label: "Phone",
          hiddenByDefault: true,
        },
      },
      {
        accessorKey: "isPrimary",
        header: "Primary",
        cell: ({ row }) => {
          const isPrimary = row.getValue("isPrimary") as boolean;
          return isPrimary ? <Badge variant="default">Primary</Badge> : null;
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
          hiddenByDefault: true,
        },
      },
    ],
    [],
  );

  // Actions column using reusable builder
  const actionsColumn = React.useMemo(
    () =>
      buildActionsColumn<VendorContactDTO>([
        {
          type: "edit",
          label: "Edit",
          permission: PERMISSIONS.VENDOR_CONTACTS_UPDATE,
          onClick: onEdit,
        },
        {
          type: "delete",
          label: "Delete",
          permission: PERMISSIONS.VENDOR_CONTACTS_DELETE,
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
    useColumnVisibilityEnhanced<VendorContactDTO>({
      storageKey: "vendor-contacts-table-columns",
      columns: allColumns,
    });

  return (
    <>
      <DataTable
        columns={allColumns}
        data={data}
        loading={loading}
        searchable
        searchKey="email"
        searchPlaceholder="Search contacts..."
        selectable
        onSelectionChange={_setSelectedRows}
        showColumnToggle
        emptyMessage="No contacts found. Create one to get started!"
        initialColumnVisibility={visibility}
        onColumnVisibilityChange={onVisibilityChange}
      />

      {/* Delete Confirmation Dialog */}
      <deleteDialog.DialogComponent />
    </>
  );
}
