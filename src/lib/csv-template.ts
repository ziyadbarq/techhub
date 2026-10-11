/**
 * CSV Template Generation
 * Generates template CSV files for asset import
 */

import { format } from "date-fns";
import * as XLSX from "xlsx";

const ASSET_IMPORT_HEADERS = [
  "assetTag*",
  "categoryCode*",
  "ownerEmail",
  "modelCode",
  "vendorCode",
  "serialNumber",
  "purchaseDate",
  "purchaseCost",
  "currency",
  "stockLocationCode",
  "lifecycleStateCode",
  "owningCompanyCode",
  "depreciationModel",
  "depreciationStart",
  "depreciationEnd",
  "note",
];

const ASSET_IMPORT_INSTRUCTIONS = [
  "Required: Unique asset identifier",
  "Required: Asset category code (must exist)",
  "Optional: Person email to assign the asset to (must exist if provided)",
  "Optional: Asset model code (must exist if provided)",
  "Optional: Vendor code (must exist if provided)",
  "Optional: Manufacturer serial number",
  "Optional: Format YYYY-MM-DD",
  "Optional: Numeric value",
  "Optional: 3-letter ISO code (USD, EUR, etc.)",
  "Optional: Stock location code (must exist if provided)",
  "Optional: Lifecycle state code (must exist if provided)",
  "Optional: Owning company code - see Reference sheet (e.g. BARQ, AOUN)",
  "Optional: Depreciation model name",
  "Optional: Format YYYY-MM-DD",
  "Optional: Format YYYY-MM-DD",
  "Optional: Additional notes",
];

const ASSET_IMPORT_EXAMPLE_ROW = [
  "LAPTOP-001",
  "LAPTOP",
  "ahmed@barq.com",
  "MBP-M3",
  "APPLE",
  "C02XYZ123ABC",
  "2024-01-15",
  "2499.99",
  "USD",
  "HQ-WAREHOUSE",
  "IN-USE",
  "BARQ",
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
 * Codes the importer accepts, grouped for the template's Reference sheet.
 * Passing real values lets someone fill the template without guessing codes.
 */
export interface AssetTemplateReferenceData {
  owningCompanies?: Array<{ code: string; name: string }>;
  categories?: Array<{ code: string; name: string }>;
  stockLocations?: Array<{ code: string; name: string }>;
  lifecycleStates?: Array<{ code: string; name: string }>;
}

/**
 * Build the "Reference" sheet rows: one section per code list.
 */
function buildReferenceRows(reference: AssetTemplateReferenceData): string[][] {
  const sections: Array<{
    column: string;
    title: string;
    items?: Array<{ code: string; name: string }>;
  }> = [
    {
      column: "owningCompanyCode",
      title: "Owning companies",
      items: reference.owningCompanies,
    },
    {
      column: "categoryCode*",
      title: "Asset categories",
      items: reference.categories,
    },
    {
      column: "stockLocationCode",
      title: "Stock locations",
      items: reference.stockLocations,
    },
    {
      column: "lifecycleStateCode",
      title: "Lifecycle states",
      items: reference.lifecycleStates,
    },
  ];

  const rows: string[][] = [
    ["Column", "Valid code", "Name"],
    [
      "Copy a code from this sheet into the matching column on the Assets sheet.",
      "",
      "",
    ],
    ["", "", ""],
  ];

  for (const section of sections) {
    if (!section.items || section.items.length === 0) continue;

    rows.push([section.title, "", ""]);
    for (const item of section.items) {
      rows.push([section.column, item.code, item.name]);
    }
    rows.push(["", "", ""]);
  }

  return rows;
}

/**
 * Download asset Excel import template.
 *
 * @param reference - Live codes to list on the Reference sheet. Omit to get the
 *   bare template; the sheet is then skipped rather than shown empty.
 */
export function downloadAssetExcelTemplate(
  reference: AssetTemplateReferenceData = {},
): void {
  const worksheet = XLSX.utils.aoa_to_sheet([
    ASSET_IMPORT_HEADERS,
    ASSET_IMPORT_INSTRUCTIONS,
    ASSET_IMPORT_EXAMPLE_ROW,
  ]);

  worksheet["!cols"] = ASSET_IMPORT_HEADERS.map((header) => ({
    wch: Math.max(header.length + 4, 18),
  }));

  // Keep the header row visible while scrolling down a long import.
  worksheet["!freeze"] = { xSplit: "0", ySplit: "1", topLeftCell: "A2" };
  worksheet["!autofilter"] = {
    ref: XLSX.utils.encode_range({
      s: { r: 0, c: 0 },
      e: { r: 0, c: ASSET_IMPORT_HEADERS.length - 1 },
    }),
  };

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Assets");

  const referenceRows = buildReferenceRows(reference);
  // Row 0 is the header and rows 1-2 are guidance, so anything longer than
  // that means at least one code list was supplied.
  if (referenceRows.length > 3) {
    const referenceSheet = XLSX.utils.aoa_to_sheet(referenceRows);
    referenceSheet["!cols"] = [{ wch: 24 }, { wch: 22 }, { wch: 40 }];
    XLSX.utils.book_append_sheet(workbook, referenceSheet, "Reference");
  }

  XLSX.writeFile(
    workbook,
    `asset-import-template-${format(new Date(), "yyyy-MM-dd")}.xlsx`,
  );
}
