/**
 * Prefix Parser - Unit Tests
 *
 * Tests for column detection, validation, and row grouping.
 * These are pure functions with no external dependencies.
 */

import { describe, it, expect } from "vitest";
import {
  detectPrefixedColumns,
  normalizeFieldName,
  generateFieldLabel,
  groupRowByPrefix,
  validateRequiredColumns,
  extractUniquePersonEmails,
  extractUniqueEntityValues,
  detectDuplicatesInFile,
  getColumnGroupSummary,
  extractCustomFieldNames,
} from "../prefix-parser";
import type { PrefixedColumn, GroupedRowData } from "../types";

// ============================================================================
// detectPrefixedColumns
// ============================================================================

describe("detectPrefixedColumns", () => {
  describe("prefix detection for all 9 prefixes", () => {
    it("should detect person. prefix", () => {
      const columns = detectPrefixedColumns(["person.email"]);
      expect(columns[0].prefix).toBe("person.");
      expect(columns[0].fieldName).toBe("email");
      expect(columns[0].targetEntity).toBe("Person");
    });

    it("should detect asset. prefix", () => {
      const columns = detectPrefixedColumns(["asset.serial_number"]);
      expect(columns[0].prefix).toBe("asset.");
      expect(columns[0].fieldName).toBe("serial_number");
      expect(columns[0].targetEntity).toBe("Asset");
    });

    it("should detect vendor. prefix", () => {
      const columns = detectPrefixedColumns(["vendor.code", "vendor.name"]);
      expect(columns[0].prefix).toBe("vendor.");
      expect(columns[1].prefix).toBe("vendor.");
      expect(columns[0].targetEntity).toBe("Vendor");
    });

    it("should detect category. prefix", () => {
      const columns = detectPrefixedColumns(["category.code"]);
      expect(columns[0].prefix).toBe("category.");
      expect(columns[0].targetEntity).toBe("AssetCategory");
    });

    it("should detect model. prefix", () => {
      const columns = detectPrefixedColumns(["model.name"]);
      expect(columns[0].prefix).toBe("model.");
      expect(columns[0].targetEntity).toBe("AssetModel");
    });

    it("should detect location. prefix", () => {
      const columns = detectPrefixedColumns(["location.code"]);
      expect(columns[0].prefix).toBe("location.");
      expect(columns[0].targetEntity).toBe("Location");
    });

    it("should detect stock_location. prefix", () => {
      const columns = detectPrefixedColumns(["stock_location.code"]);
      expect(columns[0].prefix).toBe("stock_location.");
      expect(columns[0].targetEntity).toBe("StockLocation");
    });

    it("should detect lifecycle. prefix", () => {
      const columns = detectPrefixedColumns(["lifecycle.code"]);
      expect(columns[0].prefix).toBe("lifecycle.");
      expect(columns[0].targetEntity).toBe("LifecycleState");
    });

    it("should detect custom. prefix", () => {
      const columns = detectPrefixedColumns(["custom.cpu_cores"]);
      expect(columns[0].prefix).toBe("custom.");
      expect(columns[0].fieldName).toBe("cpu_cores");
      expect(columns[0].targetEntity).toBe("FieldDefinition");
    });
  });

  describe("case insensitivity", () => {
    it("should detect VENDOR.Name as vendor prefix", () => {
      const columns = detectPrefixedColumns(["VENDOR.Name"]);
      expect(columns[0].prefix).toBe("vendor.");
      expect(columns[0].fieldName).toBe("name");
    });

    it("should detect vendor.NAME as vendor prefix", () => {
      const columns = detectPrefixedColumns(["vendor.NAME"]);
      expect(columns[0].prefix).toBe("vendor.");
      expect(columns[0].fieldName).toBe("name");
    });

    it("should detect Person.Email as person prefix", () => {
      const columns = detectPrefixedColumns(["Person.Email"]);
      expect(columns[0].prefix).toBe("person.");
      expect(columns[0].fieldName).toBe("email");
    });
  });

  describe("whitespace handling", () => {
    it("should trim whitespace from column names", () => {
      const columns = detectPrefixedColumns(["  vendor.code  "]);
      expect(columns[0].prefix).toBe("vendor.");
      expect(columns[0].fieldName).toBe("code");
    });
  });

  describe("pattern inference", () => {
    it("should infer person.email from column containing 'email'", () => {
      const columns = detectPrefixedColumns(["user_email"]);
      expect(columns[0].prefix).toBe("person.");
      expect(columns[0].fieldName).toBe("email");
      expect(columns[0].confidence).toBe(70);
    });

    it("should infer person.email from column containing 'assignee'", () => {
      const columns = detectPrefixedColumns(["assignee"]);
      expect(columns[0].prefix).toBe("person.");
      expect(columns[0].fieldName).toBe("email");
    });

    it("should infer person.email from column containing 'user'", () => {
      const columns = detectPrefixedColumns(["user"]);
      expect(columns[0].prefix).toBe("person.");
      expect(columns[0].fieldName).toBe("email");
    });

    it("should infer asset.serial_number from column containing 'serial'", () => {
      const columns = detectPrefixedColumns(["serial_number"]);
      expect(columns[0].prefix).toBe("asset.");
      expect(columns[0].fieldName).toBe("serialNumber");
    });

    it("should infer asset.serial_number from column 'sn'", () => {
      const columns = detectPrefixedColumns(["sn"]);
      expect(columns[0].prefix).toBe("asset.");
      expect(columns[0].fieldName).toBe("serialNumber");
    });

    it("should infer asset.serial_number from column 's/n'", () => {
      const columns = detectPrefixedColumns(["s/n"]);
      expect(columns[0].prefix).toBe("asset.");
      expect(columns[0].fieldName).toBe("serialNumber");
    });
  });

  describe("confidence scores", () => {
    it("should return confidence 100 for exact prefix match", () => {
      const columns = detectPrefixedColumns(["vendor.code"]);
      expect(columns[0].confidence).toBe(100);
    });

    it("should return confidence 70 for inferred match", () => {
      const columns = detectPrefixedColumns(["email"]);
      expect(columns[0].confidence).toBe(70);
    });

    it("should return confidence 0 for unmapped columns", () => {
      const columns = detectPrefixedColumns(["random_column"]);
      expect(columns[0].confidence).toBe(0);
    });
  });

  describe("unmapped columns", () => {
    it("should return null prefix for unmapped columns", () => {
      const columns = detectPrefixedColumns(["random_column"]);
      expect(columns[0].prefix).toBe(null);
      expect(columns[0].targetEntity).toBe("Unknown");
    });
  });

  describe("isAutoCreate flag", () => {
    it("should set isAutoCreate=false for person", () => {
      const columns = detectPrefixedColumns(["person.email"]);
      expect(columns[0].isAutoCreate).toBe(false);
    });

    it("should set isAutoCreate=true for vendor", () => {
      const columns = detectPrefixedColumns(["vendor.code"]);
      expect(columns[0].isAutoCreate).toBe(true);
    });

    it("should set isAutoCreate=false for lifecycle", () => {
      const columns = detectPrefixedColumns(["lifecycle.code"]);
      expect(columns[0].isAutoCreate).toBe(false);
    });
  });
});

