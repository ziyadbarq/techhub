/**
 * CSV Export Utilities
 * Exports asset data to CSV format and triggers browser download
 */

import { format } from "date-fns";

export interface AssetExportInput {
  assetTag: string;
  serialNumber?: string | null;
  categoryName?: string | null;
  modelName?: string | null;
  vendorName?: string | null;
  owningCompanyName?: string | null;
  stockLocationName?: string | null;
  lifecycleStateName?: string | null;
  condition?: string | null;
  note?: string | null;
  createdAt: string | Date;
  attributes?: Record<string, unknown> | null;
}

/**
 * Format a custom field value for export
 */
function formatCustomFieldValue(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }
  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }
  if (value instanceof Date) {
    return format(value, "yyyy-MM-dd");
  }
  if (typeof value === "object") {
    return JSON.stringify(value);
  }
  return String(value);
}

/**
 * Escape CSV fields (handle commas, quotes, newlines)
 */
function escapeCSVField(field: string): string {
  if (
    field.includes(",") ||
    field.includes('"') ||
    field.includes("\n") ||
    field.includes("\r")
  ) {
    return `"${field.replace(/"/g, '""')}"`;
  }
  return field;
}

/**
 * Convert assets to CSV string
 */
function assetsToCSV<T extends AssetExportInput>(assets: T[]): string {
  // Collect all unique custom field keys from all assets
  const customFieldKeys = new Set<string>();
  for (const asset of assets) {
    if (asset.attributes && typeof asset.attributes === "object") {
      for (const key of Object.keys(asset.attributes)) {
        customFieldKeys.add(key);
      }
    }
  }
  const sortedCustomFieldKeys = Array.from(customFieldKeys).sort();

  // Define headers - core fields + custom fields
  const headers = [
    "Asset Tag",
    "Serial Number",
    "Category",
    "Model",
    "Vendor",
    "Company",
    "Location",
    "Status",
    "Condition",
    "Notes",
    "Created At",
    ...sortedCustomFieldKeys,
  ];

  // Convert assets to rows
  const rows = assets.map((asset) => {
    const coreFields = [
      asset.assetTag,
      asset.serialNumber || "",
      asset.categoryName || "",
      asset.modelName || "",
      asset.vendorName || "",
      asset.owningCompanyName || "",
      asset.stockLocationName || "",
      asset.lifecycleStateName || "",
      asset.condition || "",
      asset.note || "",
      format(new Date(asset.createdAt), "yyyy-MM-dd HH:mm:ss"),
    ];

    // Add custom field values
    const customFieldValues = sortedCustomFieldKeys.map((key) =>
      formatCustomFieldValue(asset.attributes?.[key]),
    );

    return [...coreFields, ...customFieldValues];
  });

  // Build CSV
  const csvRows = [
    headers.map(escapeCSVField).join(","),
    ...rows.map((row) => row.map(escapeCSVField).join(",")),
  ];

  return csvRows.join("\n");
}

/**
 * Export assets to CSV file and trigger download
 */
export function exportAssetsToCSV<T extends AssetExportInput>(
  assets: T[],
): void {
  const csv = assetsToCSV(assets);

  // Add UTF-8 BOM for Excel compatibility
  const bom = "\uFEFF";
  const csvWithBOM = bom + csv;

  // Create blob and download
  const blob = new Blob([csvWithBOM], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = `assets-export-${format(new Date(), "yyyy-MM-dd")}.csv`;
  link.style.display = "none";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Clean up
  URL.revokeObjectURL(url);
}

/**
 * Generic CSV export for any data
 */
export function arrayToCSV<
  T extends Record<string, string | number | boolean | null | undefined>,
>(data: T[], columns?: { key: keyof T; label: string }[]): string {
  if (data.length === 0) {
    return "";
  }

  // If columns not provided, use all keys from first object
  const cols =
    columns ||
    (Object.keys(data[0]).map((key) => ({ key, label: key })) as {
      key: keyof T;
      label: string;
    }[]);

  // Create header row
  const header = cols.map((col) => escapeCSVField(col.label)).join(",");

  // Create data rows
  const rows = data.map((row) => {
    return cols
      .map((col) => {
        const value = row[col.key];
        return escapeCSVField(String(value ?? ""));
      })
      .join(",");
  });

  return [header, ...rows].join("\n");
}

/**
 * Download CSV file
 */
export function downloadCSV(csvContent: string, filename: string): void {
  // Add UTF-8 BOM for Excel compatibility
  const bom = "\uFEFF";
  const csvWithBOM = bom + csvContent;

  const blob = new Blob([csvWithBOM], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.display = "none";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Clean up
  URL.revokeObjectURL(url);
}
