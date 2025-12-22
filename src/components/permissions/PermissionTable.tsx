/**
 * PermissionTable Component
 *
 * Advanced data table for permissions using TanStack Table.
 * Features: sorting, filtering, grouping by resource, row actions, multi-field search.
 */

"use client";
"use no memo";

import * as React from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { ShieldCheck } from "lucide-react";
import { format } from "date-fns";

import { DataTable, DataTableColumnHeader } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { TableSearch } from "@/components/ui/table-search";

import type { PermissionDTO } from "@/interface-adapters/presenters/permission.presenter";
import { useTableFilters } from "@/hooks/use-table-filters";

interface PermissionTableProps {
  data: PermissionDTO[];
  loading?: boolean;
}

export function PermissionTable({
  data,
  loading = false,
}: PermissionTableProps) {
  // Search state management
  const filters = useTableFilters<Record<string, never>>({
    initialFilters: {},
    searchConfig: { debounceMs: 250 },
  });

  // Pre-filter data based on search
  const filteredData = React.useMemo(() => {
    let result = data;

    // Apply search across multiple fields
    if (filters.debouncedSearchTerm) {
      const term = filters.debouncedSearchTerm.toLowerCase();
      result = result.filter(
        (p) =>
          p.displayName.toLowerCase().includes(term) ||
          p.name.toLowerCase().includes(term) ||
          p.resource.toLowerCase().includes(term) ||
          p.action.toLowerCase().includes(term),
      );
    }

    return result;
  }, [data, filters.debouncedSearchTerm]);

  const getStatusBadge = () => {
    // All permissions are system permissions
    return (
      <Badge variant="default" className="bg-primary">
        <ShieldCheck className="mr-1 h-3 w-3" />
        System
      </Badge>
    );
  };

  const columns: ColumnDef<PermissionDTO>[] = [
    {
      accessorKey: "resource",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Resource" />
      ),
      cell: ({ row }) => {
        const resource = row.getValue("resource") as string;
        return (
          <span className="font-medium capitalize">
            {resource.replace(/-/g, " ")}
          </span>
        );
      },
      filterFn: (row, id, value) => {
        return value.includes(row.getValue(id));
      },
      meta: {
        label: "Resource",
      },
    },
    {
      accessorKey: "action",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Action" />
      ),
      cell: ({ row }) => {
        const action = row.getValue("action") as string;
        return (
          <span className="text-muted-foreground capitalize">
            {action.replace(/:/g, " ")}
          </span>
        );
      },
      meta: {
        label: "Action",
      },
    },
    {
      accessorKey: "displayName",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Display Name" />
      ),
      cell: ({ row }) => {
        const displayName = row.getValue("displayName") as string;
        const description = row.original.description;
        return (
          <div className="flex flex-col gap-1">
            <span className="font-medium">{displayName}</span>
            {description && (
              <span className="text-muted-foreground line-clamp-1 text-xs">
                {description}
              </span>
            )}
          </div>
        );
      },
      meta: {
        label: "Display Name",
      },
    },
    {
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Permission Key" />
      ),
      cell: ({ row }) => {
        const name = row.getValue("name") as string;
        return (
          <code className="bg-muted text-foreground rounded px-2 py-1 font-mono text-xs">
            {name}
          </code>
        );
      },
      meta: {
        label: "Permission Key",
      },
    },
    {
      id: "status",
      header: "Status",
      cell: () => getStatusBadge(),
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
  ];

  return (
    <DataTable
      columns={columns}
      data={filteredData}
      loading={loading}
      showColumnToggle
      emptyMessage="No permissions found."
      pagination={{
        pageSize: 10,
      }}
      toolbarSlot={
        <TableSearch
          value={filters.searchTerm}
          onChange={filters.setSearchTerm}
          placeholder="Search permissions..."
          loading={loading}
        />
      }
    />
  );
}