// ============================================================================
// normalizeFieldName
// ============================================================================

describe("normalizeFieldName", () => {
  it("should convert spaces to underscores", () => {
    expect(normalizeFieldName("CPU Cores")).toBe("cpu_cores");
  });

  it("should remove special characters", () => {
    expect(normalizeFieldName("cpu@cores!")).toBe("cpucores");
  });

  it("should collapse multiple underscores", () => {
    expect(normalizeFieldName("cpu__cores")).toBe("cpu_cores");
  });

  it("should trim leading/trailing underscores", () => {
    expect(normalizeFieldName("_cpu_cores_")).toBe("cpu_cores");
  });

  it("should convert to lowercase", () => {
    expect(normalizeFieldName("CPU_Cores")).toBe("cpu_cores");
  });

  it("should handle empty string", () => {
    expect(normalizeFieldName("")).toBe("");
  });

  it("should handle string with only special characters", () => {
    expect(normalizeFieldName("@#$%^&*()")).toBe("");
  });

  it("should handle mixed spaces and special chars", () => {
    expect(normalizeFieldName("CPU - Cores (count)")).toBe("cpu_cores_count");
  });

  it("should handle camelCase", () => {
    expect(normalizeFieldName("cpuCores")).toBe("cpucores");
  });
});

// ============================================================================
// generateFieldLabel
// ============================================================================

