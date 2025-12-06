/**
 * Asset Reservations Table Component
 */

"use client";
"use no memo";

import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";

import { DataTable, DataTableColumnHeader } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Eye } from "lucide-react";

import type { AssetReservationDTO } from "@/interface-adapters/dtos/generated/asset-reservation.dto";
import { formatDate } from "@/lib/utils/date-format";
import { getStatusBadgeClasses } from "@/lib/utils/status-colors";
import { useColumnVisibilityEnhanced } from "@/hooks";

interface AssetReservationsTableProps {
  data: AssetReservationDTO[];
  loading?: boolean;
  onView: (reservation: AssetReservationDTO) => void;
  onRefresh: () => void;
}

const STATUS_MAP: Record<string, string> = {
  PENDING: "pending",
  CONFIRMED: "confirmed",
  ACTIVE: "active",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
};

export function AssetReservationsTable({
  data,
  loading = false,
  onView,
}: AssetReservationsTableProps) {
  const [statusFilter, setStatusFilter] = React.useState<string>("PENDING");

  // Filter data by status
  const filteredData = React.useMemo(() => {
    if (statusFilter === "ALL") {
      return data;
    }
    return data.filter((item) => item.status === statusFilter);
  }, [data, statusFilter]);

  // Sort by creation date (most recent first)
  const sortedData = React.useMemo(() => {
    return [...filteredData].sort((a, b) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [filteredData]);

  // Define columns first (before using them in the hook)
  const columns = React.useMemo<ColumnDef<AssetReservationDTO>[]>(
    () => [
      {
        accessorKey: "assetTag",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Asset" />
        ),
        cell: ({ row }) => {
          const assetTag = row.getValue("assetTag") as string;
          return <span className="text-sm font-medium">{assetTag}</span>;
        },
        meta: {
          label: "Asset",
        },
      },
      {
        accessorKey: "personName",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Reserved For" />
        ),
        cell: ({ row }) => {
          const personName = row.getValue("personName") as string | undefined;
          return (
            <span className="text-sm">
              {personName || <span className="text-muted-foreground">—</span>}
            </span>
          );
        },
        meta: {
          label: "Reserved For",
        },
      },
      {
        accessorKey: "status",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Status" />
        ),
        cell: ({ row }) => {
          const status = row.getValue("status") as string;
          const statusKey = STATUS_MAP[status] || "default";
          const badgeClasses = getStatusBadgeClasses(statusKey);

          return (
            <Badge variant="outline" className={badgeClasses}>
              {status}
            </Badge>
          );
        },
        meta: {
          label: "Status",
        },
      },
      {
        accessorKey: "startDate",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Start Date" />
        ),
        cell: ({ row }) => {
          const startDate = row.getValue("startDate") as string;
          return <span className="text-sm">{formatDate(startDate)}</span>;
        },
        meta: {
          label: "Start Date",
          hiddenByDefault: true,
        },
      },
      {
        accessorKey: "endDate",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="End Date" />
        ),
        cell: ({ row }) => {
          const endDate = row.getValue("endDate") as string;
          return <span className="text-sm">{formatDate(endDate)}</span>;
        },
        meta: {
          label: "End Date",
        },
      },
      {
        accessorKey: "purpose",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Purpose" />
        ),
        cell: ({ row }) => {
          const purpose = row.getValue("purpose") as string | null;
          return (
            <div className="max-w-[200px] truncate">
              {purpose || <span className="text-muted-foreground">—</span>}
            </div>
          );
        },
        meta: {
          label: "Purpose",
          hiddenByDefault: true,
        },
      },
      {
        id: "actions",
        cell: ({ row }) => (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onView(row.original)}
            title="View reservation details"
          >
            <Eye className="h-4 w-4" />
          </Button>
        ),
      },
    ],
    [onView],
  );

  // Use enhanced column visibility hook with localStorage persistence
  const { visibility, onVisibilityChange } =
    useColumnVisibilityEnhanced<AssetReservationDTO>({
      storageKey: "asset-reservations-table-columns",
      columns,
    });

  return (
    <div className="space-y-4">
      {/* Status Filter */}
      <div className="flex items-center gap-2">
        <label htmlFor="status-filter" className="text-sm font-medium">
          Status:
        </label>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger id="status-filter" className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="CONFIRMED">Confirmed</SelectItem>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="COMPLETED">Completed</SelectItem>
            <SelectItem value="CANCELLED">Cancelled</SelectItem>
            <SelectItem value="ALL">All Statuses</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-muted-foreground text-sm">
          ({sortedData.length} reservation{sortedData.length !== 1 ? "s" : ""})
        </span>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={sortedData}
        loading={loading}
        initialColumnVisibility={visibility}
        onColumnVisibilityChange={onVisibilityChange}
      />
    </div>
  );
}
