/**
 * Generic DataTable Component
 *
 * Reusable table component built with TanStack Table v9.
 * Supports pagination, sorting, filtering, row selection, and column visibility.
 *
 * @example
 * ```tsx
 * const columns: ColumnDef<User>[] = [
 *   {
 *     accessorKey: "name",
 *     header: "Name",
 *     cell: ({ row }) => row.getValue("name"),
 *   },
 * ];
 *
 * <DataTable
 *   columns={columns}
 *   data={users}
 *   // pagination prop is optional - defaults to pageSize: 10
 * />
 * ```
 */

"use client";
"use no memo";

import * as React from "react";
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
  type Column,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
  type VisibilityState,
  type PaginationState,
} from "@tanstack/react-table";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronsRight as ScrollIndicator,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

// Pagination constants following SOLID principles
export const VALID_PAGE_SIZES = [10, 50, 100, 500] as const;
export const DEFAULT_PAGE_SIZE = 10;
export type ValidPageSize = (typeof VALID_PAGE_SIZES)[number];

export interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  // Pagination
  pagination?: {
    pageSize?: number;
    pageIndex?: number;
    pageCount?: number;
    total?: number;
    onPageChange?: (pageIndex: number) => void;
    onPaginationChange?: (pagination: PaginationState) => void;
    manualPagination?: boolean;
  };
  // Search/Filter
  searchable?: boolean;
  searchPlaceholder?: string;
  searchKey?: string;
  // Selection
  selectable?: boolean;
  onSelectionChange?: (selectedRows: TData[]) => void;
  // Column visibility
  showColumnToggle?: boolean;
  initialColumnVisibility?: VisibilityState;
  // Loading state
  loading?: boolean;
  // Empty state
  emptyMessage?: string;
  // Additional toolbar actions
  toolbarActions?: React.ReactNode;
  // Expandable rows
  renderExpandedRow?: (row: { original: TData }) => React.ReactNode | null;
  // Custom className
  className?: string;
  // NEW: Controlled state support
  controlledState?: {
    sorting?: SortingState;
    columnFilters?: ColumnFiltersState;
    pagination?: PaginationState;
    columnVisibility?: VisibilityState;
    rowSelection?: Record<string, boolean>;
  };
  onSortingChange?: (sorting: SortingState) => void;
  onColumnFiltersChange?: (filters: ColumnFiltersState) => void;
  onPaginationChange?: (pagination: PaginationState) => void;
  onColumnVisibilityChange?: (visibility: VisibilityState) => void;
  onRowSelectionChange?: (selection: Record<string, boolean>) => void;
  // NEW: Preset filters slot
  presetFilters?: React.ReactNode;
  // NEW: Toolbar slots for advanced layouts
  toolbarSlot?: React.ReactNode;
  filtersSlot?: React.ReactNode;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  pagination,
  searchable = false,
  searchPlaceholder = "Search...",
  searchKey,
  selectable = false,
  onSelectionChange,
  showColumnToggle = true,
  initialColumnVisibility,
  loading = false,
  emptyMessage = "No results.",
  toolbarActions,
  renderExpandedRow,
  className,
  controlledState,
  onSortingChange: onSortingChangeProp,
  onColumnFiltersChange: onColumnFiltersChangeProp,
  onPaginationChange: onPaginationChangeProp,
  onColumnVisibilityChange: onColumnVisibilityChangeProp,
  onRowSelectionChange: onRowSelectionChangeProp,
  presetFilters,
  toolbarSlot,
  filtersSlot,
}: DataTableProps<TData, TValue>) {
  // Use controlled state if provided, otherwise use internal state
  const [sorting, setSorting] = React.useState<SortingState>(
    controlledState?.sorting ?? [],
  );
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    controlledState?.columnFilters ?? [],
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>(
      controlledState?.columnVisibility ?? initialColumnVisibility ?? {},
    );
  const [rowSelection, setRowSelection] = React.useState(
    controlledState?.rowSelection ?? {},
  );
  const [internalPagination, setInternalPagination] =
    React.useState<PaginationState>(
      controlledState?.pagination ?? {
        pageIndex: pagination?.pageIndex ?? 0,
        pageSize: pagination?.pageSize ?? DEFAULT_PAGE_SIZE,
      },
    );

  // Track horizontal scroll availability for mobile indicator
  const tableContainerRef = React.useRef<HTMLDivElement>(null);
  const [showScrollIndicator, setShowScrollIndicator] = React.useState(false);

  // Check if table needs horizontal scroll on mobile
  React.useEffect(() => {
    const checkScroll = () => {
      if (tableContainerRef.current) {
        const { scrollWidth, clientWidth } = tableContainerRef.current;
        setShowScrollIndicator(scrollWidth > clientWidth);
      }
    };

    checkScroll();
    window.addEventListener("resize", checkScroll);
    return () => window.removeEventListener("resize", checkScroll);
  }, [data]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: (updaterOrValue) => {
      const newSorting =
        typeof updaterOrValue === "function"
          ? updaterOrValue(sorting)
          : updaterOrValue;
      setSorting(newSorting);
      if (onSortingChangeProp) {
        onSortingChangeProp(newSorting);
      }
    },
    onColumnFiltersChange: (updaterOrValue) => {
      const newFilters =
        typeof updaterOrValue === "function"
          ? updaterOrValue(columnFilters)
          : updaterOrValue;
      setColumnFilters(newFilters);
      if (onColumnFiltersChangeProp) {
        onColumnFiltersChangeProp(newFilters);
      }
    },
    onColumnVisibilityChange: (updaterOrValue) => {
      const newVisibility =
        typeof updaterOrValue === "function"
          ? updaterOrValue(columnVisibility)
          : updaterOrValue;
      setColumnVisibility(newVisibility);
      if (onColumnVisibilityChangeProp) {
        onColumnVisibilityChangeProp(newVisibility);
      }
    },
    onRowSelectionChange: (updaterOrValue) => {
      const newSelection =
        typeof updaterOrValue === "function"
          ? updaterOrValue(rowSelection)
          : updaterOrValue;
      setRowSelection(newSelection);
      if (onRowSelectionChangeProp) {
        onRowSelectionChangeProp(newSelection);
      }
    },
    onPaginationChange: (updaterOrValue) => {
      const current =
        controlledState?.pagination ??
        (pagination
          ? {
              pageIndex: pagination.pageIndex ?? 0,
              pageSize: pagination.pageSize ?? DEFAULT_PAGE_SIZE,
            }
          : internalPagination);
      const next =
        typeof updaterOrValue === "function"
          ? updaterOrValue(current)
          : updaterOrValue;

      if (onPaginationChangeProp) {
        onPaginationChangeProp(next);
      } else if (pagination?.onPaginationChange) {
        pagination.onPaginationChange(next);
      } else if (pagination?.onPageChange) {
        pagination.onPageChange(next.pageIndex);
        setInternalPagination(next);
      } else {
        setInternalPagination(next);
      }
    },
    state: {
      sorting: controlledState?.sorting ?? sorting,
      columnFilters: controlledState?.columnFilters ?? columnFilters,
      columnVisibility: controlledState?.columnVisibility ?? columnVisibility,
      rowSelection: controlledState?.rowSelection ?? rowSelection,
      pagination:
        controlledState?.pagination ??
        (pagination
          ? {
              pageIndex: pagination.pageIndex ?? 0,
              pageSize: pagination.pageSize ?? DEFAULT_PAGE_SIZE,
            }
          : internalPagination),
    },
    manualPagination:
      pagination?.manualPagination ?? !!pagination?.onPaginationChange,
    pageCount:
      pagination?.pageCount ??
      (pagination?.total
        ? Math.ceil(
            pagination.total / (pagination.pageSize ?? DEFAULT_PAGE_SIZE),
          )
        : undefined),
  });

  const showSkeleton = loading && data.length === 0;

  // Notify parent of selection changes
  React.useEffect(() => {
    if (onSelectionChange) {
      const selectedRows = table
        .getFilteredSelectedRowModel()
        .rows.map((row) => row.original);
      onSelectionChange(selectedRows);
    }
  }, [rowSelection, onSelectionChange, table]);

  return (
    <div className={cn("space-y-4", className)}>
      {/* Toolbar */}
      {(searchable || showColumnToggle || toolbarActions || toolbarSlot) && (
        <div className="flex items-center justify-between gap-2">
          {/* Custom toolbar slot takes priority if provided */}
          {toolbarSlot ? (
            toolbarSlot
          ) : (
            <div className="flex flex-1 items-center gap-2">
              {searchable && searchKey && (
                <Input
                  placeholder={searchPlaceholder}
                  value={
                    (table.getColumn(searchKey)?.getFilterValue() as string) ??
                    ""
                  }
                  onChange={(event) =>
                    table
                      .getColumn(searchKey)
                      ?.setFilterValue(event.target.value)
                  }
                  className="max-w-sm"
                />
              )}
              {toolbarActions}
            </div>
          )}

          {showColumnToggle && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="ml-auto">
                  Columns <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {table
                  .getAllColumns()
                  .filter((column) => column.getCanHide())
                  .map((column) => {
                    const label =
                      (column.columnDef.meta as { label?: string })?.label ||
                      column.id;
                    return (
                      <DropdownMenuCheckboxItem
                        key={column.id}
                        className="capitalize"
                        checked={column.getIsVisible()}
                        onCheckedChange={(value) =>
                          column.toggleVisibility(!!value)
                        }
                      >
                        {label}
                      </DropdownMenuCheckboxItem>
                    );
                  })}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      )}

      {/* Preset Filters Slot */}
      {(presetFilters || filtersSlot) && (
        <div className="flex flex-wrap gap-2">
          {presetFilters}
          {filtersSlot}
        </div>
      )}

      {/* Table */}
      <div className="relative">
        <div
          ref={tableContainerRef}
          className="overflow-x-auto rounded-md border"
        >
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead key={header.id}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext(),
                            )}
                      </TableHead>
                    );
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {showSkeleton ? (
                Array.from({ length: pagination?.pageSize ?? 5 }).map(
                  (_, i) => (
                    <TableRow key={i}>
                      {columns.map((_, j) => (
                        <TableCell key={j}>
                          <Skeleton className="h-6 w-full" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ),
                )
              ) : table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <React.Fragment key={row.id}>
                    <TableRow data-state={row.getIsSelected() && "selected"}>
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext(),
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                    {renderExpandedRow && renderExpandedRow(row) && (
                      <TableRow>
                        <TableCell colSpan={columns.length} className="p-0">
                          {renderExpandedRow(row)}
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
                    {emptyMessage}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {loading && data.length > 0 && (
          <div className="bg-background/80 pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="text-muted-foreground text-sm">Loading…</div>
          </div>
        )}

        {/* Horizontal Scroll Indicator (Mobile) */}
        {showScrollIndicator && (
          <div className="pointer-events-none absolute top-0 right-0 flex h-full items-center pr-2 md:hidden">
            <div className="bg-background/80 flex items-center rounded-full p-1 shadow-lg backdrop-blur-sm">
              <ScrollIndicator className="text-muted-foreground h-4 w-4 animate-pulse" />
            </div>
          </div>
        )}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-2">
        <div className="text-muted-foreground flex-1 text-sm">
          {selectable ? (
            <span>
              {table.getFilteredSelectedRowModel().rows.length} of{" "}
              {table.getFilteredRowModel().rows.length} row(s) selected.
            </span>
          ) : (
            <span>
              Showing{" "}
              {table.getState().pagination.pageIndex *
                table.getState().pagination.pageSize +
                1}{" "}
              to{" "}
              {Math.min(
                (table.getState().pagination.pageIndex + 1) *
                  table.getState().pagination.pageSize,
                table.getFilteredRowModel().rows.length,
              )}{" "}
              of {table.getFilteredRowModel().rows.length} results
            </span>
          )}
        </div>
        <div className="flex items-center space-x-6 lg:space-x-8">
          <div className="flex items-center space-x-2">
            <p className="text-sm font-medium">Rows per page</p>
            <select
              value={table.getState().pagination.pageSize}
              onChange={(e) => {
                table.setPageSize(Number(e.target.value));
              }}
              className="h-8 w-[70px] rounded-md border bg-transparent px-2 text-sm"
            >
              {VALID_PAGE_SIZES.map((pageSize) => (
                <option key={pageSize} value={pageSize}>
                  {pageSize}
                </option>
              ))}
            </select>
          </div>
          <div className="flex w-[100px] items-center justify-center text-sm font-medium">
            Page {table.getState().pagination.pageIndex + 1} of{" "}
            {table.getPageCount()}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
            >
              <span className="sr-only">Go to first page</span>
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <span className="sr-only">Go to previous page</span>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <span className="sr-only">Go to next page</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
            >
              <span className="sr-only">Go to last page</span>
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Helper component for sortable column headers
 */
export function DataTableColumnHeader<TData, TValue>({
  column,
  title,
  className,
}: {
  column: Column<TData, TValue>;
  title: string;
  className?: string;
}) {
  if (!column.getCanSort()) {
    return <div className={className}>{title}</div>;
  }

  return (
    <div className={cn("flex items-center space-x-2", className)}>
      <Button
        variant="ghost"
        size="sm"
        className="data-[state=open]:bg-accent -ml-3 h-8"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        <span>{title}</span>
        {column.getIsSorted() === "desc" ? (
          <ArrowDown className="ml-2 h-4 w-4" />
        ) : column.getIsSorted() === "asc" ? (
          <ArrowUp className="ml-2 h-4 w-4" />
        ) : (
          <ArrowUpDown className="ml-2 h-4 w-4" />
        )}
      </Button>
    </div>
  );
}