describe("generateFieldLabel", () => {
  it("should capitalize each word", () => {
    expect(generateFieldLabel("cpu_cores")).toBe("Cpu Cores");
  });

  it("should handle single word", () => {
    expect(generateFieldLabel("name")).toBe("Name");
  });

  it("should handle empty string", () => {
    expect(generateFieldLabel("")).toBe("");
  });

  it("should handle multiple underscores", () => {
    expect(generateFieldLabel("purchase_order_number")).toBe(
      "Purchase Order Number",
    );
  });
});

// ============================================================================
// groupRowByPrefix
// ============================================================================

describe("groupRowByPrefix", () => {
  const createColumns = (headers: string[]): PrefixedColumn[] => {
    return detectPrefixedColumns(headers);
  };

  describe("field grouping", () => {
    it("should group person fields into result.person", () => {
      const columns = createColumns(["person.email"]);
      const row = { "person.email": "john@barq.com" };
      const result = groupRowByPrefix(row, columns);
      expect(result.person.email).toBe("john@barq.com");
    });

    it("should group asset fields into result.asset with camelCase keys", () => {
      const columns = createColumns(["asset.serial_number", "asset.asset_tag"]);
      const row = {
        "asset.serial_number": "SN-001",
        "asset.asset_tag": "TAG-001",
      };
      const result = groupRowByPrefix(row, columns);
      // Values are mapped from snake_case to camelCase property names
      expect(result.asset.serialNumber).toBe("SN-001");
      expect(result.asset.assetTag).toBe("TAG-001");
    });

    it("should group vendor fields into result.vendor", () => {
      const columns = createColumns(["vendor.code", "vendor.name"]);
      const row = { "vendor.code": "DELL", "vendor.name": "Dell Technologies" };
      const result = groupRowByPrefix(row, columns);
      expect(result.vendor?.code).toBe("DELL");
      expect(result.vendor?.name).toBe("Dell Technologies");
    });

    it("should group category fields into result.category", () => {
      const columns = createColumns(["category.code"]);
      const row = { "category.code": "LAPTOP" };
      const result = groupRowByPrefix(row, columns);
      expect(result.category?.code).toBe("LAPTOP");
    });

    it("should group model fields into result.model", () => {
      const columns = createColumns(["model.name"]);
      const row = { "model.name": "Latitude 5520" };
      const result = groupRowByPrefix(row, columns);
      expect(result.model?.name).toBe("Latitude 5520");
    });

    it("should group location fields into result.location", () => {
      const columns = createColumns(["location.code"]);
      const row = { "location.code": "RUH-HQ" };
      const result = groupRowByPrefix(row, columns);
      expect(result.location?.code).toBe("RUH-HQ");
    });

    it("should group stock_location fields into result.stockLocation", () => {
      const columns = createColumns(["stock_location.code"]);
      const row = { "stock_location.code": "WH-1" };
      const result = groupRowByPrefix(row, columns);
      expect(result.stockLocation?.code).toBe("WH-1");
    });

    it("should group lifecycle fields into result.lifecycle", () => {
      const columns = createColumns(["lifecycle.code"]);
      const row = { "lifecycle.code": "IN_USE" };
      const result = groupRowByPrefix(row, columns);
      expect(result.lifecycle?.code).toBe("IN_USE");
    });

    it("should group custom fields into result.custom", () => {
      const columns = createColumns(["custom.cpu_cores", "custom.ram_gb"]);
      const row = { "custom.cpu_cores": "8", "custom.ram_gb": "16" };
      const result = groupRowByPrefix(row, columns);
      expect(result.custom.cpu_cores).toBe("8");
      expect(result.custom.ram_gb).toBe("16");
    });
  });

  describe("value handling", () => {
    it("should skip null values", () => {
      const columns = createColumns(["vendor.code"]);
      const row = { "vendor.code": null };
      const result = groupRowByPrefix(row, columns);
      expect(result.vendor).toBeUndefined();
    });

    it("should skip undefined values", () => {
      const columns = createColumns(["vendor.code"]);
      const row = { "vendor.code": undefined };
      const result = groupRowByPrefix(row, columns);
      expect(result.vendor).toBeUndefined();
    });

    it("should skip empty string values", () => {
      const columns = createColumns(["vendor.code"]);
      const row = { "vendor.code": "" };
      const result = groupRowByPrefix(row, columns);
      expect(result.vendor).toBeUndefined();
    });

    it("should skip whitespace-only values", () => {
      const columns = createColumns(["vendor.code"]);
      const row = { "vendor.code": "   " };
      const result = groupRowByPrefix(row, columns);
      expect(result.vendor).toBeUndefined();
    });

    it("should ignore unmapped columns", () => {
      const columns = createColumns(["random_column", "person.email"]);
      const row = { random_column: "value", "person.email": "test@barq.com" };
      const result = groupRowByPrefix(row, columns);
      expect(result.person.email).toBe("test@barq.com");
      expect(
        (result as unknown as Record<string, unknown>).random_column,
      ).toBeUndefined();
    });
  });

  describe("initialization", () => {
    it("should always initialize person with { email: '' }", () => {
      const columns = createColumns([]);
      const row = {};
      const result = groupRowByPrefix(row, columns);
      expect(result.person).toEqual({ email: "" });
    });

    it("should always initialize asset with { serialNumber: '' }", () => {
      const columns = createColumns([]);
      const row = {};
      const result = groupRowByPrefix(row, columns);
      expect(result.asset).toEqual({ serialNumber: "" });
    });

    it("should always initialize custom as empty object", () => {
      const columns = createColumns([]);
      const row = {};
      const result = groupRowByPrefix(row, columns);
      expect(result.custom).toEqual({});
    });

    it("should NOT initialize optional groups until data exists", () => {
      const columns = createColumns([]);
      const row = {};
      const result = groupRowByPrefix(row, columns);
      expect(result.vendor).toBeUndefined();
      expect(result.category).toBeUndefined();
      expect(result.model).toBeUndefined();
      expect(result.location).toBeUndefined();
      expect(result.stockLocation).toBeUndefined();
      expect(result.lifecycle).toBeUndefined();
    });
  });
});

