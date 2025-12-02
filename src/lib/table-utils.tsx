/**
 * Table Utilities
 *
 * Reusable utilities for building common table columns and actions.
 * Eliminates hundreds of lines of boilerplate across table components.
 */

"use client";

import type { ColumnDef } from "@tanstack/react-table";
import type { LucideIcon } from "lucide-react";
import { MoreHorizontal, Pencil, Trash2, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { usePermissions } from "@/hooks/use-permissions";
import type { PermissionKey } from "@/core/domain/value-objects/permission-key";

/**
 * Build standard select checkbox column
 *
 * @example
 * ```tsx
 * const columns: ColumnDef<AssetDTO>[] = [
 *   buildSelectColumn<AssetDTO>(),
 *   // ... other columns
 * ];
 * ```
 */
export function buildSelectColumn<T>(): ColumnDef<T> {
  return {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  };
}

/**
 * Table action configuration
 */
export interface TableAction<T> {
  /** Action type (affects default icon and styling) */
  type: "view" | "edit" | "delete" | "custom";
  /** Action label */
  label: string;
  /** Optional icon override */
  icon?: LucideIcon;
  /** Permission required to show this action */
  permission?: PermissionKey;
  /** Variant styling */
  variant?: "default" | "destructive";
  /** Click handler */
  onClick: (item: T) => void;
  /** Optional function to hide action for specific items */
  hidden?: (item: T) => boolean;
  /** Whether to show a separator before this action */
  separator?: boolean;
}

/**
 * Default icons for action types
 */
const defaultIcons: Record<string, LucideIcon> = {
  view: Eye,
  edit: Pencil,
  delete: Trash2,
};

/**
 * Build actions column with dropdown menu
 *
 * @example
 * ```tsx
 * const actionsColumn = buildActionsColumn<AssetDTO>([
 *   {
 *     type: 'edit',
 *     label: 'Edit',
 *     permission: PERMISSIONS.ASSETS_UPDATE,
 *     onClick: onEdit,
 *   },
 *   {
 *     type: 'delete',
 *     label: 'Delete',
 *     permission: PERMISSIONS.ASSETS_DELETE,
 *     variant: 'destructive',
 *     separator: true,
 *     onClick: deleteDialog.openDialog,
 *   },
 * ]);
 * ```
 */
export function buildActionsColumn<T>(actions: TableAction<T>[]): ColumnDef<T> {
  return {
    id: "actions",
    cell: function ActionsCell({ row }) {
      const item = row.original;
      const { hasPermission } = usePermissions();

      const visibleActions = actions.filter((action) => {
        // Check if action is hidden for this specific item
        if (action.hidden && action.hidden(item)) return false;

        // Check permission
        if (action.permission && !hasPermission(action.permission)) {
          return false;
        }

        return true;
      });

      if (visibleActions.length === 0) return null;

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
            {visibleActions.map((action, idx) => {
              const Icon = action.icon || defaultIcons[action.type];
              const isDestructive = action.variant === "destructive";
              const showSeparator =
                action.separator || (action.type === "delete" && idx > 0);

              return (
                <div key={idx}>
                  {showSeparator && <DropdownMenuSeparator />}
                  <DropdownMenuItem
                    onClick={() => action.onClick(item)}
                    className={isDestructive ? "text-destructive" : ""}
                  >
                    {Icon && <Icon className="mr-2 h-4 w-4" />}
                    {action.label}
                  </DropdownMenuItem>
                </div>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  };
}
