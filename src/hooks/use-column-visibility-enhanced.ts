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

import { useMemo, useCallback, useEffect, useRef } from "react";
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

interface UseColumnVisibilityEnhancedOptions<TData = unknown> extends Omit<
  UseColumnVisibilityOptions,
  "initialVisibility"
> {
  /** Column definitions to extract hiddenByDefault meta from */
  columns?: ColumnDef<TData, unknown>[];
  /** Optional override for initial visibility */
  initialVisibility?: VisibilityState;
  /**
   * Extra column ids to hide by default, for callers that decide per screen
   * rather than in the shared column definitions.
   */
  extraHiddenColumnIds?: string[];
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
  extraHiddenColumnIds,
  ...options
}: UseColumnVisibilityEnhancedOptions<TData>) {
  // Extract hiddenByDefault from columns if provided
  const defaultVisibility = useMemo(() => {
    if (columns) {
      return extractHiddenByDefault(columns);
    }
    return {};
  }, [columns]);

  const extraHidden = useMemo(() => {
    const hidden: VisibilityState = {};
    for (const columnId of extraHiddenColumnIds ?? []) {
      hidden[columnId] = false;
    }
    return hidden;
  }, [extraHiddenColumnIds]);

  // Merge: explicit initialVisibility takes precedence over extracted defaults
  const mergedInitialVisibility = useMemo(() => {
    return { ...defaultVisibility, ...extraHidden, ...initialVisibility };
  }, [defaultVisibility, extraHidden, initialVisibility]);

  // Use the base hook with merged initial visibility
  const columnVisibility = useColumnVisibility({
    ...options,
    initialVisibility: mergedInitialVisibility,
  });

  // The base hook seeds its state once, in a useState initializer. Columns that
  // only show up later - custom field columns are fetched after mount - would
  // therefore never have their hiddenByDefault applied and would render
  // visible. Apply each column's default the first time we see it, and only
  // when the user has no stored preference for it, so explicit choices win.
  const { setVisibility, visibility } = columnVisibility;
  const seenColumnsRef = useRef<Set<string>>(new Set());
  const visibilityRef = useRef(visibility);

  useEffect(() => {
    visibilityRef.current = visibility;
  }, [visibility]);

  useEffect(() => {
    const pending: VisibilityState = {};

    for (const [columnId, isVisible] of Object.entries(
      mergedInitialVisibility,
    )) {
      if (seenColumnsRef.current.has(columnId)) continue;
      seenColumnsRef.current.add(columnId);

      if (visibilityRef.current[columnId] === undefined) {
        pending[columnId] = isVisible;
      }
    }

    if (Object.keys(pending).length > 0) {
      setVisibility(pending);
    }
  }, [mergedInitialVisibility, setVisibility]);

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