// ============================================================================
// validateRequiredColumns
// ============================================================================

describe("validateRequiredColumns", () => {
  describe("required columns", () => {
    it("should be valid when person.email column present", () => {
      const columns = detectPrefixedColumns([
        "person.email",
        "asset.serial_number",
      ]);
      const result = validateRequiredColumns(columns);
      expect(result.missingRequired).not.toContain(
        expect.stringContaining("person.email"),
      );
    });

    it("should be valid when asset.serial_number column present", () => {
      const columns = detectPrefixedColumns([
        "person.email",
        "asset.serial_number",
      ]);
      const result = validateRequiredColumns(columns);
      expect(result.missingRequired).not.toContain(
        expect.stringContaining("asset.serial_number"),
      );
    });

    it("should be valid when asset.serialnumber column present (alternate spelling)", () => {
      const columns = detectPrefixedColumns([
        "person.email",
        "asset.serialnumber",
      ]);
      const result = validateRequiredColumns(columns);
      expect(result.valid).toBe(true);
    });

    it("should add warning (not error) without person.email column", () => {
      // person.email is optional - assets can be imported without assignment
      const columns = detectPrefixedColumns([
        "asset.serial_number",
        "category.code",
      ]);
      const result = validateRequiredColumns(columns);
      expect(result.valid).toBe(true); // Should be valid - person.email is optional
      expect(result.warnings.some((w) => w.includes("person.email"))).toBe(
        true,
      );
      expect(
        result.missingRequired.some((r) => r.includes("person.email")),
      ).toBe(false);
    });

    it("should be invalid without asset.serial_number column", () => {
      const columns = detectPrefixedColumns(["person.email"]);
      const result = validateRequiredColumns(columns);
      expect(result.valid).toBe(false);
      expect(
        result.missingRequired.some((r) => r.includes("serial_number")),
      ).toBe(true);
    });

    it("should return all missing required columns in missingRequired array", () => {
      // Only asset.serial_number is truly required (person.email is optional)
      const columns = detectPrefixedColumns(["vendor.code"]);
      const result = validateRequiredColumns(columns);
      expect(result.missingRequired.length).toBe(1); // Only serial_number
      expect(
        result.missingRequired.some((r) => r.includes("serial_number")),
      ).toBe(true);
    });
  });

  describe("warnings", () => {
    it("should add warning when category.code missing", () => {
      const columns = detectPrefixedColumns([
        "person.email",
        "asset.serial_number",
      ]);
      const result = validateRequiredColumns(columns);
      expect(result.warnings.some((w) => w.includes("category"))).toBe(true);
    });

    it("should add warning when category.name missing", () => {
      const columns = detectPrefixedColumns([
        "person.email",
        "asset.serial_number",
      ]);
      const result = validateRequiredColumns(columns);
      expect(result.warnings.some((w) => w.includes("category"))).toBe(true);
    });

    it("should NOT warn when category.code present", () => {
      const columns = detectPrefixedColumns([
        "person.email",
        "asset.serial_number",
        "category.code",
      ]);
      const result = validateRequiredColumns(columns);
      expect(result.warnings.some((w) => w.includes("category"))).toBe(false);
    });

    it("should NOT warn when category.name present", () => {
      const columns = detectPrefixedColumns([
        "person.email",
        "asset.serial_number",
        "category.name",
      ]);
      const result = validateRequiredColumns(columns);
      expect(result.warnings.some((w) => w.includes("category"))).toBe(false);
    });
  });
});

