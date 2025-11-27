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

    const fieldName = column.fieldName;

    switch (column.prefix) {
      case "person.":
        if (!result.person) result.person = { email: "" };
        (result.person as unknown as Record<string, unknown>)[fieldName] =
          value;
        break;

      case "asset.":
        (result.asset as unknown as Record<string, unknown>)[fieldName] = value;
        break;

      case "vendor.":
        if (!result.vendor) result.vendor = {};
        (result.vendor as Record<string, unknown>)[fieldName] = value;
        break;

      case "category.":
        if (!result.category) result.category = {};
        (result.category as Record<string, unknown>)[fieldName] = value;
        break;

      case "model.":
        if (!result.model) result.model = {};
        (result.model as Record<string, unknown>)[fieldName] = value;
        break;

      case "location.":
        if (!result.location) result.location = {};
        (result.location as Record<string, unknown>)[fieldName] = value;
        break;

      case "stock_location.":
        if (!result.stockLocation) result.stockLocation = {};
        (result.stockLocation as Record<string, unknown>)[fieldName] = value;
        break;

      case "lifecycle.":
        if (!result.lifecycle) result.lifecycle = {};
        (result.lifecycle as Record<string, unknown>)[fieldName] = value;
        break;

      case "custom.":
        result.custom[fieldName] = value;
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

  // Check for person.email
  const hasPersonEmail = columns.some(
    (c) => c.prefix === "person." && c.fieldName === "email",
  );
  if (!hasPersonEmail) {
    missingRequired.push("person.email (required for assignment)");
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
