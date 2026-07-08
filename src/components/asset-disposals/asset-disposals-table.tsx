/**
 * Asset Disposals Table Component
 */

"use client";
"use no memo";

import { useState } from "react";
import { disposalStatusColors } from "@/lib/utils/status-colors";
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
import { Tag } from "lucide-react";
import { formatDate } from "@/lib/utils/date-format";
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
import type { AssetDisposalDTO } from "@/interface-adapters/dtos/generated/asset-disposal.dto";
import { Badge } from "@/components/ui/badge";
import { useDeleteDialog } from "@/hooks/use-delete-dialog";
import { useColumnVisibilityEnhanced } from "@/hooks";
import { deleteAssetDisposalAction } from "@/interface-adapters/controllers/asset-disposal.controller";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { buildSelectColumn, buildActionsColumn } from "@/lib/table-utils";

interface AssetDisposalsTableProps {
  data: AssetDisposalDTO[];
  loading?: boolean;
  onView: (disposal: AssetDisposalDTO) => void;
  onRefresh: () => void;
}

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
  onRefresh,
}: AssetDisposalsTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  // Use reusable delete dialog hook
  const deleteDialog = useDeleteDialog<AssetDisposalDTO>({
    onDelete: (disposal) => deleteAssetDisposalAction(disposal.id),
    onSuccess: onRefresh,
    getItemName: (disposal) => `Disposal ${disposal.id.slice(0, 8)}`,
    entityName: "Asset Disposal",
  });

  const columns: ColumnDef<AssetDisposalDTO>[] = [
    buildSelectColumn<AssetDisposalDTO>(),
    {
      accessorKey: "assetId",
      header: "Asset",
      cell: ({ row }) => (
        <EntityDisplay name={row.original.assetTag} icon={Tag} />
      ),
      meta: {
        label: "Asset",
      },
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
      meta: {
        label: "Type",
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue<string>("status");
        return (
          <Badge
            variant="outline"
            className={disposalStatusColors[status] || ""}
          >
            {status.replace(/_/g, " ")}
          </Badge>
        );
      },
      filterFn: (row, id, value) => {
        return value === "all" || row.getValue(id) === value;
      },
      meta: {
        label: "Status",
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
      meta: {
        label: "Reason",
        hiddenByDefault: true,
      },
    },
    {
      accessorKey: "createdAt",
      header: "Created",
      cell: ({ row }) => (
        <div className="text-sm">
          {formatDate(row.getValue<string>("createdAt"))}
        </div>
      ),
      meta: {
        label: "Created",
        hiddenByDefault: true,
      },
    },
    // Actions column using reusable builder
    buildActionsColumn<AssetDisposalDTO>([
      {
        type: "view",
        label: "View",
        onClick: onView,
      },
      {
        type: "delete",
        label: "Delete",
        permission: PERMISSIONS.ASSETS_DELETE,
        variant: "destructive",
        separator: true,
        onClick: deleteDialog.openDialog,
      },
    ]),
  ];

  // Use enhanced column visibility hook with localStorage persistence
  const { visibility, onVisibilityChange } =
    useColumnVisibilityEnhanced<AssetDisposalDTO>({
      storageKey: "asset-disposals-table-columns",
      columns,
    });

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: (updater) => {
      const newVisibility =
        typeof updater === "function" ? updater(visibility) : updater;
      onVisibilityChange(newVisibility);
    },
    state: {
      sorting,
      columnFilters,
      columnVisibility: visibility,
    },
  });

  return (
    <>
      <div className="space-y-4">
        {/* Filters */}
        <div className="flex flex-wrap gap-4">
          <Input
            placeholder="Filter by asset ID..."
            value={
              (table.getColumn("assetId")?.getFilterValue() as string) ?? ""
            }
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

      {/* Delete Confirmation Dialog */}
      <deleteDialog.DialogComponent />
    </>
  );
}
