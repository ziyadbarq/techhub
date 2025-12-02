/**
 * useTableState Hook
 *
 * Orchestrator hook managing all TanStack Table state with optional URL sync and column persistence.
 * Provides controlled state for DataTable component or manual table implementations.
 *
 * @example
 * ```tsx
 * const tableState = useTableState({
 *   enableUrlSync: true,
 *   urlSyncOptions: {
 *     pagination: { key: 'page', pageSizeKey: 'pageSize', defaultPageSize: 25 },
 *     sorting: { key: 'sort', orderKey: 'order' },
 *     columnVisibility: { key: 'hide' },
 *   },
 *   enableColumnPersistence: true,
 *   storageKey: 'my-table-columns',
 *   initialState: {
 *     pagination: { pageIndex: 0, pageSize: 25 },
 *     columnVisibility: { email: false, phone: false },
 *   },
 * });
 *
 * // Use with DataTable
 * <DataTable
 *   controlledState={{
 *     sorting: tableState.sorting,
 *     columnFilters: tableState.columnFilters,
 *     pagination: tableState.pagination,
 *     columnVisibility: tableState.columnVisibility,
 *   }}
 *   onSortingChange={tableState.setSorting}
 *   onColumnFiltersChange={tableState.setColumnFilters}
 *   onPaginationChange={tableState.setPagination}
 *   onColumnVisibilityChange={tableState.setColumnVisibility}
 * />
 * ```
 */

"use client";

import { useCallback, useState } from "react";
import type {
  SortingState,
  ColumnFiltersState,
  VisibilityState,
  PaginationState,
} from "@tanstack/react-table";
import { useUrlSync } from "./use-url-sync";
import { useColumnVisibility } from "./use-column-visibility";

export interface UrlSyncPaginationOptions {
  /** URL parameter key for page number */
  key?: string;
  /** URL parameter key for page size */
  pageSizeKey?: string;
  /** Default page size */
  defaultPageSize?: number;
}

export interface UrlSyncSortingOptions {
  /** URL parameter key for sort field */
  key?: string;
  /** URL parameter key for sort order (asc/desc) */
  orderKey?: string;
}

export interface UrlSyncColumnVisibilityOptions {
  /** URL parameter key for hidden columns (comma-separated) */
  key?: string;
}

export interface UrlSyncOptions {
  pagination?: UrlSyncPaginationOptions;
  sorting?: UrlSyncSortingOptions;
  columnVisibility?: UrlSyncColumnVisibilityOptions;
}

export interface UseTableStateOptions {
  /** Enable URL parameter synchronization */
  enableUrlSync?: boolean;
  /** URL sync configuration */
  urlSyncOptions?: UrlSyncOptions;
  /** Enable localStorage persistence for column visibility */
  enableColumnPersistence?: boolean;
  /** localStorage key for column visibility */
  storageKey?: string;
  /** Initial table state */
  initialState?: {
    sorting?: SortingState;
    columnFilters?: ColumnFiltersState;
    pagination?: PaginationState;
    columnVisibility?: VisibilityState;
    rowSelection?: Record<string, boolean>;
  };
}

export interface UseTableStateReturn {
  /** Current sorting state */
  sorting: SortingState;
  /** Current column filters state */
  columnFilters: ColumnFiltersState;
  /** Current pagination state */
  pagination: PaginationState;
  /** Current column visibility state */
  columnVisibility: VisibilityState;
  /** Current row selection state */
  rowSelection: Record<string, boolean>;
  /** Set sorting state */
  setSorting: (
    sorting: SortingState | ((prev: SortingState) => SortingState),
  ) => void;
  /** Set column filters state */
  setColumnFilters: (
    filters:
      | ColumnFiltersState
      | ((prev: ColumnFiltersState) => ColumnFiltersState),
  ) => void;
  /** Set pagination state */
  setPagination: (
    pagination: PaginationState | ((prev: PaginationState) => PaginationState),
  ) => void;
  /** Set column visibility state */
  setColumnVisibility: (
    visibility: VisibilityState | ((prev: VisibilityState) => VisibilityState),
  ) => void;
  /** Set row selection state */
  setRowSelection: (
    selection:
      | Record<string, boolean>
      | ((prev: Record<string, boolean>) => Record<string, boolean>),
  ) => void;
  /** Reset pagination to first page */
  resetPagination: () => void;
  /** Reset all column filters */
  resetFilters: () => void;
  /** Reset all state to initial values */
  resetAll: () => void;
}

/**
 * Hook for managing all TanStack Table state
 */
