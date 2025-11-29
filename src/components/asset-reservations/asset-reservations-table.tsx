/**
 * Asset Reservations Table Component
 */

"use client";
"use no memo";

import { useState } from "react";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
} from "@tanstack/react-table";
import { Eye, Tag, User } from "lucide-react";
import { formatDate } from "@/lib/utils/date-format";
import { Button } from "@/components/ui/button";
import { EntityDisplay } from "@/components/ui/entity-display";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import type { AssetReservationDTO } from "@/interface-adapters/dtos/generated/asset-reservation.dto";

interface AssetReservationsTableProps {
  data: AssetReservationDTO[];
  loading?: boolean;
  onView: (reservation: AssetReservationDTO) => void;
  onRefresh: () => void;
}

const statusColors: Record<string, string> = {
  PENDING: "bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20",
  CONFIRMED: "bg-blue-500/10 text-blue-500 hover:bg-blue-500/20",
  ACTIVE: "bg-green-500/10 text-green-500 hover:bg-green-500/20",
  COMPLETED: "bg-gray-500/10 text-gray-500 hover:bg-gray-500/20",
  CANCELLED: "bg-red-500/10 text-red-500 hover:bg-red-500/20",
};

export function AssetReservationsTable({
  data,
  loading,
  onView,
}: AssetReservationsTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const columns: ColumnDef<AssetReservationDTO>[] = [
    {
      accessorKey: "assetTag",
      header: "Asset",
      cell: ({ row }) => (
        <EntityDisplay name={row.original.assetTag} icon={Tag} />
      ),
    },
    {
      accessorKey: "personName",
      header: "Reserved By",
      cell: ({ row }) => (
        <EntityDisplay name={row.original.personName} icon={User} />
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue<string>("status");
        return (
          <Badge variant="outline" className={statusColors[status] || ""}>
            {status}
          </Badge>
        );
      },
      filterFn: (row, id, value) => {
        return value === "all" || row.getValue(id) === value;
      },
    },
    {
      accessorKey: "startDate",
      header: "Start Date",
      cell: ({ row }) => (
        <div className="text-sm">
          {formatDate(row.getValue<string>("startDate"))}
        </div>
      ),
    },
    {
      accessorKey: "endDate",
      header: "End Date",
      cell: ({ row }) => (
        <div className="text-sm">
          {formatDate(row.getValue<string>("endDate"))}
        </div>
      ),
    },
    {
      accessorKey: "purpose",
      header: "Purpose",
      cell: ({ row }) => (
        <div className="max-w-[200px] truncate">
          {row.getValue<string | null>("purpose") || "-"}
        </div>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onView(row.original)}
          >
            <Eye className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
      columnFilters,
    },
  });

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <Input
          placeholder="Filter by asset tag..."
          value={
            (table.getColumn("assetTag")?.getFilterValue() as string) ?? ""
          }
          onChange={(event) =>
            table.getColumn("assetTag")?.setFilterValue(event.target.value)
          }
          className="max-w-xs"
        />

        <Select
          value={
            (table.getColumn("status")?.getFilterValue() as string) ?? "all"
          }
          onValueChange={(value) =>
            table.getColumn("status")?.setFilterValue(value)
          }
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="CONFIRMED">Confirmed</SelectItem>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="COMPLETED">Completed</SelectItem>
            <SelectItem value="CANCELLED">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center">
                  No reservations found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Info */}
      <div className="text-muted-foreground text-sm">
        Showing {table.getFilteredRowModel().rows.length} of {data.length}{" "}
        reservation(s)
      </div>
    </div>
  );
}
