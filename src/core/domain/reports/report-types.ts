/**
 * Report Definition Types
 *
 * Type definitions for the pre-defined reports system.
 * Reports are configured as static definitions, not database records.
 */

import type { PermissionKey } from "@/core/domain/value-objects/permission-key";

/**
 * Report categories for grouping in the UI
 */
export type ReportCategory = "assets" | "cmdb";

/**
 * Column data types for formatting
 */
export type ReportColumnType =
  | "string"
  | "number"
  | "currency"
  | "date"
  | "badge"
  | "percentage";

/**
 * Filter control types
 */
export type ReportFilterType = "date-range" | "select" | "multi-select";

/**
 * A column definition in a report
 */
export interface ReportColumnDefinition {
  /** Property key in the data row */
  key: string;
  /** Display label for the column header */
  label: string;
  /** Data type for formatting */
  type: ReportColumnType;
  /** Text alignment */
  align?: "left" | "center" | "right";
  /** Whether the column is sortable */
  sortable?: boolean;
}

/**
 * A filter option for select/multi-select filters
 */
export interface ReportFilterOption {
  label: string;
  value: string;
}

/**
 * Sources for dynamically loaded filter options.
 * Each maps to a database entity that provides {id, name} pairs.
 */
export type FilterOptionsSource =
  | "assetCategories"
  | "lifecycleStates"
  | "departments"
  | "stockLocations"
  | "vendors"
  | "ciClasses"
  | "relationshipTypes";

/**
 * A filter definition for a report
 */
export interface ReportFilterDefinition {
  /** Unique key for this filter */
  key: string;
  /** Display label */
  label: string;
  /** Type of filter control */
  type: ReportFilterType;
  /** For select/multi-select: static options */
  options?: ReportFilterOption[];
  /** For select without static options: load from this DB source */
  optionsSource?: FilterOptionsSource;
  /** Whether this filter is required */
  required?: boolean;
  /** Default value */
  defaultValue?: string | string[];
  /** Placeholder text */
  placeholder?: string;
}

/**
 * Static report definition
 */
export interface ReportDefinition {
  /** Unique identifier (URL-safe slug) */
  id: string;
  /** Display name */
  name: string;
  /** Short description */
  description: string;
  /** Category for grouping */
  category: ReportCategory;
  /** Feature flags required (report hidden if any are disabled) */
  requiredFeatureFlags: string[];
  /** Permission required to view/run this report */
  requiredPermission: PermissionKey;
  /** Available filters */
  filters: ReportFilterDefinition[];
  /** Column definitions */
  columns: ReportColumnDefinition[];
}

/**
 * Summary statistic displayed above the report table
 */
export interface ReportSummaryStat {
  label: string;
  value: string | number;
  /** Optional trend indicator */
  trend?: "up" | "down" | "neutral";
  /** If set, this stat is only shown when this column key is visible */
  columnKey?: string;
}

/**
 * Result of running a report
 */
export interface ReportResult {
  /** Report definition ID */
  reportId: string;
  /** Data rows */
  rows: Record<string, unknown>[];
  /** Total row count (before pagination) */
  totalRows: number;
  /** Summary statistics */
  summaryStats: ReportSummaryStat[];
  /** Applied filters (for display/PDF) */
  appliedFilters: Record<string, string>;
  /** When the report was generated */
  generatedAt: Date;
}

/**
 * Filter values passed when running a report
 */
export interface ReportFilterValues {
  /** Date range filters */
  dateFrom?: string;
  dateTo?: string;
  /** Dynamic key-value pairs from other filters */
  [key: string]: string | string[] | undefined;
}
