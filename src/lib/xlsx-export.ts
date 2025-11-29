/**
 * XLSX Export Utilities
 *
 * Functions for exporting data to Excel format.
 */

import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { format } from "date-fns";
import type { AssetDTO } from "@/interface-adapters/presenters/asset.presenter";

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
 * Export assets to XLSX format
 */
export function exportAssetsToXLSX(
  assets: AssetDTO[],
  options?: {
    filename?: string;
  },
): void {
  if (assets.length === 0) {
    return;
  }

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

  // Transform assets to row data - core fields + custom fields
  const data = assets.map((asset) => {
    const row: Record<string, string> = {
      "Asset Tag": asset.assetTag,
      "Serial Number": asset.serialNumber || "",
      Category: asset.categoryName || "",
      Model: asset.modelName || "",
      Vendor: asset.vendorName || "",
      Location: asset.stockLocationName || "",
      Status: asset.lifecycleStateName || "",
      Condition: asset.condition || "",
      Notes: asset.note || "",
      "Created At": asset.createdAt
        ? format(new Date(asset.createdAt), "yyyy-MM-dd HH:mm")
        : "",
    };

    // Add custom fields
    for (const key of sortedCustomFieldKeys) {
      const value = asset.attributes?.[key];
      row[key] = formatCustomFieldValue(value);
    }

    return row;
  });

  // Create worksheet from data
  const worksheet = XLSX.utils.json_to_sheet(data);

  // Set column widths - core fields + custom fields
  const columnWidths = [
    { wch: 15 }, // Asset Tag
    { wch: 20 }, // Serial Number
    { wch: 15 }, // Category
    { wch: 20 }, // Model
    { wch: 15 }, // Vendor
    { wch: 15 }, // Location
    { wch: 12 }, // Status
    { wch: 10 }, // Condition
    { wch: 30 }, // Notes
    { wch: 18 }, // Created At
    ...sortedCustomFieldKeys.map(() => ({ wch: 15 })), // Custom fields
  ];
  worksheet["!cols"] = columnWidths;

  // Style header row
  const range = XLSX.utils.decode_range(worksheet["!ref"]!);
  for (let col = range.s.c; col <= range.e.c; col++) {
    const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
    if (!worksheet[cellAddress]) continue;
    worksheet[cellAddress].s = {
      font: { bold: true },
      fill: { fgColor: { rgb: "EEEEEE" } },
    };
  }

  // Create workbook
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Assets");

  // Generate Excel file
  const excelBuffer = XLSX.write(workbook, {
    bookType: "xlsx",
    type: "array",
  });

  // Create blob and download
  const blob = new Blob([excelBuffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  const filename =
    options?.filename || `assets-export-${format(new Date(), "yyyy-MM-dd")}`;
  saveAs(blob, `${filename}.xlsx`);
}

/**
 * Generic function to export any data array to XLSX
 */
export function exportToXLSX<T extends Record<string, unknown>>(
  data: T[],
  options: {
    filename: string;
    sheetName?: string;
    columnWidths?: number[];
  },
): void {
  if (data.length === 0) {
    return;
  }

  const worksheet = XLSX.utils.json_to_sheet(data);

  // Set column widths if provided
  if (options.columnWidths) {
    worksheet["!cols"] = options.columnWidths.map((wch) => ({ wch }));
  }

  // Create workbook
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(
    workbook,
    worksheet,
    options.sheetName || "Data",
  );

  // Generate Excel file
  const excelBuffer = XLSX.write(workbook, {
    bookType: "xlsx",
    type: "array",
  });

  // Create blob and download
  const blob = new Blob([excelBuffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  saveAs(blob, `${options.filename}.xlsx`);
}