// ============================================================================
// detectDuplicatesInFile
// ============================================================================

describe("detectDuplicatesInFile", () => {
  const createParsedRows = (
    serialNumbers: (string | null | undefined)[],
  ): Array<{ rowNumber: number; data: GroupedRowData }> => {
    return serialNumbers.map((sn, idx) => ({
      rowNumber: idx + 1,
      data: {
        person: { email: "" },
        asset: { serialNumber: sn || "" },
        custom: {},
      },
    }));
  };

  describe("no duplicates", () => {
    it("should return hasDuplicates: false for unique serial numbers", () => {
      const rows = createParsedRows(["SN-001", "SN-002", "SN-003"]);
      const result = detectDuplicatesInFile(rows);
      expect(result.hasDuplicates).toBe(false);
    });

    it("should return empty duplicateSerialNumbers array", () => {
      const rows = createParsedRows(["SN-001", "SN-002"]);
      const result = detectDuplicatesInFile(rows);
      expect(result.duplicateSerialNumbers).toEqual([]);
    });

    it("should return totalDuplicateRows: 0", () => {
      const rows = createParsedRows(["SN-001", "SN-002"]);
      const result = detectDuplicatesInFile(rows);
      expect(result.totalDuplicateRows).toBe(0);
    });
  });

  describe("duplicate detection", () => {
    it("should detect duplicate serial numbers", () => {
      const rows = createParsedRows(["SN-001", "SN-001"]);
      const result = detectDuplicatesInFile(rows);
      expect(result.hasDuplicates).toBe(true);
    });

    it("should be case-insensitive", () => {
      const rows = createParsedRows(["ABC123", "abc123"]);
      const result = detectDuplicatesInFile(rows);
      expect(result.hasDuplicates).toBe(true);
    });

    it("should trim whitespace for comparison", () => {
      const rows = createParsedRows(["ABC123 ", " ABC123"]);
      const result = detectDuplicatesInFile(rows);
      expect(result.hasDuplicates).toBe(true);
    });

    it("should return correct row numbers for each duplicate", () => {
      const rows = createParsedRows(["SN-001", "SN-002", "SN-001"]);
      const result = detectDuplicatesInFile(rows);
      const dup = result.duplicateSerialNumbers.find(
        (d) => d.serialNumber === "SN-001",
      );
      expect(dup?.rowNumbers).toEqual([1, 3]);
    });

    it("should calculate totalDuplicateRows correctly", () => {
      const rows = createParsedRows(["SN-001", "SN-001", "SN-001"]);
      const result = detectDuplicatesInFile(rows);
      expect(result.totalDuplicateRows).toBe(2); // 3 occurrences - 1 first = 2 extras
    });

    it("should handle multiple duplicate groups separately", () => {
      const rows = createParsedRows([
        "SN-001",
        "SN-001",
        "SN-002",
        "SN-002",
        "SN-003",
      ]);
      const result = detectDuplicatesInFile(rows);
      expect(result.duplicateSerialNumbers.length).toBe(2);
      expect(result.totalDuplicateRows).toBe(2);
    });
  });

  describe("edge cases", () => {
    it("should skip rows with empty serial numbers", () => {
      const rows = createParsedRows(["SN-001", "", "SN-002"]);
      const result = detectDuplicatesInFile(rows);
      expect(result.hasDuplicates).toBe(false);
    });

    it("should skip rows with null serial numbers", () => {
      const rows = createParsedRows(["SN-001", null, "SN-002"]);
      const result = detectDuplicatesInFile(rows);
      expect(result.hasDuplicates).toBe(false);
    });

    it("should handle single row", () => {
      const rows = createParsedRows(["SN-001"]);
      const result = detectDuplicatesInFile(rows);
      expect(result.hasDuplicates).toBe(false);
    });

    it("should handle empty row array", () => {
      const rows = createParsedRows([]);
      const result = detectDuplicatesInFile(rows);
      expect(result.hasDuplicates).toBe(false);
      expect(result.duplicateSerialNumbers).toEqual([]);
    });
  });
});

