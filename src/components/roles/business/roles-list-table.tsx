/**
 * Roles List Table Component
 *
 * Read-only data table for business roles.
 * Click row to navigate to detail page.
 */

"use client";

import * as React from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import Link from "next/link";

import { DataTable, DataTableColumnHeader } from "@/components/ui/data-table";
import type { RoleDTO } from "@/interface-adapters/presenters/role.presenter";

interface RolesListTableProps {
  data: RoleDTO[];
}

export function RolesListTable({ data }: RolesListTableProps) {
  const columns: ColumnDef<RoleDTO>[] = [
    {
      accessorKey: "displayName",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Role" />
      ),
      cell: ({ row }) => {
        const displayName = row.getValue("displayName") as string;
        const roleId = row.original.id;
        return (
          <Link href={`/roles/${roleId}`} className="hover:underline">
            <span className="font-medium">{displayName}</span>
          </Link>
        );
      },
      meta: {
        label: "Role",
      },
    },
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ row }) => {
        const description = row.getValue("description") as string | null;
        return (
          <span className="text-muted-foreground line-clamp-2 text-sm">
            {description || "-"}
          </span>
        );
      },
      meta: {
        label: "Description",
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
  ];

  return (
    <DataTable
      columns={columns}
      data={data}
      searchable
      searchKey="displayName"
      searchPlaceholder="Search roles..."
      showColumnToggle
      emptyMessage="No business roles found."
      pagination={{
        pageSize: 10,
      }}
    />
  );
}
