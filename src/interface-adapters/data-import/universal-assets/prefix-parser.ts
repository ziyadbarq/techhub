/**
 * Prefix Parser for Universal Assets Importer
 *
 * Handles detection and parsing of prefixed column names (e.g., "vendor.name", "custom.cpu_cores")
 * and groups row data by entity prefix.
 */

import {
  PREFIX_CONFIG,
  type PrefixKey,
  type PrefixedColumn,
  type GroupedRowData,
} from "./types";

/**
 * Mapping from snake_case field names to camelCase property names
 * for each entity type. This ensures CSV columns can use any format
 * (snake_case, spaces, etc.) while the typed objects use consistent camelCase.
 */
const FIELD_NAME_MAPPINGS: Record<string, Record<string, string>> = {
  "person.": {
    // PersonData - already camelCase
  },
  "asset.": {
    serial_number: "serialNumber",
    serialnumber: "serialNumber",
    asset_tag: "assetTag",
    assettag: "assetTag",
    purchase_date: "purchaseDate",
    purchasedate: "purchaseDate",
    purchase_cost: "purchaseCost",
    purchasecost: "purchaseCost",
    depreciation_model: "depreciationModel",
    depreciationmodel: "depreciationModel",
    depreciation_start: "depreciationStart",
    depreciationstart: "depreciationStart",
    depreciation_end: "depreciationEnd",
    depreciationend: "depreciationEnd",
  },
  "vendor.": {
    // VendorData - all single words (code, name, type, email, phone, website)
  },
  "category.": {
    // CategoryData - all single words (code, name, description)
  },
  "model.": {
    default_warranty_months: "defaultWarrantyMonths",
    defaultwarrantymonths: "defaultWarrantyMonths",
  },
  "location.": {
    // LocationData - all single words (code, name, type, description)
  },
  "stock_location.": {
    // StockLocationData - all single words (code, name, description)
  },
  "lifecycle.": {
    // LifecycleData - single word (code)
  },
  "custom.": {
    // Custom fields keep their snake_case names as-is
  },
};

/**
 * Map a normalized snake_case field name to its camelCase property name
 * for the given entity prefix
 */
function mapFieldNameToProperty(
  prefix: PrefixKey | null,
  snakeCaseName: string,
): string {
  if (!prefix) return snakeCaseName;

  const mapping = FIELD_NAME_MAPPINGS[prefix];
  if (!mapping) return snakeCaseName;

  // Return mapped name if exists, otherwise return original
  return mapping[snakeCaseName] || snakeCaseName;
}

/**
 * Detect prefixed columns from CSV headers
 */
export function detectPrefixedColumns(columns: string[]): PrefixedColumn[] {
  return columns.map((col) => {
    const normalized = col.toLowerCase().trim();

    // Check each prefix
    for (const [prefix, config] of Object.entries(PREFIX_CONFIG)) {
      if (normalized.startsWith(prefix)) {
        const fieldName = normalized.slice(prefix.length);
        return {
          originalColumn: col,
          prefix: prefix as PrefixKey,
          fieldName: normalizeFieldName(fieldName),
          targetEntity: config.entity,
          isAutoCreate: config.autoCreate,
          confidence: 100,
        };
      }
    }

    // No prefix detected - try to infer from common patterns
    return inferColumnTarget(col);
  });
}

/**
 * Infer column target from common patterns when no prefix is detected
 */
function inferColumnTarget(column: string): PrefixedColumn {
  const normalized = column.toLowerCase().trim();

  // Common email patterns
  if (
    normalized.includes("email") ||
    normalized.includes("assignee") ||
    normalized.includes("user")
  ) {
    return {
      originalColumn: column,
      prefix: "person.",
      fieldName: "email",
      targetEntity: "Person",
      isAutoCreate: false,
      confidence: 70,
    };
  }

  // Common serial number patterns
  if (
    normalized.includes("serial") ||
    normalized === "sn" ||
    normalized === "s/n"
  ) {
    return {
      originalColumn: column,
      prefix: "asset.",
      fieldName: "serialNumber",
      targetEntity: "Asset",
      isAutoCreate: false,
      confidence: 70,
    };
  }

  // No match - return as unmapped
  return {
    originalColumn: column,
    prefix: null,
    fieldName: normalizeFieldName(normalized),
    targetEntity: "Unknown",
    isAutoCreate: false,
    confidence: 0,
  };
}

/**
 * Normalize field name to snake_case
 */
