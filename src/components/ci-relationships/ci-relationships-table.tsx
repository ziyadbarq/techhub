/**
 * CI Relationships Table Component
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
import { Link } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import type { CIRelationshipDTO } from "@/interface-adapters/dtos/generated/ci-relationship.dto";
import { Badge } from "@/components/ui/badge";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { deleteCIRelationshipAction } from "@/interface-adapters/controllers/ci-relationship.controller";
import { useDeleteDialog } from "@/hooks/use-delete-dialog";
import { buildActionsColumn } from "@/lib/table-utils";
import { format } from "date-fns";

interface CIRelationshipsTableProps {
  data: CIRelationshipDTO[];
  loading?: boolean;
  onView: (relationship: CIRelationshipDTO) => void;
  onEdit: (relationship: CIRelationshipDTO) => void;
  onRefresh: () => void;
}

export function CIRelationshipsTable({
  data,
  loading,
  onView,
  onEdit,
  onRefresh,
}: CIRelationshipsTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  // Use reusable delete dialog hook
  const deleteDialog = useDeleteDialog<CIRelationshipDTO>({
    onDelete: (relationship) => deleteCIRelationshipAction(relationship.id),
    onSuccess: onRefresh,
    getItemName: (relationship) =>
      `${relationship.fromCiName} → ${relationship.toCiName}`,
    entityName: "Relationship",
  });

  const columns: ColumnDef<CIRelationshipDTO>[] = [
    {
      accessorKey: "fromCiName",
      header: "From CI",
      cell: ({ row }) => (
        <div className="font-medium">{row.original.fromCiName || "—"}</div>
      ),
    },
    {
      accessorKey: "relationshipTypeName",
      header: "Relationship",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Link className="text-muted-foreground h-4 w-4" />
          <span>{row.original.relationshipTypeName || "—"}</span>
        </div>
      ),
    },
    {
      accessorKey: "toCiName",
      header: "To CI",
      cell: ({ row }) => (
        <div className="font-medium">{row.original.toCiName || "—"}</div>
      ),
    },
    {
      accessorKey: "isActive",
      header: "Status",
      cell: ({ row }) => {
        const isActive = row.original.isActive;
        return (
          <Badge
            variant="outline"
            className={
              isActive
                ? "bg-green-500/10 text-green-500 hover:bg-green-500/20"
                : "bg-gray-500/10 text-gray-500 hover:bg-gray-500/20"
            }
          >
            {isActive ? "Active" : "Inactive"}
          </Badge>
        );
      },
    },
    {
      accessorKey: "validFrom",
      header: "Valid From",
      cell: ({ row }) => (
        <div className="text-sm">
          {format(new Date(row.original.validFrom), "MMM d, yyyy")}
        </div>
      ),
    },
    {
      accessorKey: "validTo",
      header: "Valid To",
      cell: ({ row }) => (
        <div className="text-sm">
          {row.original.validTo
            ? format(new Date(row.original.validTo), "MMM d, yyyy")
            : "—"}
        </div>
      ),
    },
    buildActionsColumn<CIRelationshipDTO>([
      {
        type: "view",
        label: "View",
        onClick: onView,
      },
      {
        type: "edit",
        label: "Edit",
        permission: PERMISSIONS.CI_RELATIONSHIPS_UPDATE,
        onClick: onEdit,
      },
      {
        type: "delete",
        label: "Delete",
        permission: PERMISSIONS.CI_RELATIONSHIPS_DELETE,
        variant: "destructive",
        separator: true,
        onClick: deleteDialog.openDialog,
      },
    ]),
  ];

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    state: {
      sorting,
      columnFilters,
    },
  });

  return (
    <>
      <div className="space-y-4">
        {/* Filters */}
        <div className="flex flex-col gap-4 sm:flex-row">
          <Input
            placeholder="Search by From CI..."
            value={
              (table.getColumn("fromCiName")?.getFilterValue() as string) ?? ""
            }
            onChange={(event) =>
              table.getColumn("fromCiName")?.setFilterValue(event.target.value)
            }
            className="max-w-sm"
          />
          <Input
            placeholder="Filter by Relationship..."
            value={
              (table
                .getColumn("relationshipTypeName")
                ?.getFilterValue() as string) ?? ""
            }
            onChange={(event) =>
              table
                .getColumn("relationshipTypeName")
                ?.setFilterValue(event.target.value)
            }
            className="max-w-sm"
          />
          <Input
            placeholder="Search by To CI..."
            value={
              (table.getColumn("toCiName")?.getFilterValue() as string) ?? ""
            }
            onChange={(event) =>
              table.getColumn("toCiName")?.setFilterValue(event.target.value)
            }
            className="max-w-sm"
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
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
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
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
                    No relationships found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <deleteDialog.DialogComponent />
    </>
  );
}
