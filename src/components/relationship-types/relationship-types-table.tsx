/**
 * Relationship Types Table Component
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
import { ArrowRightLeft, ArrowRight, Check, X } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import type { RelationshipTypeDTO } from "@/interface-adapters/dtos/generated/relationship-type.dto";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { deleteRelationshipTypeAction } from "@/interface-adapters/controllers/relationship-type.controller";
import { useDeleteDialog } from "@/hooks/use-delete-dialog";
import { useColumnVisibilityEnhanced } from "@/hooks";
import { buildActionsColumn } from "@/lib/table-utils";

interface RelationshipTypesTableProps {
  data: RelationshipTypeDTO[];
  loading?: boolean;
  onView: (type: RelationshipTypeDTO) => void;
  onEdit: (type: RelationshipTypeDTO) => void;
  onRefresh: () => void;
}

export function RelationshipTypesTable({
  data,
  loading,
  onView,
  onEdit,
  onRefresh,
}: RelationshipTypesTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  // Use reusable delete dialog hook
  const deleteDialog = useDeleteDialog<RelationshipTypeDTO>({
    onDelete: (type) => deleteRelationshipTypeAction(type.id),
    onSuccess: onRefresh,
    getItemName: (type) => type.name,
    entityName: "Relationship Type",
    description:
      "This action cannot be undone and may affect existing relationships.",
  });

  const columns: ColumnDef<RelationshipTypeDTO>[] = [
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue<string>("name")}</div>
      ),
    },
    {
      accessorKey: "code",
      header: "Code",
      cell: ({ row }) => (
        <div className="font-mono text-xs uppercase">
          {row.getValue<string>("code")}
        </div>
      ),
    },
    {
      accessorKey: "direction",
      header: "Direction",
      cell: ({ row }) => {
        const direction = row.getValue<string>("direction");
        return (
          <div className="flex items-center gap-2">
            {direction === "BIDIRECTIONAL" ? (
              <>
                <ArrowRightLeft className="h-4 w-4 text-blue-500" />
                <span className="text-sm">Bidirectional</span>
              </>
            ) : (
              <>
                <ArrowRight className="h-4 w-4 text-gray-500" />
                <span className="text-sm">Unidirectional</span>
              </>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "isImpacting",
      header: "Impacting",
      cell: ({ row }) => {
        const isImpacting = row.getValue<boolean>("isImpacting");
        return isImpacting ? (
          <Check className="h-4 w-4 text-green-500" />
        ) : (
          <X className="h-4 w-4 text-gray-400" />
        );
      },
    },
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ row }) => (
        <div className="text-muted-foreground max-w-md truncate text-sm">
          {row.original.description || "—"}
        </div>
      ),
      meta: {
        label: "Description",
        hiddenByDefault: true,
      },
    },
    buildActionsColumn<RelationshipTypeDTO>([
      {
        type: "view",
        label: "View",
        onClick: onView,
      },
      {
        type: "edit",
        label: "Edit",
        permission: PERMISSIONS.RELATIONSHIP_TYPES_UPDATE,
        onClick: onEdit,
      },
      {
        type: "delete",
        label: "Delete",
        permission: PERMISSIONS.RELATIONSHIP_TYPES_DELETE,
        variant: "destructive",
        separator: true,
        onClick: deleteDialog.openDialog,
      },
    ]),
  ];

  // Column visibility with persistence
  const { visibility, onVisibilityChange } =
    useColumnVisibilityEnhanced<RelationshipTypeDTO>({
      storageKey: "relationship-types-table-columns",
      columns,
    });

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: onVisibilityChange,
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
        <div className="flex flex-col gap-4 sm:flex-row">
          <Input
            placeholder="Search by name..."
            value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
            onChange={(event) =>
              table.getColumn("name")?.setFilterValue(event.target.value)
            }
            className="max-w-sm"
          />
          <Input
            placeholder="Search by code..."
            value={(table.getColumn("code")?.getFilterValue() as string) ?? ""}
            onChange={(event) =>
              table.getColumn("code")?.setFilterValue(event.target.value)
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
                    No relationship types found
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