export function normalizeFieldName(rawName: string): string {
  return rawName
    .toLowerCase()
    .replace(/\s+/g, "_") // spaces to underscores
    .replace(/[^a-z0-9_]/g, "") // remove special chars
    .replace(/_+/g, "_") // collapse multiple underscores
    .replace(/^_|_$/g, ""); // trim leading/trailing underscores
}

/**
 * Generate human-readable label from snake_case name
 */
export function generateFieldLabel(snakeCaseName: string): string {
  return snakeCaseName
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

/**
 * Group a single row's data by entity prefix
 */
export function groupRowByPrefix(
  row: Record<string, unknown>,
  columns: PrefixedColumn[],
): GroupedRowData {
  const result: GroupedRowData = {
    person: { email: "" },
    asset: { serialNumber: "" },
    custom: {},
  };

  for (const column of columns) {
    const value = row[column.originalColumn];

    // Skip empty values
    if (value === null || value === undefined || String(value).trim() === "") {
      continue;
    }

    // Map snake_case field name to camelCase property name
    const propertyName = mapFieldNameToProperty(
      column.prefix,
      column.fieldName,
    );

    switch (column.prefix) {
      case "person.":
        if (!result.person) result.person = { email: "" };
        (result.person as unknown as Record<string, unknown>)[propertyName] =
          value;
        break;

      case "asset.":
        (result.asset as unknown as Record<string, unknown>)[propertyName] =
          value;
        break;

      case "vendor.":
        if (!result.vendor) result.vendor = {};
        (result.vendor as Record<string, unknown>)[propertyName] = value;
        break;

      case "category.":
        if (!result.category) result.category = {};
        (result.category as Record<string, unknown>)[propertyName] = value;
        break;

      case "model.":
        if (!result.model) result.model = {};
        (result.model as Record<string, unknown>)[propertyName] = value;
        break;

      case "location.":
        if (!result.location) result.location = {};
        (result.location as Record<string, unknown>)[propertyName] = value;
        break;

      case "stock_location.":
        if (!result.stockLocation) result.stockLocation = {};
        (result.stockLocation as Record<string, unknown>)[propertyName] = value;
        break;

      case "lifecycle.":
        if (!result.lifecycle) result.lifecycle = {};
        (result.lifecycle as Record<string, unknown>)[propertyName] = value;
        break;

      case "custom.":
        // Custom fields keep their snake_case names
        result.custom[column.fieldName] = value;
        break;

      default:
        // Unmapped column - ignore
        break;
    }
  }

  return result;
}

/**
 * Parse all rows and group by prefix
 */
export function parseRows(
  rows: Array<Record<string, unknown>>,
  columnHeaders: string[],
): Array<{ rowNumber: number; data: GroupedRowData }> {
  const columns = detectPrefixedColumns(columnHeaders);

  return rows.map((row, index) => ({
    rowNumber: index + 1,
    data: groupRowByPrefix(row, columns),
  }));
}

/**
 * Validate that required prefixes are present in column headers
 */
export function validateRequiredColumns(columns: PrefixedColumn[]): {
  valid: boolean;
  missingRequired: string[];
  warnings: string[];
} {
  const missingRequired: string[] = [];
  const warnings: string[] = [];

  // Check for person.email (optional - assets can be imported without assignment)
  const hasPersonEmail = columns.some(
    (c) => c.prefix === "person." && c.fieldName === "email",
  );
  if (!hasPersonEmail) {
    warnings.push(
      "person.email column not found - assets will be imported without assignment",
    );
  }

  // Check for asset.serial_number or asset.serialnumber
  const hasSerialNumber = columns.some(
    (c) =>
      c.prefix === "asset." &&
      (c.fieldName === "serial_number" || c.fieldName === "serialnumber"),
  );
  if (!hasSerialNumber) {
    missingRequired.push(
      "asset.serial_number (required for unique identification)",
    );
  }

  // Check for category (either code or name)
  const hasCategory = columns.some(
    (c) =>
      c.prefix === "category." &&
      (c.fieldName === "code" || c.fieldName === "name"),
  );
  if (!hasCategory) {
    warnings.push(
      "No category.code or category.name found - category is recommended",
    );
  }

  return {
    valid: missingRequired.length === 0,
    missingRequired,
    warnings,
  };
}

/**
 * Get summary of detected column groups
 */
export function getColumnGroupSummary(columns: PrefixedColumn[]): {
  person: number;
  asset: number;
  vendor: number;
  category: number;
  model: number;
  location: number;
  stockLocation: number;
  lifecycle: number;
  custom: number;
  unmapped: number;
} {
  const summary = {
    person: 0,
    asset: 0,
    vendor: 0,
    category: 0,
    model: 0,
    location: 0,
    stockLocation: 0,
    lifecycle: 0,
    custom: 0,
    unmapped: 0,
  };

  for (const col of columns) {
    switch (col.prefix) {
      case "person.":
        summary.person++;
        break;
      case "asset.":
        summary.asset++;
        break;
      case "vendor.":
        summary.vendor++;
        break;
      case "category.":
        summary.category++;
        break;
      case "model.":
        summary.model++;
        break;
      case "location.":
        summary.location++;
        break;
      case "stock_location.":
        summary.stockLocation++;
        break;
      case "lifecycle.":
        summary.lifecycle++;
        break;
      case "custom.":
        summary.custom++;
        break;
      default:
        summary.unmapped++;
        break;
    }
  }

  return summary;
}

/**
 * Extract unique values for a specific entity prefix from all rows
 * Used for batch lookups/creation
 */
export function extractUniqueEntityValues(
  rows: Array<{ data: GroupedRowData }>,
  entityPrefix: "vendor" | "category" | "model" | "location" | "stockLocation",
): Array<Record<string, unknown>> {
  const uniqueMap = new Map<string, Record<string, unknown>>();

  for (const row of rows) {
    const entityData = row.data[entityPrefix];
    if (!entityData) continue;

    // Use code or name as the unique key
    const key =
      (entityData as Record<string, unknown>).code ||
      (entityData as Record<string, unknown>).name;
    if (!key) continue;

    const keyStr = String(key).toLowerCase().trim();
    if (!uniqueMap.has(keyStr)) {
      uniqueMap.set(keyStr, entityData as Record<string, unknown>);
    }
  }

  return Array.from(uniqueMap.values());
}

/**
 * Extract unique person emails from all rows
 */
export function extractUniquePersonEmails(
  rows: Array<{ data: GroupedRowData }>,
): string[] {
  const emails = new Set<string>();

  for (const row of rows) {
    const email = row.data.person?.email;
    if (email && typeof email === "string" && email.trim()) {
      emails.add(email.toLowerCase().trim());
    }
  }

  return Array.from(emails);
}

/**
 * Extract unique custom field names from all rows
 */
export function extractCustomFieldNames(
  rows: Array<{ data: GroupedRowData }>,
): string[] {
  const fieldNames = new Set<string>();

  for (const row of rows) {
    for (const key of Object.keys(row.data.custom)) {
      fieldNames.add(key);
    }
  }

  return Array.from(fieldNames);
}

/**
 * Result of duplicate detection within an import file
 */
export interface DuplicateDetectionResult {
  /** Whether any duplicates were found */
  hasDuplicates: boolean;
  /** List of duplicate serial numbers with their row numbers */
  duplicateSerialNumbers: Array<{
    serialNumber: string;
    rowNumbers: number[];
  }>;
  /** Total count of duplicate rows (excludes first occurrence) */
  totalDuplicateRows: number;
}

/**
 * Detect duplicate serial numbers within the import file before processing
 *
 * This helps users identify data issues before import begins.
 * Note: Duplicates within the file will result in the later rows updating
 * the earlier ones, which may not be the intended behavior.
 */
export function detectDuplicatesInFile(
  rows: Array<{ rowNumber: number; data: GroupedRowData }>,
): DuplicateDetectionResult {
  const serialNumberMap = new Map<string, number[]>();

  for (const row of rows) {
    const serialNumber = row.data.asset?.serialNumber;
    if (!serialNumber) continue;

    // Normalize for comparison (uppercase, trimmed)
    const normalized = String(serialNumber).trim().toUpperCase();
    if (!normalized) continue;

    const existing = serialNumberMap.get(normalized) || [];
    existing.push(row.rowNumber);
    serialNumberMap.set(normalized, existing);
  }

  const duplicates: Array<{ serialNumber: string; rowNumbers: number[] }> = [];
  let totalDuplicateRows = 0;

  for (const [serialNumber, rowNumbers] of serialNumberMap) {
    if (rowNumbers.length > 1) {
      duplicates.push({ serialNumber, rowNumbers });
      // Count extras (all occurrences after the first)
      totalDuplicateRows += rowNumbers.length - 1;
    }
  }

  return {
    hasDuplicates: duplicates.length > 0,
    duplicateSerialNumbers: duplicates,
    totalDuplicateRows,
  };
}
