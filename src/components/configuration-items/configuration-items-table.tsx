/**
 * Configuration Items Table Component
 *
 * Standardized table implementation using hooks-based architecture and DRY utilities.
 * Migrated from 600 lines to ~350 lines using reusable patterns.
 *
 * Features:
 * - URL state sync (pagination, sorting, column visibility)
 * - Debounced search (250ms)
 * - Preset filters (Prod Critical, Unlinked Assets, Orphaned Owners)
 * - Column visibility toggle with localStorage persistence
 * - Stale data indicators (items > 90 days old)
 */

"use client";

import { useMemo } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";

import { DataTable, DataTableColumnHeader } from "@/components/ui/data-table";
import { TableSearch } from "@/components/ui/table-search";
import { TableFilterSelect } from "@/components/ui/table-filter-select";
import { TablePresetFilters } from "@/components/ui/table-preset-filters";
import { Badge } from "@/components/ui/badge";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import type { ConfigurationItemDTO } from "@/interface-adapters/dtos/generated/configuration-item.dto";
import { deleteConfigurationItemAction } from "@/interface-adapters/controllers/configuration-item.controller";
import { useDeleteDialog } from "@/hooks/use-delete-dialog";
import { useTableState } from "@/hooks/use-table-state";
import { useTableFilters } from "@/hooks/use-table-filters";
import { usePresetFilters } from "@/hooks/use-preset-filters";
import { formatRelativeTime } from "@/lib/utils/date-format";
import { getStatusBadgeClasses } from "@/lib/utils/status-colors";
import { buildActionsColumn } from "@/lib/table-utils";
import {
  CRITICALITY_STATUS_MAP,
  ENVIRONMENT_STATUS_MAP,
  isCIStale,
} from "./configuration-items-helpers";

// ============================================================================
// TYPES & CONSTANTS
// ============================================================================

interface ConfigurationItemsTableProps {
  data: ConfigurationItemDTO[];
  loading?: boolean;
  onView: (item: ConfigurationItemDTO) => void;
  onEdit: (item: ConfigurationItemDTO) => void;
  onRefresh: () => void;
}

interface FilterValues extends Record<string, unknown> {
  criticality: string;
  environment: string;
  owner: string;
  assetLink: string;
}

const DEFAULT_HIDDEN_COLUMNS = {
  ciKey: false,
  primaryOwnerName: false,
  updatedAt: false,
  actions: false,
  // Custom attribute fields - hidden by default
  ipv4: false,
  ipv6: false,
  macAddress: false,
  fqdn: false,
  gateway: false,
  primaryDns: false,
  secondaryDns: false,
} as const;

const CRITICALITY_OPTIONS = [
  { value: "LOW", label: "Low" },
  { value: "MEDIUM", label: "Medium" },
  { value: "HIGH", label: "High" },
  { value: "CRITICAL", label: "Critical" },
];

const ENVIRONMENT_OPTIONS = [
  { value: "PROD", label: "Production" },
  { value: "UAT", label: "UAT" },
  { value: "DEV", label: "Development" },
  { value: "TEST", label: "Test" },
  { value: "DR", label: "Disaster Recovery" },
  { value: "OTHER", label: "Other" },
];

const PRESET_FILTERS = [
  {
    key: "prod-critical",
    label: "Prod Critical",
    description: "Critical items in production",
    filters: { criticality: "CRITICAL", environment: "PROD" },
  },
  {
    key: "unlinked-assets",
    label: "Unlinked to Assets",
    description: "CIs without a linked asset",
    filters: { assetLink: "unlinked" },
  },
  {
    key: "orphaned",
    label: "Orphaned Owners",
    description: "Missing primary owner",
    filters: { owner: "none" },
  },
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Extract custom attribute value from CI attributes JSON
 */
function getAttributeValue(
  attributes: Record<string, unknown> | null | undefined,
  key: string,
): string | null {
  if (!attributes) return null;
  const value = attributes[key];
  return value != null ? String(value) : null;
}

// ============================================================================
// COLUMN BUILDERS
// ============================================================================

function buildNameColumn(
  onView: (item: ConfigurationItemDTO) => void,
): ColumnDef<ConfigurationItemDTO> {
  return {
    accessorKey: "name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Name" />
    ),
    meta: { label: "Name" },
    cell: ({ row }) => (
      <button
        type="button"
        onClick={() => onView(row.original)}
        className="text-left font-medium hover:underline"
      >
        {row.getValue<string>("name")}
      </button>
    ),
  };
}

function buildLinkedAssetColumn(): ColumnDef<ConfigurationItemDTO> {
  return {
    accessorKey: "linkedAssetTag",
    header: "Asset",
    meta: { label: "Linked Asset" },
    cell: ({ row }) => {
      const assetTag = row.original.linkedAssetTag;
      if (!assetTag) {
        return (
          <Badge variant="outline" className="text-muted-foreground">
            Unlinked
          </Badge>
        );
      }
      return (
        <Link
          href={`/assets/${assetTag}`}
          className="text-primary font-mono text-xs hover:underline"
        >
          {assetTag}
        </Link>
      );
    },
  };
}

