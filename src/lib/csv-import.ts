/**
 * CSV Import Utilities
 * Parses and validates CSV files for asset import
 */

import * as Papa from "papaparse";
import * as XLSX from "xlsx";

export interface CSVImportRow {
  assetTag: string;
  categoryCode: string;
  ownerEmail?: string;
  modelCode?: string;
  vendorCode?: string;
  serialNumber?: string;
  purchaseDate?: string;
  purchaseCost?: string;
  currency?: string;
  stockLocationCode?: string;
  lifecycleStateCode?: string;
  owningCompanyCode?: string;
  depreciationModel?: string;
  depreciationStart?: string;
  depreciationEnd?: string;
  note?: string;
}

export interface ParsedAsset {
  row: number;
  data: CSVImportRow;
  errors: string[];
}

export interface CSVParseResult {
  assets: ParsedAsset[];
  totalRows: number;
  validRows: number;
  invalidRows: number;
}

export interface AssetCreateLike {
  assetTag: string;
  assetCategoryId: string;
  ownerPersonId?: string | null;
  assetModelId?: string | null;
  vendorId?: string | null;
  serialNumber?: string | null;
  purchaseDate?: Date | null;
  purchaseCost?: number | null;
  currency?: string | null;
  currentStockLocationId?: string | null;
  lifecycleStateId?: string | null;
  owningOrgUnitId?: string | null;
  depreciationModel?: string | null;
  depreciationStart?: Date | null;
  depreciationEnd?: Date | null;
  note?: string | null;
}

const ASSET_IMPORT_HEADERS = [
  "assetTag",
  "categoryCode",
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
] as const;

function normalizeHeader(header: string): string {
  return header.replace("*", "").trim();
}

function normalizeRow(
  row: CSVImportRow | Partial<Record<string, unknown>>,
): CSVImportRow {
  const normalized: Record<string, string> = {};

  for (const header of ASSET_IMPORT_HEADERS) {
    const value = row[header];
    normalized[header] =
      value === null || value === undefined ? "" : String(value).trim();
  }

  return normalized as unknown as CSVImportRow;
}

function buildParseResult(rows: CSVImportRow[]): CSVParseResult {
  const assets: ParsedAsset[] = [];
  let rowNumber = 2;

  for (const row of rows) {
    if (
      row.assetTag?.startsWith("Required:") ||
      row.assetTag?.startsWith("Optional:")
    ) {
      rowNumber++;
      continue;
    }

    const errors = validateCSVRow(row, rowNumber);
    assets.push({
      row: rowNumber,
      data: row,
      errors,
    });
    rowNumber++;
  }

  const validRows = assets.filter((a) => a.errors.length === 0).length;
  const invalidRows = assets.length - validRows;

  return {
    assets,
    totalRows: assets.length,
    validRows,
    invalidRows,
  };
}

/**
 * Parse CSV or Excel file and validate format
 */
export async function parseAssetImportFile(
  file: File,
): Promise<CSVParseResult> {
  const extension = file.name.split(".").pop()?.toLowerCase();

  if (extension === "xlsx" || extension === "xls") {
    return parseExcelFile(file);
  }

  return parseCSVFile(file);
}

/**
 * Parse CSV file and validate format
 */
export async function parseCSVFile(file: File): Promise<CSVParseResult> {
  return new Promise((resolve, reject) => {
    Papa.parse<CSVImportRow>(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: normalizeHeader,
      complete: (results) => {
        resolve(buildParseResult(results.data.map(normalizeRow)));
      },
      error: (error) => {
        reject(new Error(`CSV parsing failed: ${error.message}`));
      },
    });
  });
}

/**
 * Parse the first worksheet from an Excel file and validate format
 */
export async function parseExcelFile(file: File): Promise<CSVParseResult> {
  try {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, {
      type: "array",
      cellDates: true,
    });
    const sheetName = workbook.SheetNames[0];

    if (!sheetName) {
      throw new Error("Excel workbook has no sheets");
    }

    const worksheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, {
      defval: "",
      raw: false,
      dateNF: "yyyy-mm-dd",
    });

    const normalizedRows = rows.map((row) => {
      const normalized: Record<string, unknown> = {};

      for (const [key, value] of Object.entries(row)) {
        normalized[normalizeHeader(key)] = value;
      }

      return normalizeRow(normalized);
    });

    return buildParseResult(normalizedRows);
  } catch (error) {
    throw new Error(
      error instanceof Error
        ? `Excel parsing failed: ${error.message}`
        : "Excel parsing failed",
    );
  }
}

