/**
 * Report Catalog
 *
 * Static definitions for all pre-defined reports.
 * Reports are hidden at runtime if their required feature flags are disabled.
 */

import type { ReportDefinition } from "./report-types";

/**
 * All available report definitions
 */
export const REPORT_DEFINITIONS: ReportDefinition[] = [
  // ============================================
  // Asset Reports
  // ============================================

  {
    id: "asset-inventory-summary",
    name: "Asset Inventory Summary",
    description:
      "Total assets grouped by category, model, supplier, lifecycle state, and condition.",
    category: "assets",
    requiredFeatureFlags: ["ASSETS"],
    requiredPermission: "reports:view",
    filters: [
      {
        key: "dateFrom",
        label: "From Date",
        type: "date-range",
        placeholder: "Start date",
      },
      {
        key: "dateTo",
        label: "To Date",
        type: "date-range",
        placeholder: "End date",
      },
      {
        key: "categoryId",
        label: "Category",
        type: "select",
        placeholder: "All categories",
      },
      {
        key: "lifecycleStateId",
        label: "Lifecycle State",
        type: "select",
        placeholder: "All states",
      },
    ],
    columns: [
      {
        key: "categoryName",
        label: "Category",
        type: "string",
        sortable: true,
      },
      { key: "modelName", label: "Model", type: "string", sortable: true },
      { key: "vendorName", label: "Supplier", type: "string", sortable: true },
      {
        key: "lifecycleState",
        label: "Lifecycle State",
        type: "badge",
        sortable: true,
      },
      {
        key: "condition",
        label: "Condition",
        type: "badge",
        sortable: true,
      },
      {
        key: "assetCount",
        label: "Count",
        type: "number",
        align: "right",
        sortable: true,
      },
      {
        key: "totalValue",
        label: "Total Value (SAR)",
        type: "currency",
        align: "right",
        sortable: true,
      },
    ],
  },

  {
    id: "asset-financial-summary",
    name: "Asset Financial Summary",
    description:
      "Total asset value, depreciation status, and cost breakdown by department and category.",
    category: "assets",
    requiredFeatureFlags: ["ASSETS"],
    requiredPermission: "reports:view",
    filters: [
      {
        key: "dateFrom",
        label: "From Date",
        type: "date-range",
        placeholder: "Start date",
      },
      {
        key: "dateTo",
        label: "To Date",
        type: "date-range",
        placeholder: "End date",
      },
      {
        key: "departmentId",
        label: "Department",
        type: "select",
        placeholder: "All departments",
      },
      {
        key: "categoryId",
        label: "Category",
        type: "select",
        placeholder: "All categories",
      },
    ],
    columns: [
      {
        key: "departmentName",
        label: "Department",
        type: "string",
        sortable: true,
      },
      {
        key: "categoryName",
        label: "Category",
        type: "string",
        sortable: true,
      },
      {
        key: "assetCount",
        label: "Assets",
        type: "number",
        align: "right",
        sortable: true,
      },
      {
        key: "totalPurchaseCost",
        label: "Purchase Cost (SAR)",
        type: "currency",
        align: "right",
        sortable: true,
      },
      {
        key: "totalCurrentValue",
        label: "Current Value (SAR)",
        type: "currency",
        align: "right",
        sortable: true,
      },
      {
        key: "depreciationTotal",
        label: "Depreciation (SAR)",
        type: "currency",
        align: "right",
        sortable: true,
      },
    ],
  },

  {
    id: "assets-nearing-eol",
    name: "Assets Nearing End of Life",
    description:
      "Assets approaching or past depreciation completion within the selected timeframe.",
    category: "assets",
    requiredFeatureFlags: ["ASSETS"],
    requiredPermission: "reports:view",
    filters: [
      {
        key: "withinDays",
        label: "Within Days",
        type: "select",
        options: [
          { label: "30 days", value: "30" },
          { label: "90 days", value: "90" },
          { label: "180 days", value: "180" },
          { label: "365 days", value: "365" },
        ],
        defaultValue: "365",
      },
      {
        key: "categoryId",
        label: "Category",
        type: "select",
        placeholder: "All categories",
      },
      {
        key: "departmentId",
        label: "Department",
        type: "select",
        placeholder: "All departments",
      },
    ],
    columns: [
      { key: "assetTag", label: "Asset Tag", type: "string", sortable: true },
      {
        key: "categoryName",
        label: "Category",
        type: "string",
        sortable: true,
      },
      {
        key: "purchaseDate",
        label: "Purchase Date",
        type: "date",
        sortable: true,
      },
      {
        key: "depreciationEnd",
        label: "Depreciation End",
        type: "date",
        sortable: true,
      },
      {
        key: "daysUntilEOL",
        label: "Days Until EOL",
        type: "number",
        align: "right",
        sortable: true,
      },
      { key: "status", label: "Status", type: "badge", align: "center" },
    ],
  },

  {
    id: "unassigned-assets",
    name: "Unassigned Assets",
    description:
      "Assets currently in stock and not assigned to any person, department, or location.",
    category: "assets",
    requiredFeatureFlags: ["ASSETS"],
    requiredPermission: "reports:view",
    filters: [
      {
        key: "categoryId",
        label: "Category",
        type: "select",
        placeholder: "All categories",
      },
      {
        key: "stockLocationId",
        label: "Stock Location",
        type: "select",
        placeholder: "All locations",
      },
      {
        key: "condition",
        label: "Condition",
        type: "select",
        options: [
          { label: "New", value: "NEW" },
          { label: "Good", value: "GOOD" },
          { label: "Fair", value: "FAIR" },
          { label: "Poor", value: "POOR" },
        ],
        placeholder: "All conditions",
      },
    ],
    columns: [
      { key: "assetTag", label: "Asset Tag", type: "string", sortable: true },
      {
        key: "categoryName",
        label: "Category",
        type: "string",
        sortable: true,
      },
      { key: "modelName", label: "Model", type: "string", sortable: true },
      {
        key: "condition",
        label: "Condition",
        type: "badge",
        sortable: true,
      },
      {
        key: "stockLocation",
        label: "Stock Location",
        type: "string",
        sortable: true,
      },
      {
        key: "purchaseCostSar",
        label: "Value (SAR)",
        type: "currency",
        align: "right",
        sortable: true,
      },
    ],
  },

  {
    id: "warranty-expiration",
    name: "Warranty Expiration Report",
    description:
      "Warranties expiring within the selected timeframe, grouped by vendor and coverage type.",
    category: "assets",
    requiredFeatureFlags: ["ASSETS"],
    requiredPermission: "reports:view",
    filters: [
      {
        key: "withinDays",
        label: "Expiring Within",
        type: "select",
        options: [
          { label: "30 days", value: "30" },
          { label: "60 days", value: "60" },
          { label: "90 days", value: "90" },
          { label: "180 days", value: "180" },
        ],
        defaultValue: "90",
      },
      {
        key: "vendorId",
        label: "Vendor",
        type: "select",
        placeholder: "All vendors",
      },
      {
        key: "coverageType",
        label: "Coverage Type",
        type: "select",
        options: [
          { label: "Standard", value: "STANDARD" },
          { label: "Extended", value: "EXTENDED" },
          { label: "Enhanced", value: "ENHANCED" },
          { label: "Premium", value: "PREMIUM" },
        ],
        placeholder: "All types",
      },
    ],
    columns: [
      { key: "assetTag", label: "Asset Tag", type: "string", sortable: true },
      { key: "vendorName", label: "Vendor", type: "string", sortable: true },
      {
        key: "coverageType",
        label: "Coverage",
        type: "badge",
        sortable: true,
      },
      { key: "startDate", label: "Start Date", type: "date", sortable: true },
      { key: "endDate", label: "End Date", type: "date", sortable: true },
      {
        key: "daysUntilExpiry",
        label: "Days Left",
        type: "number",
        align: "right",
        sortable: true,
      },
    ],
  },

  {
    id: "asset-assignment-history",
    name: "Asset Assignment History",
    description:
      "Historical record of asset assignments showing who had which asset and for how long.",
    category: "assets",
    requiredFeatureFlags: ["ASSETS"],
    requiredPermission: "reports:view",
    filters: [
      {
        key: "dateFrom",
        label: "From Date",
        type: "date-range",
        placeholder: "Start date",
      },
      {
        key: "dateTo",
        label: "To Date",
        type: "date-range",
        placeholder: "End date",
      },
      {
        key: "categoryId",
        label: "Category",
        type: "select",
        placeholder: "All categories",
      },
      {
        key: "departmentId",
        label: "Department",
        type: "select",
        placeholder: "All departments",
      },
    ],
    columns: [
      { key: "assetTag", label: "Asset Tag", type: "string", sortable: true },
      {
        key: "assigneeName",
        label: "Assigned To",
        type: "string",
        sortable: true,
      },
      {
        key: "assigneeType",
        label: "Type",
        type: "badge",
        sortable: true,
      },
      { key: "startDate", label: "Start Date", type: "date", sortable: true },
      { key: "endDate", label: "End Date", type: "date", sortable: true },
      {
        key: "durationDays",
        label: "Duration (days)",
        type: "number",
        align: "right",
        sortable: true,
      },
    ],
  },

  {
    id: "stock-movement-summary",
    name: "Stock Movement Summary",
    description:
      "Inventory movements (in, out, transfer, adjustment) by period, location, and category.",
    category: "assets",
    requiredFeatureFlags: ["ASSETS"],
    requiredPermission: "reports:view",
    filters: [
      {
        key: "dateFrom",
        label: "From Date",
        type: "date-range",
        placeholder: "Start date",
      },
      {
        key: "dateTo",
        label: "To Date",
        type: "date-range",
        placeholder: "End date",
      },
      {
        key: "movementType",
        label: "Movement Type",
        type: "select",
        options: [
          { label: "In", value: "IN" },
          { label: "Out", value: "OUT" },
          { label: "Transfer", value: "TRANSFER" },
          { label: "Adjustment", value: "ADJUSTMENT" },
        ],
        placeholder: "All types",
      },
      {
        key: "stockLocationId",
        label: "Location",
        type: "select",
        placeholder: "All locations",
      },
    ],
    columns: [
      {
        key: "movementType",
        label: "Type",
        type: "badge",
        sortable: true,
      },
      { key: "assetTag", label: "Asset Tag", type: "string", sortable: true },
      {
        key: "fromLocation",
        label: "From",
        type: "string",
        sortable: true,
      },
      { key: "toLocation", label: "To", type: "string", sortable: true },
      { key: "reason", label: "Reason", type: "string" },
      { key: "movedAt", label: "Date", type: "date", sortable: true },
      { key: "movedBy", label: "Moved By", type: "string", sortable: true },
    ],
  },

  // ============================================
  // CMDB Reports
  // ============================================

  {
    id: "ci-inventory-summary",
    name: "CI Inventory Summary",
    description:
      "Configuration Items grouped by class, environment, criticality, and lifecycle state.",
    category: "cmdb",
    requiredFeatureFlags: ["CMDB"],
    requiredPermission: "reports:view",
    filters: [
      {
        key: "ciClassId",
        label: "CI Class",
        type: "select",
        placeholder: "All classes",
      },
      {
        key: "environment",
        label: "Environment",
        type: "select",
        options: [
          { label: "Production", value: "PROD" },
          { label: "UAT", value: "UAT" },
          { label: "Development", value: "DEV" },
          { label: "DR", value: "DR" },
          { label: "Test", value: "TEST" },
          { label: "Other", value: "OTHER" },
        ],
        placeholder: "All environments",
      },
      {
        key: "criticality",
        label: "Criticality",
        type: "select",
        options: [
          { label: "Critical", value: "CRITICAL" },
          { label: "High", value: "HIGH" },
          { label: "Medium", value: "MEDIUM" },
          { label: "Low", value: "LOW" },
        ],
        placeholder: "All levels",
      },
    ],
    columns: [
      { key: "className", label: "CI Class", type: "string", sortable: true },
      {
        key: "environment",
        label: "Environment",
        type: "badge",
        sortable: true,
      },
      {
        key: "criticality",
        label: "Criticality",
        type: "badge",
        sortable: true,
      },
      {
        key: "lifecycleState",
        label: "Lifecycle State",
        type: "badge",
        sortable: true,
      },
      {
        key: "ciCount",
        label: "Count",
        type: "number",
        align: "right",
        sortable: true,
      },
    ],
  },

  {
    id: "ci-relationship-overview",
    name: "CI Relationship Overview",
    description:
      "Relationship counts by type, orphaned CIs, and impact analysis across the CMDB.",
    category: "cmdb",
    requiredFeatureFlags: ["CMDB"],
    requiredPermission: "reports:view",
    filters: [
      {
        key: "relationshipTypeId",
        label: "Relationship Type",
        type: "select",
        placeholder: "All types",
      },
      {
        key: "ciClassId",
        label: "CI Class",
        type: "select",
        placeholder: "All classes",
      },
    ],
    columns: [
      {
        key: "relationshipTypeName",
        label: "Relationship Type",
        type: "string",
        sortable: true,
      },
      {
        key: "direction",
        label: "Direction",
        type: "badge",
      },
      {
        key: "isImpacting",
        label: "Impacting",
        type: "badge",
      },
      {
        key: "relationshipCount",
        label: "Count",
        type: "number",
        align: "right",
        sortable: true,
      },
      {
        key: "uniqueFromCIs",
        label: "Unique Source CIs",
        type: "number",
        align: "right",
        sortable: true,
      },
      {
        key: "uniqueToCIs",
        label: "Unique Target CIs",
        type: "number",
        align: "right",
        sortable: true,
      },
    ],
  },

  {
    id: "ci-asset-coverage",
    name: "CI-Asset Coverage",
    description:
      "Analysis of which Configuration Items have linked assets and coverage gaps.",
    category: "cmdb",
    requiredFeatureFlags: ["CMDB"],
    requiredPermission: "reports:view",
    filters: [
      {
        key: "ciClassId",
        label: "CI Class",
        type: "select",
        placeholder: "All classes",
      },
      {
        key: "coverageStatus",
        label: "Coverage Status",
        type: "select",
        options: [
          { label: "Linked", value: "linked" },
          { label: "Unlinked", value: "unlinked" },
        ],
        placeholder: "All",
      },
    ],
    columns: [
      { key: "ciName", label: "CI Name", type: "string", sortable: true },
      { key: "className", label: "CI Class", type: "string", sortable: true },
      {
        key: "environment",
        label: "Environment",
        type: "badge",
        sortable: true,
      },
      {
        key: "linkedAssetTag",
        label: "Linked Asset",
        type: "string",
        sortable: true,
      },
      {
        key: "coverageStatus",
        label: "Coverage",
        type: "badge",
        align: "center",
      },
    ],
  },
];

/**
 * Look up a report definition by ID
 */
export function getReportDefinition(
  reportId: string,
): ReportDefinition | undefined {
  return REPORT_DEFINITIONS.find((r) => r.id === reportId);
}

/**
 * Get all report IDs
 */
export function getReportIds(): string[] {
  return REPORT_DEFINITIONS.map((r) => r.id);
}
