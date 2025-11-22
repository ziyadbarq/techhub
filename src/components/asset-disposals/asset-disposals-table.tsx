/**
 * Asset Disposals Table Component
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
import { Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import type { AssetDisposalDTO } from "@/interface-adapters/dtos/generated/asset-disposal.dto";
import { Badge } from "@/components/ui/badge";

interface AssetDisposalsTableProps {
  data: AssetDisposalDTO[];
  loading?: boolean;
  onView: (disposal: AssetDisposalDTO) => void;
  onRefresh: () => void;
}

const statusColors: Record<string, string> = {
  PENDING_APPROVAL: "bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20",
  APPROVED: "bg-blue-500/10 text-blue-500 hover:bg-blue-500/20",
  REJECTED: "bg-red-500/10 text-red-500 hover:bg-red-500/20",
  IN_PROGRESS: "bg-purple-500/10 text-purple-500 hover:bg-purple-500/20",
  SANITIZED: "bg-indigo-500/10 text-indigo-500 hover:bg-indigo-500/20",
  COMPLETED: "bg-green-500/10 text-green-500 hover:bg-green-500/20",
  CANCELLED: "bg-gray-500/10 text-gray-500 hover:bg-gray-500/20",
};

const disposalTypeLabels: Record<string, string> = {
  DONATION: "Donation",
  SALE: "Sale",
  RECYCLING: "Recycling",
  DESTRUCTION: "Destruction",
  OTHER: "Other",
};

export function AssetDisposalsTable({
  data,
  loading,
  onView,
}: AssetDisposalsTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const columns: ColumnDef<AssetDisposalDTO>[] = [
    {
      accessorKey: "assetId",
      header: "Asset ID",
      cell: ({ row }) => (
        <div className="font-mono text-xs">
          {row.getValue<string>("assetId").slice(0, 8)}...
        </div>
      ),
    },
    {
      accessorKey: "disposalType",
      header: "Type",
      cell: ({ row }) => (
        <div>
          {disposalTypeLabels[row.getValue<string>("disposalType")] ||
            row.getValue<string>("disposalType")}
        </div>
      ),
      filterFn: (row, id, value) => {
        return value === "all" || row.getValue(id) === value;
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue<string>("status");
        return (
          <Badge variant="outline" className={statusColors[status] || ""}>
            {status.replace(/_/g, " ")}
          </Badge>
        );
      },
      filterFn: (row, id, value) => {
        return value === "all" || row.getValue(id) === value;
      },
    },
    {
      accessorKey: "reason",
      header: "Reason",
      cell: ({ row }) => (
        <div className="max-w-[200px] truncate">
          {row.getValue<string>("reason")}
        </div>
      ),
    },
    {
      accessorKey: "createdAt",
      header: "Created",
      cell: ({ row }) => {
        const date = new Date(row.getValue<string>("createdAt"));
        return <div className="text-sm">{date.toLocaleDateString()}</div>;
      },
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
          placeholder="Filter by asset ID..."
          value={(table.getColumn("assetId")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("assetId")?.setFilterValue(event.target.value)
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
            <SelectItem value="PENDING_APPROVAL">Pending Approval</SelectItem>
            <SelectItem value="APPROVED">Approved</SelectItem>
            <SelectItem value="REJECTED">Rejected</SelectItem>
            <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
            <SelectItem value="SANITIZED">Sanitized</SelectItem>
            <SelectItem value="COMPLETED">Completed</SelectItem>
            <SelectItem value="CANCELLED">Cancelled</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={
            (table.getColumn("disposalType")?.getFilterValue() as string) ??
            "all"
          }
          onValueChange={(value) =>
            table.getColumn("disposalType")?.setFilterValue(value)
          }
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="DONATION">Donation</SelectItem>
            <SelectItem value="SALE">Sale</SelectItem>
            <SelectItem value="RECYCLING">Recycling</SelectItem>
            <SelectItem value="DESTRUCTION">Destruction</SelectItem>
            <SelectItem value="OTHER">Other</SelectItem>
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
                  No disposals found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Info */}
      <div className="text-muted-foreground text-sm">
        Showing {table.getFilteredRowModel().rows.length} of {data.length}{" "}
        disposal(s)
      </div>
    </div>
  );
}