export function useTableState({
  enableUrlSync = false,
  urlSyncOptions = {},
  enableColumnPersistence = false,
  storageKey,
  initialState = {},
}: UseTableStateOptions = {}): UseTableStateReturn {
  const {
    sorting: initialSorting = [],
    columnFilters: initialColumnFilters = [],
    pagination: initialPagination = { pageIndex: 0, pageSize: 10 },
    columnVisibility: initialColumnVisibility = {},
    rowSelection: initialRowSelection = {},
  } = initialState;

  // State management
  const [sortingState, setSortingState] =
    useState<SortingState>(initialSorting);
  const [columnFilters, setColumnFilters] =
    useState<ColumnFiltersState>(initialColumnFilters);
  const [paginationState, setPaginationState] =
    useState<PaginationState>(initialPagination);
  const [rowSelection, setRowSelection] =
    useState<Record<string, boolean>>(initialRowSelection);

  // Column visibility with localStorage persistence
  const columnVisibilityHook = useColumnVisibility({
    storageKey: enableColumnPersistence ? storageKey : undefined,
    initialVisibility: initialColumnVisibility,
    enableUrlSync,
    urlParamKey: urlSyncOptions.columnVisibility?.key ?? "hide",
  });

  // URL sync for pagination and sorting
  const urlState = useUrlSync({
    params: {
      page: {
        type: "number",
        defaultValue: initialPagination.pageIndex + 1, // 1-indexed in URL
      },
      pageSize: {
        type: "number",
        defaultValue:
          urlSyncOptions.pagination?.defaultPageSize ??
          initialPagination.pageSize,
      },
      sort: {
        type: "string",
        defaultValue: "",
      },
      order: {
        type: "string",
        defaultValue: "",
      },
    },
    debounceMs: 300,
  });
  const { values: urlValues, setValues: setUrlValues } = urlState;

  const sortingFromUrl =
    urlValues.sort && urlValues.order
      ? [
          {
            id: urlValues.sort,
            desc: urlValues.order === "desc",
          },
        ]
      : undefined;

  const sorting = enableUrlSync
    ? (sortingFromUrl ?? sortingState)
    : sortingState;
  const pagination = enableUrlSync
    ? { pageIndex: urlValues.page - 1, pageSize: urlValues.pageSize }
    : paginationState;

  const setSorting = useCallback(
    (value: SortingState | ((prev: SortingState) => SortingState)) => {
      setSortingState((prev) => {
        const next = typeof value === "function" ? value(prev) : value;

        if (enableUrlSync) {
          const nextSort = next[0];
          setUrlValues({
            sort: nextSort?.id ?? "",
            order: nextSort ? (nextSort.desc ? "desc" : "asc") : "",
          });
        }

        return next;
      });
    },
    [enableUrlSync, setUrlValues],
  );

  const setPagination = useCallback(
    (value: PaginationState | ((prev: PaginationState) => PaginationState)) => {
      setPaginationState((prev) => {
        const base = enableUrlSync
          ? { pageIndex: urlValues.page - 1, pageSize: urlValues.pageSize }
          : prev;
        const next = typeof value === "function" ? value(base) : value;

        if (enableUrlSync) {
          setUrlValues({
            page: next.pageIndex + 1,
            pageSize: next.pageSize,
          });
        }

        return next;
      });
    },
    [enableUrlSync, setUrlValues, urlValues.page, urlValues.pageSize],
  );

  // Reset pagination to first page
  const resetPagination = useCallback(() => {
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, [setPagination]);

  // Reset all column filters
  const resetFilters = useCallback(() => {
    setColumnFilters([]);
  }, []);

  // Reset all state to initial values
  const resetAll = useCallback(() => {
    setSorting(initialSorting);
    setColumnFilters(initialColumnFilters);
    setPagination(initialPagination);
    columnVisibilityHook.resetToDefaults();
    setRowSelection(initialRowSelection);
  }, [
    columnVisibilityHook,
    initialColumnFilters,
    initialPagination,
    initialRowSelection,
    initialSorting,
    setPagination,
    setSorting,
  ]);

  return {
    sorting,
    columnFilters,
    pagination,
    columnVisibility: columnVisibilityHook.visibility,
    rowSelection,
    setSorting,
    setColumnFilters,
    setPagination,
    setColumnVisibility: (visibility) => {
      if (typeof visibility === "function") {
        columnVisibilityHook.setVisibility(
          visibility(columnVisibilityHook.visibility),
        );
      } else {
        columnVisibilityHook.setVisibility(visibility);
      }
    },
    setRowSelection,
    resetPagination,
    resetFilters,
    resetAll,
  };
}
