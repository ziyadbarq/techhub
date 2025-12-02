/**
 * CI Classes Table Component
 */

"use client";
"use no memo";

import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import type { CIClassDTO } from "@/interface-adapters/presenters/ci-class.presenter";
import { deleteCIClassAction } from "@/interface-adapters/controllers/ci-class.controller";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { useDeleteDialog } from "@/hooks/use-delete-dialog";
import { buildSelectColumn, buildActionsColumn } from "@/lib/table-utils";

interface CIClassesTableProps {
  data: CIClassDTO[];
  onEdit: (ciClass: CIClassDTO) => void;
  onRefresh: () => void;
}

export function CIClassesTable({
  data,
  onEdit,
  onRefresh,
}: CIClassesTableProps) {
  const [globalFilter, setGlobalFilter] = React.useState("");

  // Use reusable delete dialog hook
  const deleteDialog = useDeleteDialog<CIClassDTO>({
    onDelete: (ciClass) => deleteCIClassAction(ciClass.id),
    onSuccess: onRefresh,
    getItemName: (ciClass) => ciClass.name,
    entityName: "CI Class",
  });

  const baseColumns = React.useMemo<ColumnDef<CIClassDTO>[]>(
    () => [
      buildSelectColumn<CIClassDTO>(),
      {
        accessorKey: "name",
        header: "Name",
        cell: ({ row }) => (
          <div className="font-medium">{row.getValue("name")}</div>
        ),
      },
      {
        accessorKey: "code",
        header: "Code",
        cell: ({ row }) => (
          <Badge variant="outline" className="font-mono">
            {row.getValue("code")}
          </Badge>
        ),
      },
      {
        accessorKey: "parentClassId",
        header: "Type",
        cell: ({ row }) => {
          const isRoot = !row.getValue("parentClassId");
          return (
            <Badge variant={isRoot ? "default" : "secondary"}>
              {isRoot ? "Root Class" : "Child Class"}
            </Badge>
          );
        },
      },
      {
        accessorKey: "defaultCriticality",
        header: "Default Criticality",
        cell: ({ row }) => {
          const criticality = row.getValue("defaultCriticality") as
            | string
            | null;
          if (!criticality)
            return <span className="text-muted-foreground">—</span>;

          const colors = {
            LOW: "bg-blue-100 text-blue-800",
            MEDIUM: "bg-yellow-100 text-yellow-800",
            HIGH: "bg-orange-100 text-orange-800",
            CRITICAL: "bg-red-100 text-red-800",
          };

          return (
            <Badge className={colors[criticality as keyof typeof colors]}>
              {criticality}
            </Badge>
          );
        },
      },
      {
        accessorKey: "defaultEnvironment",
        header: "Default Environment",
        cell: ({ row }) => {
          const env = row.getValue("defaultEnvironment") as string | null;
          if (!env) return <span className="text-muted-foreground">—</span>;

          const formatted = env.replace(/_/g, " ");
          return <span className="text-sm">{formatted}</span>;
        },
      },
      {
        accessorKey: "isDiscoverable",
        header: "Discoverable",
        cell: ({ row }) => {
          const isDiscoverable = row.getValue("isDiscoverable") as boolean;
          return (
            <Badge variant={isDiscoverable ? "default" : "secondary"}>
              {isDiscoverable ? "Yes" : "No"}
            </Badge>
          );
        },
      },
    ],
    [],
  );

  // Actions column using reusable builder
  const actionsColumn = React.useMemo(
    () =>
      buildActionsColumn<CIClassDTO>([
        {
          type: "edit",
          label: "Edit",
          permission: PERMISSIONS.CI_CLASSES_UPDATE,
          onClick: onEdit,
        },
        {
          type: "delete",
          label: "Delete",
          permission: PERMISSIONS.CI_CLASSES_DELETE,
          variant: "destructive",
          separator: true,
          onClick: deleteDialog.openDialog,
        },
      ]),
    [onEdit, deleteDialog.openDialog],
  );

  // Merge static columns + actions column
  const allColumns = React.useMemo(() => {
    return [...baseColumns, actionsColumn];
  }, [baseColumns, actionsColumn]);

  const table = useReactTable({
    data,
    columns: allColumns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onGlobalFilterChange: setGlobalFilter,
    state: {
      globalFilter,
    },
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  return (
    <>
      <div className="space-y-4">
        {/* Search */}
        <div className="flex items-center justify-between">
          <Input
            placeholder="Search CI classes..."
            value={globalFilter ?? ""}
            onChange={(event) => setGlobalFilter(event.target.value)}
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
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                  >
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
                    colSpan={allColumns.length}
                    className="h-24 text-center"
                  >
                    No CI classes found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-end space-x-2">
          <div className="text-muted-foreground flex-1 text-sm">
            {table.getFilteredRowModel().rows.length} total CI class(es)
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <deleteDialog.DialogComponent />
    </>
  );
}
