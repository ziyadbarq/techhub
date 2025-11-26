/**
 * Kit Checkouts Table Component
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
import { Eye, Package, User } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import type { AssetKitCheckoutDTO } from "@/interface-adapters/dtos/generated/asset-kit-checkout.dto";

interface KitCheckoutsTableProps {
  data: AssetKitCheckoutDTO[];
  loading?: boolean;
  onView: (checkout: AssetKitCheckoutDTO) => void;
  onRefresh: () => void;
}

const statusColors: Record<string, string> = {
  ACTIVE: "bg-green-500/10 text-green-500 hover:bg-green-500/20",
  OVERDUE: "bg-red-500/10 text-red-500 hover:bg-red-500/20",
  PARTIAL_RETURN: "bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20",
  RETURNED: "bg-blue-500/10 text-blue-500 hover:bg-blue-500/20",
  EXTENDED: "bg-purple-500/10 text-purple-500 hover:bg-purple-500/20",
};

export function KitCheckoutsTable({
  data,
  loading,
  onView,
}: KitCheckoutsTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const columns: ColumnDef<AssetKitCheckoutDTO>[] = [
    {
      accessorKey: "kitName",
      header: "Kit",
      cell: ({ row }) => (
        <EntityDisplay name={row.original.kitName} icon={Package} />
      ),
    },
    {
      accessorKey: "personName",
      header: "Checked Out To",
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
            {status.replace(/_/g, " ")}
          </Badge>
        );
      },
    },
    {
      accessorKey: "checkoutDate",
      header: "Checkout Date",
      cell: ({ row }) => {
        const date = new Date(row.getValue<string>("checkoutDate"));
        return <div className="text-sm">{date.toLocaleDateString()}</div>;
      },
    },
    {
      accessorKey: "expectedReturnDate",
      header: "Expected Return",
      cell: ({ row }) => {
        const date = row.getValue<string | null>("expectedReturnDate");
        return (
          <div className="text-sm">
            {date ? new Date(date).toLocaleDateString() : "N/A"}
          </div>
        );
      },
    },
    {
      accessorKey: "actualReturnDate",
      header: "Actual Return",
      cell: ({ row }) => {
        const date = row.getValue<string | null>("actualReturnDate");
        return (
          <div className="text-sm">
            {date ? new Date(date).toLocaleDateString() : "-"}
          </div>
        );
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
      <div className="flex gap-4">
        <Input
          placeholder="Filter by kit name..."
          value={(table.getColumn("kitName")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("kitName")?.setFilterValue(event.target.value)
          }
          className="max-w-xs"
        />
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
                  No checkouts found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Info */}
      <div className="text-muted-foreground text-sm">
        Showing {table.getFilteredRowModel().rows.length} of {data.length}{" "}
        checkout(s)
      </div>
    </div>
  );
}