/**
 * Validate a single CSV row
 */
function validateCSVRow(row: CSVImportRow, _rowNumber: number): string[] {
  const errors: string[] = [];

  // Required: assetTag
  if (!row.assetTag || row.assetTag.trim().length === 0) {
    errors.push("Asset tag is required");
  } else if (row.assetTag.trim().length < 2) {
    errors.push("Asset tag must be at least 2 characters");
  } else if (row.assetTag.trim().length > 100) {
    errors.push("Asset tag must be 100 characters or less");
  } else if (!/^[A-Z0-9_-]+$/i.test(row.assetTag.trim())) {
    errors.push(
      "Asset tag can only contain letters, numbers, hyphens, and underscores",
    );
  }

  // Required: categoryCode
  if (!row.categoryCode || row.categoryCode.trim().length === 0) {
    errors.push("Category code is required");
  }

  if (row.ownerEmail && row.ownerEmail.trim().length > 0) {
    const email = row.ownerEmail.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.push("Owner email must be a valid email address");
    }
  }

  // Validate dates if provided
  if (row.purchaseDate && !isValidDate(row.purchaseDate)) {
    errors.push("Purchase date must be in YYYY-MM-DD format");
  }

  if (row.depreciationStart && !isValidDate(row.depreciationStart)) {
    errors.push("Depreciation start date must be in YYYY-MM-DD format");
  }

  if (row.depreciationEnd && !isValidDate(row.depreciationEnd)) {
    errors.push("Depreciation end date must be in YYYY-MM-DD format");
  }

  // Validate numeric fields
  if (row.purchaseCost) {
    const cost = parseFloat(row.purchaseCost);
    if (isNaN(cost) || cost < 0) {
      errors.push("Purchase cost must be a positive number");
    } else if (cost > 9999999999.99) {
      errors.push("Purchase cost cannot exceed 9999999999.99");
    }
  }

  // Validate currency if provided
  if (row.currency) {
    if (row.currency.length !== 3) {
      errors.push("Currency must be a 3-letter ISO code");
    } else if (!/^[A-Z]{3}$/i.test(row.currency)) {
      errors.push("Currency must be 3 uppercase letters (e.g., USD, EUR)");
    }
  }

  // Validate serial number length
  if (row.serialNumber && row.serialNumber.length > 200) {
    errors.push("Serial number must be 200 characters or less");
  }

  // Validate note length
  if (row.note && row.note.length > 5000) {
    errors.push("Note must be 5000 characters or less");
  }

  // Validate depreciation model length
  if (row.depreciationModel && row.depreciationModel.length > 100) {
    errors.push("Depreciation model must be 100 characters or less");
  }

  return errors;
}

/**
 * Validate date format (YYYY-MM-DD)
 */
function isValidDate(dateString: string): boolean {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateString)) {
    return false;
  }

  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime());
}

/**
 * Convert CSV row to asset creation shape (for valid rows only)
 * Note: This creates partial DTOs that need ID mapping from codes
 */