function buildCriticalityColumn(): ColumnDef<ConfigurationItemDTO> {
  return {
    accessorKey: "criticality",
    header: "Criticality",
    meta: { label: "Criticality" },
    cell: ({ row }) => {
      const criticality = row.original.criticality;
      if (!criticality) return <span className="text-muted-foreground">—</span>;
      return (
        <Badge
          variant="outline"
          className={getStatusBadgeClasses(
            CRITICALITY_STATUS_MAP[criticality] ?? "info",
          )}
        >
          {criticality}
        </Badge>
      );
    },
  };
}

function buildEnvironmentColumn(): ColumnDef<ConfigurationItemDTO> {
  return {
    accessorKey: "environment",
    header: "Environment",
    meta: { label: "Environment" },
    cell: ({ row }) => {
      const environment = row.original.environment;
      if (!environment) return <span className="text-muted-foreground">—</span>;
      return (
        <Badge
          variant="outline"
          className={getStatusBadgeClasses(
            ENVIRONMENT_STATUS_MAP[environment] ?? "info",
          )}
        >
          {environment}
        </Badge>
      );
    },
  };
}

function buildUpdatedColumn(): ColumnDef<ConfigurationItemDTO> {
  return {
    accessorKey: "updatedAt",
    header: "Updated",
    meta: { label: "Last Updated" },
    cell: ({ row }) => {
      const stale = isCIStale(row.original.updatedAt);
      return (
        <div className="text-muted-foreground flex items-center gap-2 text-xs">
          <span>{formatRelativeTime(row.original.updatedAt)}</span>
          {stale && (
            <Badge variant="outline" className="border-amber-200 bg-amber-50">
              Stale
            </Badge>
          )}
        </div>
      );
    },
    enableHiding: true,
  };
}