// ============================================================================
// extractUniquePersonEmails
// ============================================================================

describe("extractUniquePersonEmails", () => {
  const createRows = (
    emails: (string | null | undefined)[],
  ): Array<{ data: GroupedRowData }> => {
    return emails.map((email) => ({
      data: {
        person: { email: email || "" },
        asset: { serialNumber: "" },
        custom: {},
      },
    }));
  };

  it("should extract unique emails from multiple rows", () => {
    const rows = createRows(["a@barq.com", "b@barq.com"]);
    const result = extractUniquePersonEmails(rows);
    expect(result).toContain("a@barq.com");
    expect(result).toContain("b@barq.com");
  });

  it("should deduplicate case-insensitively", () => {
    const rows = createRows(["User@example.com", "user@example.com"]);
    const result = extractUniquePersonEmails(rows);
    expect(result.length).toBe(1);
  });

  it("should trim whitespace from emails", () => {
    const rows = createRows(["  test@barq.com  "]);
    const result = extractUniquePersonEmails(rows);
    expect(result[0]).toBe("test@barq.com");
  });

  it("should skip rows with empty email", () => {
    const rows = createRows(["valid@barq.com", ""]);
    const result = extractUniquePersonEmails(rows);
    expect(result.length).toBe(1);
  });

  it("should skip rows with null email", () => {
    const rows = createRows(["valid@barq.com", null]);
    const result = extractUniquePersonEmails(rows);
    expect(result.length).toBe(1);
  });

  it("should return empty array when no emails found", () => {
    const rows = createRows(["", null, undefined]);
    const result = extractUniquePersonEmails(rows);
    expect(result).toEqual([]);
  });
});

