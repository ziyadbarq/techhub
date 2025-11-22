/**
 * CI Classes Table Component
 */

"use client";
"use no memo";

import { useState } from "react";
import {
  type ColumnDef,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { CIClassDTO } from "@/interface-adapters/presenters/ci-class.presenter";
import { deleteCIClassAction } from "@/interface-adapters/controllers/ci-class.controller";

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
  const [globalFilter, setGlobalFilter] = useState("");

  const handleDelete = async (ciClass: CIClassDTO) => {
    if (
      !confirm(
        `Are you sure you want to delete "${ciClass.name}"? This action cannot be undone.`,
      )
    ) {
      return;
    }

    try {
      const result = await deleteCIClassAction(ciClass.id);
      if (result.success) {
        toast.success("CI Class deleted successfully");
        onRefresh();
      } else {
        toast.error(result.error || "Failed to delete CI class");
      }
    } catch (_error) {
      toast.error("Failed to delete CI class");
    }
  };

  const columns: ColumnDef<CIClassDTO>[] = [
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
        const criticality = row.getValue("defaultCriticality") as string | null;
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
    {
      id: "actions",
      cell: ({ row }) => {
        const ciClass = row.original;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => {
                  navigator.clipboard.writeText(ciClass.id);
                  toast.success("ID copied to clipboard");
                }}
              >
                Copy ID
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onEdit(ciClass)}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => handleDelete(ciClass)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const table = useReactTable({
    data,
    columns,
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
                  colSpan={columns.length}
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
  );
}
