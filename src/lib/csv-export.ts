/**
 * CSV Export Utilities
 * Exports asset data to CSV format and triggers browser download
 */

import type { AssetDTO } from "@/interface-adapters/presenters/asset.presenter";
import { format } from "date-fns";

/**
 * Convert assets to CSV string
 */
function assetsToCSV(assets: AssetDTO[]): string {
  // Define headers with enriched names
  const headers = [
    "Asset Tag",
    "Category",
    "Category Code",
    "Model",
    "Model Code",
    "Vendor",
    "Vendor Code",
    "Serial Number",
    "Purchase Date",
    "Purchase Cost",
    "Currency",
    "Warranty End Date",
    "Stock Location",
    "Location Code",
    "Lifecycle State",
    "State Code",
    "Depreciation Model",
    "Depreciation Start",
    "Depreciation End",
    "Under Warranty",
    "Depreciated",
    "Fully Depreciated",
    "Note",
    "Created At",
    "Updated At",
  ];

  // Convert assets to rows
  const rows = assets.map((asset) => {
    return [
      asset.assetTag,
      asset.categoryName || "",
      asset.assetCategoryId,
      asset.modelName || "",
      asset.assetModelId || "",
      asset.vendorName || "",
      asset.vendorId || "",
      asset.serialNumber || "",
      asset.purchaseDate
        ? format(new Date(asset.purchaseDate), "yyyy-MM-dd")
        : "",
      asset.purchaseCost?.toString() || "",
      asset.currency || "",
      asset.warrantyEndDate
        ? format(new Date(asset.warrantyEndDate), "yyyy-MM-dd")
        : "",
      asset.stockLocationName || "",
      asset.currentStockLocationId || "",
      asset.lifecycleStateName || "",
      asset.lifecycleStateId || "",
      asset.depreciationModel || "",
      asset.depreciationStart
        ? format(new Date(asset.depreciationStart), "yyyy-MM-dd")
        : "",
      asset.depreciationEnd
        ? format(new Date(asset.depreciationEnd), "yyyy-MM-dd")
        : "",
      asset.isUnderWarranty ? "Yes" : "No",
      asset.isDepreciated ? "Yes" : "No",
      asset.isFullyDepreciated ? "Yes" : "No",
      asset.note || "",
      format(new Date(asset.createdAt), "yyyy-MM-dd HH:mm:ss"),
      format(new Date(asset.updatedAt), "yyyy-MM-dd HH:mm:ss"),
    ];
  });

  // Escape CSV fields (handle commas, quotes, newlines)
  const escapeCSVField = (field: string): string => {
    if (
      field.includes(",") ||
      field.includes('"') ||
      field.includes("\n") ||
      field.includes("\r")
    ) {
      return `"${field.replace(/"/g, '""')}"`;
    }
    return field;
  };

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
export function exportAssetsToCSV(assets: AssetDTO[]): void {
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

  // Escape CSV field
  const escapeCSVField = (field: string): string => {
    if (
      field.includes(",") ||
      field.includes('"') ||
      field.includes("\n") ||
      field.includes("\r")
    ) {
      return `"${field.replace(/"/g, '""')}"`;
    }
    return field;
  };

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
