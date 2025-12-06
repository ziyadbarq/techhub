/**
 * Enhanced useColumnVisibility Hook
 *
 * Extends the base useColumnVisibility hook with automatic hiddenByDefault extraction.
 * Manages table column visibility with localStorage persistence and optional URL sync.
 *
 * @example
 * ```tsx
 * // Simple usage - extracts hiddenByDefault from column meta automatically
 * const { visibility, onVisibilityChange } = useColumnVisibilityEnhanced({
 *   storageKey: 'asset-reservations-columns',
 *   columns,
 * });
 *
 * <DataTable
 *   columns={columns}
 *   data={data}
 *   initialColumnVisibility={visibility}
 *   onColumnVisibilityChange={onVisibilityChange}
 * />
 * ```
 */

"use client";

import { useMemo, useCallback } from "react";
import type {
  ColumnDef,
  VisibilityState,
  Updater,
} from "@tanstack/react-table";
import {
  useColumnVisibility,
  type UseColumnVisibilityOptions,
} from "./use-column-visibility";

interface ColumnMeta {
  hiddenByDefault?: boolean;
  label?: string;
  [key: string]: unknown;
}

interface UseColumnVisibilityEnhancedOptions<TData = unknown>
  extends Omit<UseColumnVisibilityOptions, "initialVisibility"> {
  /** Column definitions to extract hiddenByDefault meta from */
  columns?: ColumnDef<TData, unknown>[];
  /** Optional override for initial visibility */
  initialVisibility?: VisibilityState;
}

/**
 * Extract initial visibility from column definitions based on hiddenByDefault meta
 */
function extractHiddenByDefault<TData>(
  columns: ColumnDef<TData, unknown>[],
): VisibilityState {
  const visibility: VisibilityState = {};

  columns.forEach((column) => {
    // Get column ID from either id or accessorKey
    const columnId =
      "id" in column && column.id
        ? column.id
        : "accessorKey" in column && typeof column.accessorKey === "string"
          ? column.accessorKey
          : null;

    if (columnId) {
      const meta = column.meta as ColumnMeta | undefined;
      if (meta?.hiddenByDefault === true) {
        visibility[columnId] = false;
      }
    }
  });

  return visibility;
}

/**
 * Enhanced hook that combines column meta extraction with visibility management
 */
export function useColumnVisibilityEnhanced<TData = unknown>({
  columns,
  initialVisibility,
  ...options
}: UseColumnVisibilityEnhancedOptions<TData>) {
  // Extract hiddenByDefault from columns if provided
  const defaultVisibility = useMemo(() => {
    if (columns) {
      return extractHiddenByDefault(columns);
    }
    return {};
  }, [columns]);

  // Merge: explicit initialVisibility takes precedence over extracted defaults
  const mergedInitialVisibility = useMemo(() => {
    return { ...defaultVisibility, ...initialVisibility };
  }, [defaultVisibility, initialVisibility]);

  // Use the base hook with merged initial visibility
  const columnVisibility = useColumnVisibility({
    ...options,
    initialVisibility: mergedInitialVisibility,
  });

  // Create TanStack-compatible onChange handler that accepts both values and updater functions
  const onVisibilityChange = useCallback(
    (updaterOrValue: Updater<VisibilityState>) => {
      if (typeof updaterOrValue === "function") {
        // It's an updater function - call setVisibility with the result
        columnVisibility.setVisibility(
          updaterOrValue(columnVisibility.visibility),
        );
      } else {
        // It's a direct value
        columnVisibility.setVisibility(updaterOrValue);
      }
    },
    [columnVisibility],
  );

  // Return compatible interface for both DataTable component and custom TanStack implementations
  return {
    ...columnVisibility,
    onVisibilityChange,
  };
}