export function csvRowToDTO(
  row: CSVImportRow,
  lookupMaps: {
    categoryMap: Map<string, string>; // code -> id
    modelMap: Map<string, string>; // code -> id
    vendorMap: Map<string, string>; // code -> id
    locationMap: Map<string, string>; // code -> id
    stateMap: Map<string, string>; // code -> id
    owningCompanyMap?: Map<string, string>; // code -> COMPANY org unit id
    personEmailMap?: Map<string, string>; // email -> person id
  },
): { dto: Partial<AssetCreateLike>; errors: string[] } {
  const errors: string[] = [];

  // Map category code to ID
  const categoryId = lookupMaps.categoryMap.get(
    row.categoryCode.trim().toUpperCase(),
  );
  if (!categoryId) {
    errors.push(`Category code '${row.categoryCode}' not found`);
  }

  let ownerPersonId: string | null = null;
  if (row.ownerEmail && row.ownerEmail.trim().length > 0) {
    const ownerEmail = row.ownerEmail.trim().toLowerCase();
    ownerPersonId = lookupMaps.personEmailMap?.get(ownerEmail) || null;
    if (!ownerPersonId) {
      errors.push(`Owner email '${row.ownerEmail}' not found`);
    }
  }

  // Map model code to ID (optional)
  let modelId: string | null = null;
  if (row.modelCode && row.modelCode.trim().length > 0) {
    modelId =
      lookupMaps.modelMap.get(row.modelCode.trim().toUpperCase()) || null;
    if (!modelId) {
      errors.push(`Model code '${row.modelCode}' not found`);
    }
  }

  // Map vendor code to ID (optional)
  let vendorId: string | null = null;
  if (row.vendorCode && row.vendorCode.trim().length > 0) {
    vendorId =
      lookupMaps.vendorMap.get(row.vendorCode.trim().toUpperCase()) || null;
    if (!vendorId) {
      errors.push(`Vendor code '${row.vendorCode}' not found`);
    }
  }

  // Map location code to ID (optional)
  let locationId: string | null = null;
  if (row.stockLocationCode && row.stockLocationCode.trim().length > 0) {
    locationId =
      lookupMaps.locationMap.get(row.stockLocationCode.trim().toUpperCase()) ||
      null;
    if (!locationId) {
      errors.push(`Stock location code '${row.stockLocationCode}' not found`);
    }
  }

  // Map lifecycle state code to ID (optional)
  let stateId: string | null = null;
  if (row.lifecycleStateCode && row.lifecycleStateCode.trim().length > 0) {
    stateId =
      lookupMaps.stateMap.get(row.lifecycleStateCode.trim().toUpperCase()) ||
      null;
    if (!stateId) {
      errors.push(`Lifecycle state code '${row.lifecycleStateCode}' not found`);
    }
  }

  // Map owning company code to ID (optional)
  let owningOrgUnitId: string | null = null;
  if (row.owningCompanyCode && row.owningCompanyCode.trim().length > 0) {
    owningOrgUnitId =
      lookupMaps.owningCompanyMap?.get(
        row.owningCompanyCode.trim().toUpperCase(),
      ) || null;
    if (!owningOrgUnitId) {
      errors.push(`Owning company code '${row.owningCompanyCode}' not found`);
    }
  }

  const dto: Partial<AssetCreateLike> = {
    assetTag: row.assetTag.trim(),
    assetCategoryId: categoryId || "",
    ownerPersonId,
    assetModelId: modelId,
    vendorId: vendorId,
    serialNumber: row.serialNumber?.trim() || null,
    purchaseDate: row.purchaseDate ? new Date(row.purchaseDate) : null,
    purchaseCost: row.purchaseCost ? parseFloat(row.purchaseCost) : null,
    currency: row.currency?.trim().toUpperCase() || null,
    currentStockLocationId: locationId,
    lifecycleStateId: stateId,
    owningOrgUnitId,
    depreciationModel: row.depreciationModel?.trim() || null,
    depreciationStart: row.depreciationStart
      ? new Date(row.depreciationStart)
      : null,
    depreciationEnd: row.depreciationEnd ? new Date(row.depreciationEnd) : null,
    note: row.note?.trim() || null,
  };

  return { dto, errors };
}

/**
 * Export failed rows to CSV for correction
 */
export function exportFailedRowsToCSV(failedAssets: ParsedAsset[]): void {
  const headers = [
    "Row",
    "Errors",
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

  const rows = failedAssets.map((asset) => [
    asset.row.toString(),
    asset.errors.join("; "),
    asset.data.assetTag || "",
    asset.data.categoryCode || "",
    asset.data.ownerEmail || "",
    asset.data.modelCode || "",
    asset.data.vendorCode || "",
    asset.data.serialNumber || "",
    asset.data.purchaseDate || "",
    asset.data.purchaseCost || "",
    asset.data.currency || "",
    asset.data.stockLocationCode || "",
    asset.data.lifecycleStateCode || "",
    asset.data.owningCompanyCode || "",
    asset.data.depreciationModel || "",
    asset.data.depreciationStart || "",
    asset.data.depreciationEnd || "",
    asset.data.note || "",
  ]);

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

  const csvRows = [
    headers.map(escapeCSVField).join(","),
    ...rows.map((row) => row.map(escapeCSVField).join(",")),
  ];

  const csv = csvRows.join("\n");

  const bom = "\uFEFF";
  const csvWithBOM = bom + csv;

  const blob = new Blob([csvWithBOM], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = `asset-import-errors-${new Date().toISOString().split("T")[0]}.csv`;
  link.style.display = "none";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}
