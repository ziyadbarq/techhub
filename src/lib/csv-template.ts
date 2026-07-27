/**
 * CSV Template Generation
 * Generates template CSV files for asset import
 */

import { format } from "date-fns";
import * as XLSX from "xlsx";

const ASSET_IMPORT_HEADERS = [
  "assetTag*",
  "categoryCode*",
  "modelCode",
  "vendorCode",
  "serialNumber",
  "purchaseDate",
  "purchaseCost",
  "currency",
  "stockLocationCode",
  "lifecycleStateCode",
  "depreciationModel",
  "depreciationStart",
  "depreciationEnd",
  "note",
];

const ASSET_IMPORT_INSTRUCTIONS = [
  "Required: Unique asset identifier",
  "Required: Asset category code (must exist)",
  "Optional: Asset model code (must exist if provided)",
  "Optional: Vendor code (must exist if provided)",
  "Optional: Manufacturer serial number",
  "Optional: Format YYYY-MM-DD",
  "Optional: Numeric value",
  "Optional: 3-letter ISO code (USD, EUR, etc.)",
  "Optional: Stock location code (must exist if provided)",
  "Optional: Lifecycle state code (must exist if provided)",
  "Optional: Depreciation model name",
  "Optional: Format YYYY-MM-DD",
  "Optional: Format YYYY-MM-DD",
  "Optional: Additional notes",
];

const ASSET_IMPORT_EXAMPLE_ROW = [
  "LAPTOP-001",
  "LAPTOP",
  "MBP-M3",
  "APPLE",
  "C02XYZ123ABC",
  "2024-01-15",
  "2499.99",
  "USD",
  "HQ-WAREHOUSE",
  "IN-USE",
  "STRAIGHT-LINE",
  "2024-01-15",
  "2027-01-15",
  "Executive laptop for CEO",
];

/**
 * Download asset CSV import template
 */
export function downloadAssetCSVTemplate(): void {
  // Escape CSV fields
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

  // Build CSV with header, instructions, and example
  const csvRows = [
    ASSET_IMPORT_HEADERS.map(escapeCSVField).join(","),
    ASSET_IMPORT_INSTRUCTIONS.map(escapeCSVField).join(","),
    ASSET_IMPORT_EXAMPLE_ROW.map(escapeCSVField).join(","),
  ];

  const csv = csvRows.join("\n");

  // Add UTF-8 BOM for Excel compatibility
  const bom = "\uFEFF";
  const csvWithBOM = bom + csv;

  // Create blob and download
  const blob = new Blob([csvWithBOM], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = `asset-import-template-${format(new Date(), "yyyy-MM-dd")}.csv`;
  link.style.display = "none";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Clean up
  URL.revokeObjectURL(url);
}

/**
 * Download asset Excel import template
 */
export function downloadAssetExcelTemplate(): void {
  const worksheet = XLSX.utils.aoa_to_sheet([
    ASSET_IMPORT_HEADERS,
    ASSET_IMPORT_INSTRUCTIONS,
    ASSET_IMPORT_EXAMPLE_ROW,
  ]);

  worksheet["!cols"] = ASSET_IMPORT_HEADERS.map((header) => ({
    wch: Math.max(header.length + 4, 18),
  }));

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Assets");

  XLSX.writeFile(
    workbook,
    `asset-import-template-${format(new Date(), "yyyy-MM-dd")}.xlsx`,
  );
}