function buildCustomAttributeColumn(
  id: string,
  attributeKey: string,
  label: string,
): ColumnDef<ConfigurationItemDTO> {
  return {
    id,
    accessorFn: (row) =>
      getAttributeValue(
        row.attributes as Record<string, unknown> | null,
        attributeKey,
      ),
    header: label,
    meta: { label },
    cell: ({ row }) => {
      const value = getAttributeValue(
        row.original.attributes as Record<string, unknown> | null,
        attributeKey,
      );
      return <div className="font-mono text-xs">{value ?? "—"}</div>;
    },
    enableHiding: true,
  };
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function ConfigurationItemsTable({
  data,
  loading,
  onView,
  onEdit,
  onRefresh,
}: ConfigurationItemsTableProps) {
  // ==================== STATE MANAGEMENT ====================

  // Delete dialog hook
  const deleteDialog = useDeleteDialog<ConfigurationItemDTO>({
    onDelete: (item) => deleteConfigurationItemAction(item.id),
    onSuccess: onRefresh,
    getItemName: (item) => item.name,
    entityName: "Configuration Item",
  });

  // Table state (sorting, pagination, column visibility) with URL sync
  const tableState = useTableState({
    enableUrlSync: true,
    urlSyncOptions: {
      pagination: { defaultPageSize: 25 },
      columnVisibility: { key: "hide" },
    },
    initialState: {
      pagination: { pageIndex: 0, pageSize: 25 },
      columnVisibility: DEFAULT_HIDDEN_COLUMNS,
    },
  });

  // Filter state (search term + dropdown filters)
  const filters = useTableFilters<FilterValues>({
    initialFilters: {
      criticality: "all",
      environment: "all",
      owner: "all",
      assetLink: "all",
    },
    searchConfig: { debounceMs: 250 },
    onFilterChange: tableState.resetPagination,
  });

  // Preset filter combinations
  const presets = usePresetFilters({
    presets: PRESET_FILTERS,
    onApply: filters.setFilters,
    onClear: filters.clearFilters,
  });

  // ==================== DERIVED STATE ====================

  // Filter data based on current filter state
  const filteredData = useMemo(() => {
    let result = data;

    // Apply search filter
    if (filters.debouncedSearchTerm) {
      const term = filters.debouncedSearchTerm.toLowerCase();
      result = result.filter(
        (item) =>
          item.name.toLowerCase().includes(term) ||
          (item.ciKey?.toLowerCase().includes(term) ?? false),
      );
    }

    // Apply criticality filter
    if (filters.filters.criticality !== "all") {
      result = result.filter(
        (item) => item.criticality === filters.filters.criticality,
      );
    }

    // Apply environment filter
    if (filters.filters.environment !== "all") {
      result = result.filter(
        (item) => item.environment === filters.filters.environment,
      );
    }

    // Apply owner filter
    if (filters.filters.owner === "none") {
      result = result.filter((item) => !item.primaryOwnerName);
    }

    // Apply asset link filter
    if (filters.filters.assetLink === "unlinked") {
      result = result.filter((item) => !item.linkedAssetTag);
    }

    return result;
  }, [data, filters.debouncedSearchTerm, filters.filters]);

  // Column definitions
  const columns = useMemo<ColumnDef<ConfigurationItemDTO>[]>(
    () => [
      buildNameColumn(onView),
      {
        accessorKey: "ciClassName",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="CI Class" />
        ),
        meta: { label: "CI Class" },
        cell: ({ row }) => (
          <div className="text-sm">{row.original.ciClassName || "—"}</div>
        ),
      },
      {
        accessorKey: "ciKey",
        header: "CI Key",
        meta: { label: "CI Key" },
        cell: ({ row }) => (
          <div className="font-mono text-xs">{row.original.ciKey || "—"}</div>
        ),
        enableHiding: true,
      },
      buildLinkedAssetColumn(),
      buildCriticalityColumn(),
      buildEnvironmentColumn(),
      {
        accessorKey: "primaryOwnerName",
        header: "Owner",
        meta: { label: "Owner" },
        cell: ({ row }) => (
          <div className="text-sm">{row.original.primaryOwnerName || "—"}</div>
        ),
        enableHiding: true,
      },
      buildUpdatedColumn(),
      // Custom attribute columns
      buildCustomAttributeColumn("ipv4", "PRIMARY_IPV4", "IPv4 Address"),
      buildCustomAttributeColumn("ipv6", "PRIMARY_IPV6", "IPv6 Address"),
      buildCustomAttributeColumn("macAddress", "MAC_ADDRESS_CI", "MAC Address"),
      buildCustomAttributeColumn("fqdn", "FQDN", "FQDN"),
      buildCustomAttributeColumn("gateway", "DEFAULT_GATEWAY", "Gateway"),
      buildCustomAttributeColumn("primaryDns", "PRIMARY_DNS", "Primary DNS"),
      buildCustomAttributeColumn(
        "secondaryDns",
        "SECONDARY_DNS",
        "Secondary DNS",
      ),
      buildActionsColumn<ConfigurationItemDTO>([
        {
          type: "view",
          label: "View",
          onClick: onView,
        },
        {
          type: "edit",
          label: "Edit",
          permission: PERMISSIONS.CONFIGURATION_ITEMS_UPDATE,
          onClick: onEdit,
        },
        {
          type: "delete",
          label: "Delete",
          permission: PERMISSIONS.CONFIGURATION_ITEMS_DELETE,
          variant: "destructive",
          separator: true,
          onClick: deleteDialog.openDialog,
        },
      ]),
    ],
    [onView, onEdit, deleteDialog.openDialog],
  );

  // ==================== RENDER ====================

  return (
    <>
      <DataTable
        columns={columns}
        data={filteredData}
        loading={loading}
        controlledState={{
          sorting: tableState.sorting,
          pagination: tableState.pagination,
          columnVisibility: tableState.columnVisibility,
        }}
        onSortingChange={tableState.setSorting}
        onPaginationChange={tableState.setPagination}
        onColumnVisibilityChange={tableState.setColumnVisibility}
        showColumnToggle
        emptyMessage="No configuration items found"
        toolbarSlot={
          <div className="flex flex-1 flex-wrap items-center gap-3">
            <TableSearch
              value={filters.searchTerm}
              onChange={filters.setSearchTerm}
              placeholder="Search by name or CI key..."
              loading={loading}
            />
            <TableFilterSelect
              value={filters.filters.criticality}
              onChange={(v) => filters.setFilter("criticality", v)}
              options={CRITICALITY_OPTIONS}
              placeholder="Criticality"
              allLabel="All Criticality"
            />
            <TableFilterSelect
              value={filters.filters.environment}
              onChange={(v) => filters.setFilter("environment", v)}
              options={ENVIRONMENT_OPTIONS}
              placeholder="Environment"
              allLabel="All Environments"
            />
            <TableFilterSelect
              value={filters.filters.owner}
              onChange={(v) => filters.setFilter("owner", v)}
              options={[{ value: "none", label: "Missing owner" }]}
              placeholder="Ownership"
              allLabel="All Owners"
            />
            <TableFilterSelect
              value={filters.filters.assetLink}
              onChange={(v) => filters.setFilter("assetLink", v)}
              options={[{ value: "unlinked", label: "Unlinked only" }]}
              placeholder="Asset Link"
              allLabel="All"
            />
          </div>
        }
        presetFilters={
          <TablePresetFilters
            presets={presets.presets}
            activePreset={presets.activePreset}
            onApply={presets.applyPreset}
            onClear={presets.clearPreset}
          />
        }
      />

      {/* Delete Confirmation Dialog */}
      <deleteDialog.DialogComponent />
    </>
  );
}