// ============================================================================
// extractUniqueEntityValues
// ============================================================================

describe("extractUniqueEntityValues", () => {
  const createVendorRows = (
    vendors: Array<{ code?: string; name?: string }>,
  ): Array<{ data: GroupedRowData }> => {
    return vendors.map((v) => ({
      data: {
        person: { email: "" },
        asset: { serialNumber: "" },
        vendor: v,
        custom: {},
      },
    }));
  };

  it("should extract unique vendors by code", () => {
    const rows = createVendorRows([
      { code: "DELL" },
      { code: "HP" },
      { code: "DELL" },
    ]);
    const result = extractUniqueEntityValues(rows, "vendor");
    expect(result.length).toBe(2);
  });

  it("should extract unique vendors by name when code missing", () => {
    const rows = createVendorRows([
      { name: "Dell Technologies" },
      { name: "HP Inc." },
    ]);
    const result = extractUniqueEntityValues(rows, "vendor");
    expect(result.length).toBe(2);
  });

  it("should deduplicate case-insensitively", () => {
    const rows = createVendorRows([{ code: "DELL" }, { code: "dell" }]);
    const result = extractUniqueEntityValues(rows, "vendor");
    expect(result.length).toBe(1);
  });

  it("should skip entities without code or name", () => {
    const rows = createVendorRows([{ code: "DELL" }, {}]);
    const result = extractUniqueEntityValues(rows, "vendor");
    expect(result.length).toBe(1);
  });
});

// ============================================================================
// extractCustomFieldNames
// ============================================================================

describe("extractCustomFieldNames", () => {
  const createCustomRows = (
    customFields: Array<Record<string, unknown>>,
  ): Array<{ data: GroupedRowData }> => {
    return customFields.map((custom) => ({
      data: {
        person: { email: "" },
        asset: { serialNumber: "" },
        custom,
      },
    }));
  };

  it("should extract all unique custom field names", () => {
    const rows = createCustomRows([
      { cpu_cores: "8", ram_gb: "16" },
      { cpu_cores: "4", storage: "512" },
    ]);
    const result = extractCustomFieldNames(rows);
    expect(result).toContain("cpu_cores");
    expect(result).toContain("ram_gb");
    expect(result).toContain("storage");
    expect(result.length).toBe(3);
  });

  it("should deduplicate field names across rows", () => {
    const rows = createCustomRows([{ cpu_cores: "8" }, { cpu_cores: "4" }]);
    const result = extractCustomFieldNames(rows);
    expect(result.length).toBe(1);
  });

  it("should return empty array when no custom fields", () => {
    const rows = createCustomRows([{}, {}]);
    const result = extractCustomFieldNames(rows);
    expect(result).toEqual([]);
  });
});

// ============================================================================
// getColumnGroupSummary
// ============================================================================

describe("getColumnGroupSummary", () => {
  it("should count columns by group", () => {
    const columns = detectPrefixedColumns([
      "person.email",
      "asset.serial_number",
      "asset.asset_tag",
      "vendor.code",
      "vendor.name",
      "category.code",
      "model.name",
      "location.code",
      "stock_location.code",
      "lifecycle.code",
      "custom.cpu",
      "custom.ram",
      "random_column",
    ]);
    const summary = getColumnGroupSummary(columns);

    expect(summary.person).toBe(1);
    expect(summary.asset).toBe(2);
    expect(summary.vendor).toBe(2);
    expect(summary.category).toBe(1);
    expect(summary.model).toBe(1);
    expect(summary.location).toBe(1);
    expect(summary.stockLocation).toBe(1);
    expect(summary.lifecycle).toBe(1);
    expect(summary.custom).toBe(2);
    expect(summary.unmapped).toBe(1);
  });

  it("should return all zeros for empty columns", () => {
    const summary = getColumnGroupSummary([]);
    expect(summary.person).toBe(0);
    expect(summary.unmapped).toBe(0);
  });
});
