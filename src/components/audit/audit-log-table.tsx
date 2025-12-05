/**
 * Audit Log Table Component
 *
 * Advanced data table for audit logs using TanStack Table.
 * Features:
 * - Sorting, filtering, pagination
 * - Expandable rows for detailed view
 * - User name display (if available)
 * - Action and entity type badges
 * - Date formatting
 */

"use client";
"use no memo";

import * as React from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { ChevronDown, ChevronRight, Download } from "lucide-react";
import { format } from "date-fns";
// import { toast } from "sonner"; // Unused for now

import { DataTable, DataTableColumnHeader } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { AuditLogDTO } from "@/interface-adapters/presenters/audit-log.presenter";
import { AuditLogDetails } from "./audit-log-details";

interface AuditLogTableProps {
  data: AuditLogDTO[];
  loading?: boolean;
  totalPages: number;
  currentPage: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onExport: () => void;
  isExporting?: boolean;
}

export function AuditLogTable({
  data,
  loading = false,
  totalPages,
  currentPage,
  pageSize,
  onPageChange,
  onExport,
  isExporting = false,
}: AuditLogTableProps) {
  const [expandedRows, setExpandedRows] = React.useState<Set<string>>(
    new Set(),
  );

  const toggleRowExpansion = (id: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const getActionBadge = (action: string) => {
    // Determine badge variant based on action type
    if (action.includes("create") || action.includes("CREATE")) {
      return (
        <Badge variant="default" className="bg-success text-white">
          {action}
        </Badge>
      );
    }
    if (action.includes("update") || action.includes("UPDATE")) {
      return <Badge variant="default">{action}</Badge>;
    }
    if (action.includes("delete") || action.includes("DELETE")) {
      return (
        <Badge variant="default" className="bg-destructive text-white">
          {action}
        </Badge>
      );
    }
    return <Badge variant="outline">{action}</Badge>;
  };

  const columns: ColumnDef<AuditLogDTO>[] = [
    {
      id: "expander",
      header: () => null,
      cell: ({ row }) => {
        const isExpanded = expandedRows.has(row.original.id);
        return (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => toggleRowExpansion(row.original.id)}
            className="h-6 w-6"
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        );
      },
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Date & Time" />
      ),
      cell: ({ row }) => {
        const date = new Date(row.getValue("createdAt"));
        return (
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-medium">
              {format(date, "MMM d, yyyy")}
            </span>
            <span className="text-muted-foreground text-xs">
              {format(date, "h:mm:ss a")}
            </span>
          </div>
        );
      },
      meta: {
        label: "Date & Time",
      },
    },
    {
      accessorKey: "userId",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="User" />
      ),
      cell: ({ row }) => {
        const userId = row.original.userId;
        const userName = row.original.userName;

        if (!userId) {
          return <span className="text-muted-foreground text-sm">System</span>;
        }

        return (
          <div className="flex flex-col gap-0.5">
            {userName && (
              <span className="text-sm font-medium">{userName}</span>
            )}
            <span className="text-muted-foreground text-xs">{userId}</span>
          </div>
        );
      },
      meta: {
        label: "User",
      },
    },
    {
      accessorKey: "action",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Action" />
      ),
      cell: ({ row }) => getActionBadge(row.getValue("action")),
      filterFn: (row, id, value) => {
        return value.includes(row.getValue(id));
      },
      meta: {
        label: "Action",
      },
    },
    {
      accessorKey: "entityType",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Entity Type" />
      ),
      cell: ({ row }) => {
        const entityType = row.getValue("entityType") as string;
        return <Badge variant="secondary">{entityType}</Badge>;
      },
      filterFn: (row, id, value) => {
        return value.includes(row.getValue(id));
      },
      meta: {
        label: "Entity Type",
      },
    },
    {
      accessorKey: "entityId",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Entity ID" />
      ),
      cell: ({ row }) => {
        const entityId = row.original.entityId;
        if (!entityId) {
          return <span className="text-muted-foreground text-sm">-</span>;
        }
        return (
          <span className="font-mono text-sm">
            {entityId.length > 12 ? `${entityId.slice(0, 12)}...` : entityId}
          </span>
        );
      },
      meta: {
        label: "Entity ID",
      },
    },
  ];

  return (
    <div className="space-y-4">
      <DataTable
        columns={columns}
        data={data}
        loading={loading}
        searchable
        searchKey="action"
        searchPlaceholder="Search actions..."
        showColumnToggle
        emptyMessage="No audit logs found."
        pagination={{
          pageSize,
          pageIndex: currentPage - 1,
          pageCount: totalPages,
          onPageChange: (pageIndex) => onPageChange(pageIndex + 1),
          manualPagination: true,
        }}
        toolbarActions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onExport}
              disabled={isExporting || data.length === 0}
            >
              <Download className="mr-2 h-4 w-4" />
              {isExporting ? "Exporting..." : "Export CSV"}
            </Button>
          </div>
        }
        renderExpandedRow={(row) => {
          if (!expandedRows.has(row.original.id)) {
            return null;
          }
          return <AuditLogDetails log={row.original} />;
        }}
      />
    </div>
  );
}
