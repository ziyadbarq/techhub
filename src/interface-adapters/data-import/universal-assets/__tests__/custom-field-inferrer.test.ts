/**
 * Custom Field Inferrer - Unit Tests
 *
 * Tests for data type inference and field definition management.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { inferDataType, CustomFieldInferrer } from "../custom-field-inferrer";
import { FieldDataTypeEnum } from "@/core/domain/value-objects/foundation-enums";
import type { GroupedRowData, InferredFieldDefinition } from "../types";
import {
  createMockFieldDefinitionRepository,
  createMockAssetCategoryFieldRepository,
} from "./mocks/repositories.mock";
import { createMockLogger } from "./mocks/logger.mock";

// ============================================================================
// Mock DI Container Setup
// ============================================================================

const mockFieldDefRepo = createMockFieldDefinitionRepository();
const mockCategoryFieldRepo = createMockAssetCategoryFieldRepository();
const mockLogger = createMockLogger();

vi.mock("@/di/container", () => ({
  getContainer: vi.fn(() => ({
    get: vi.fn((token) => {
      const tokenKey = token.toString();
      if (tokenKey === Symbol.for("IFieldDefinitionRepository").toString()) {
        return mockFieldDefRepo;
      }
      if (tokenKey === Symbol.for("IAssetCategoryFieldRepository").toString()) {
        return mockCategoryFieldRepo;
      }
      if (tokenKey === Symbol.for("ILoggerService").toString()) {
        return mockLogger;
      }
      return null;
    }),
  })),
}));

// ============================================================================
// inferDataType - Pure Function Tests
// ============================================================================

describe("inferDataType", () => {
  describe("BOOLEAN inference", () => {
    it("should infer BOOLEAN from ['true', 'false']", () => {
      expect(inferDataType(["true", "false"])).toBe(FieldDataTypeEnum.BOOLEAN);
    });

    it("should infer BOOLEAN from ['yes', 'no']", () => {
      expect(inferDataType(["yes", "no"])).toBe(FieldDataTypeEnum.BOOLEAN);
    });

    it("should infer BOOLEAN from ['1', '0']", () => {
      expect(inferDataType(["1", "0"])).toBe(FieldDataTypeEnum.BOOLEAN);
    });

    it("should be case-insensitive", () => {
      expect(inferDataType(["TRUE", "False", "YES"])).toBe(
        FieldDataTypeEnum.BOOLEAN,
      );
    });

    it("should NOT infer BOOLEAN when mixed with other values", () => {
      expect(inferDataType(["true", "maybe"])).toBe(FieldDataTypeEnum.STRING);
    });

    it("should infer BOOLEAN from mixed boolean patterns", () => {
      expect(inferDataType(["true", "no", "1", "false"])).toBe(
        FieldDataTypeEnum.BOOLEAN,
      );
    });
  });

  describe("INTEGER inference", () => {
    it("should infer INTEGER from positive whole numbers", () => {
      expect(inferDataType(["1", "42", "100"])).toBe(FieldDataTypeEnum.INTEGER);
    });

    it("should infer INTEGER from negative numbers", () => {
      expect(inferDataType(["-5", "-100"])).toBe(FieldDataTypeEnum.INTEGER);
    });

    it("should infer INTEGER with zero", () => {
      expect(inferDataType(["0", "1", "-1"])).toBe(FieldDataTypeEnum.INTEGER);
    });

    it("should NOT infer INTEGER when decimals present", () => {
      expect(inferDataType(["1", "2.5"])).toBe(FieldDataTypeEnum.DECIMAL);
    });

    it("should infer INTEGER from large numbers", () => {
      expect(inferDataType(["1000000", "999999999"])).toBe(
        FieldDataTypeEnum.INTEGER,
      );
    });
  });

  describe("DECIMAL inference", () => {
    it("should infer DECIMAL from decimal numbers", () => {
      expect(inferDataType(["1.5", "2.0", "-3.14"])).toBe(
        FieldDataTypeEnum.DECIMAL,
      );
    });

    it("should infer DECIMAL from mixed int/decimal", () => {
      expect(inferDataType(["1", "2.5", "3"])).toBe(FieldDataTypeEnum.DECIMAL);
    });

    it("should handle negative decimals", () => {
      expect(inferDataType(["-1.5", "-2.75"])).toBe(FieldDataTypeEnum.DECIMAL);
    });

    it("should infer DECIMAL from numbers with trailing zeros", () => {
      expect(inferDataType(["1.00", "2.50"])).toBe(FieldDataTypeEnum.DECIMAL);
    });
  });

  describe("DATE inference", () => {
    it("should infer DATE from ISO format", () => {
      expect(inferDataType(["2024-01-15"])).toBe(FieldDataTypeEnum.DATE);
    });

    it("should infer DATE from US format", () => {
      expect(inferDataType(["01/15/2024"])).toBe(FieldDataTypeEnum.DATE);
    });

    it("should infer DATE from EU format", () => {
      expect(inferDataType(["15-01-2024"])).toBe(FieldDataTypeEnum.DATE);
    });

    it("should infer DATE from JP format", () => {
      expect(inferDataType(["2024/01/15"])).toBe(FieldDataTypeEnum.DATE);
    });

    it("should infer DATE from short year format", () => {
      expect(inferDataType(["1/15/24", "01/15/24"])).toBe(
        FieldDataTypeEnum.DATE,
      );
    });

    it("should infer DATE from ISO datetime", () => {
      expect(inferDataType(["2024-01-15T10:30:00"])).toBe(
        FieldDataTypeEnum.DATE,
      );
    });

    it("should infer DATE from DD-MMM-YYYY", () => {
      expect(inferDataType(["15-Jan-2024"])).toBe(FieldDataTypeEnum.DATE);
    });

    it("should infer DATE from dotted format", () => {
      expect(inferDataType(["2024.01.15"])).toBe(FieldDataTypeEnum.DATE);
    });

    it("should NOT infer DATE from mixed formats with non-dates", () => {
      expect(inferDataType(["2024-01-15", "not-a-date"])).toBe(
        FieldDataTypeEnum.STRING,
      );
    });

    it("should infer DATE from consistent date values", () => {
      expect(inferDataType(["2024-01-15", "2024-02-20", "2024-03-25"])).toBe(
        FieldDataTypeEnum.DATE,
      );
    });
  });

  describe("STRING inference (default)", () => {
    it("should infer STRING for text values", () => {
      expect(inferDataType(["hello", "world"])).toBe(FieldDataTypeEnum.STRING);
    });

    it("should infer STRING for mixed types", () => {
      expect(inferDataType(["hello", "123"])).toBe(FieldDataTypeEnum.STRING);
    });

    it("should return STRING for empty array", () => {
      expect(inferDataType([])).toBe(FieldDataTypeEnum.STRING);
    });

    it("should return STRING when all values are null/undefined/empty", () => {
      expect(inferDataType([null, undefined, ""])).toBe(
        FieldDataTypeEnum.STRING,
      );
    });
  });

  describe("value filtering", () => {
    it("should filter out null values before inference", () => {
      expect(inferDataType([null, "42", "100"])).toBe(
        FieldDataTypeEnum.INTEGER,
      );
    });

    it("should filter out undefined values before inference", () => {
      expect(inferDataType([undefined, "true", "false"])).toBe(
        FieldDataTypeEnum.BOOLEAN,
      );
    });

    it("should filter out empty string values before inference", () => {
      expect(inferDataType(["", "1.5", "2.0"])).toBe(FieldDataTypeEnum.DECIMAL);
    });

    it("should filter out whitespace-only values before inference", () => {
      expect(inferDataType(["   ", "2024-01-15"])).toBe(FieldDataTypeEnum.DATE);
    });
  });

  describe("edge cases", () => {
    it("should NOT infer INTEGER from ['1', '2', '0'] - might be boolean", () => {
      // Note: ['1', '0'] is boolean, but ['1', '2', '0'] has '2' which breaks boolean pattern
      expect(inferDataType(["1", "2", "0"])).toBe(FieldDataTypeEnum.INTEGER);
    });

    it("should handle single value arrays", () => {
      expect(inferDataType(["42"])).toBe(FieldDataTypeEnum.INTEGER);
      expect(inferDataType(["true"])).toBe(FieldDataTypeEnum.BOOLEAN);
      expect(inferDataType(["hello"])).toBe(FieldDataTypeEnum.STRING);
    });

    it("should handle values with leading/trailing whitespace", () => {
      expect(inferDataType(["  42  ", "  100  "])).toBe(
        FieldDataTypeEnum.INTEGER,
      );
    });
  });
});

// ============================================================================
// CustomFieldInferrer - Class Tests
// ============================================================================

describe("CustomFieldInferrer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFieldDefRepo.clear();
    mockCategoryFieldRepo.clear();
  });

  describe("analyzeCustomFields", () => {
    const createRows = (
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

    it("should collect values from all rows for each field", () => {
      const inferrer = new CustomFieldInferrer();
      const rows = createRows([
        { cpu_cores: "4" },
        { cpu_cores: "8" },
        { cpu_cores: "16" },
      ]);

      const result = inferrer.analyzeCustomFields(rows, "LAPTOP", "cat-1");

      expect(result.has("cpu_cores")).toBe(true);
      expect(result.get("cpu_cores")?.sampleValues).toContain("4");
      expect(result.get("cpu_cores")?.sampleValues).toContain("8");
      expect(result.get("cpu_cores")?.sampleValues).toContain("16");
    });

    it("should generate labels from field names using generateFieldLabel", () => {
      const inferrer = new CustomFieldInferrer();
      const rows = createRows([{ cpu_cores: "8" }]);

      const result = inferrer.analyzeCustomFields(rows, "LAPTOP", "cat-1");

      expect(result.get("cpu_cores")?.label).toBe("Cpu Cores");
    });

    it("should keep first 5 sample values", () => {
      const inferrer = new CustomFieldInferrer();
      const rows = createRows([
        { cpu: "1" },
        { cpu: "2" },
        { cpu: "3" },
        { cpu: "4" },
        { cpu: "5" },
        { cpu: "6" },
        { cpu: "7" },
      ]);

      const result = inferrer.analyzeCustomFields(rows, "LAPTOP", "cat-1");

      expect(result.get("cpu")?.sampleValues.length).toBe(5);
    });

    it("should return empty map when no custom fields present", () => {
      const inferrer = new CustomFieldInferrer();
      const rows = createRows([{}]);

      const result = inferrer.analyzeCustomFields(rows, "LAPTOP", "cat-1");

      expect(result.size).toBe(0);
    });

    it("should handle rows with different custom field sets", () => {
      const inferrer = new CustomFieldInferrer();
      const rows = createRows([
        { cpu_cores: "8" },
        { ram_gb: "16" },
        { cpu_cores: "4", ram_gb: "8", storage: "512" },
      ]);

      const result = inferrer.analyzeCustomFields(rows, "LAPTOP", "cat-1");

      expect(result.has("cpu_cores")).toBe(true);
      expect(result.has("ram_gb")).toBe(true);
      expect(result.has("storage")).toBe(true);
    });

    it("should infer correct data types", () => {
      const inferrer = new CustomFieldInferrer();
      const rows = createRows([
        { count: "10", price: "99.99", active: "true", notes: "text" },
        { count: "20", price: "149.50", active: "false", notes: "more text" },
      ]);

      const result = inferrer.analyzeCustomFields(rows, "LAPTOP", "cat-1");

      expect(result.get("count")?.dataType).toBe(FieldDataTypeEnum.INTEGER);
      expect(result.get("price")?.dataType).toBe(FieldDataTypeEnum.DECIMAL);
      expect(result.get("active")?.dataType).toBe(FieldDataTypeEnum.BOOLEAN);
      expect(result.get("notes")?.dataType).toBe(FieldDataTypeEnum.STRING);
    });
  });

  describe("preloadCache", () => {
    it("should load all existing field definitions into cache", async () => {
      mockFieldDefRepo.seed([
        {
          id: "field-1",
          name: "existing_field",
          label: "Existing Field",
          dataType: "STRING",
          entityType: "Asset",
          isGlobal: false,
          isRequired: false,
          isUnique: false,
          isSearchable: true,
          isFilterable: true,
        },
      ]);

      const inferrer = new CustomFieldInferrer();
      await inferrer.preloadCache();

      expect(mockFieldDefRepo.findAll).toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalledWith(
        "Field definition cache preloaded",
        expect.any(Object),
      );
    });
  });

  describe("resolveOrCreateFieldDefinitions", () => {
    it("should use cached field definition ID when available", async () => {
      mockFieldDefRepo.seed([
        {
          id: "field-existing",
          name: "existing_field",
          label: "Existing Field",
          dataType: "STRING",
          entityType: "Asset",
          isGlobal: false,
          isRequired: false,
          isUnique: false,
          isSearchable: true,
          isFilterable: true,
        },
      ]);

      const inferrer = new CustomFieldInferrer();
      await inferrer.preloadCache();

      const inferredFields = new Map<string, InferredFieldDefinition>();
      inferredFields.set("existing_field", {
        name: "existing_field",
        label: "Existing Field",
        dataType: FieldDataTypeEnum.STRING,
        sampleValues: [],
      });

      const result = await inferrer.resolveOrCreateFieldDefinitions(
        inferredFields,
        "LAPTOP",
        "cat-1",
      );

      expect(result.get("existing_field")).toBe("field-existing");
      // Should not create new one
      expect(mockFieldDefRepo.create).not.toHaveBeenCalled();
    });

    it("should create new FieldDefinition when not found", async () => {
      const inferrer = new CustomFieldInferrer();
      await inferrer.preloadCache();

      const inferredFields = new Map<string, InferredFieldDefinition>();
      inferredFields.set("new_field", {
        name: "new_field",
        label: "New Field",
        dataType: FieldDataTypeEnum.INTEGER,
        sampleValues: ["1", "2", "3"],
      });

      const result = await inferrer.resolveOrCreateFieldDefinitions(
        inferredFields,
        "LAPTOP",
        "cat-1",
      );

      expect(mockFieldDefRepo.create).toHaveBeenCalled();
      expect(result.has("new_field")).toBe(true);
    });

    it("should link field definition to category via AssetCategoryField", async () => {
      const inferrer = new CustomFieldInferrer();
      await inferrer.preloadCache();

      const inferredFields = new Map<string, InferredFieldDefinition>();
      inferredFields.set("linked_field", {
        name: "linked_field",
        label: "Linked Field",
        dataType: FieldDataTypeEnum.STRING,
        sampleValues: [],
      });

      await inferrer.resolveOrCreateFieldDefinitions(
        inferredFields,
        "LAPTOP",
        "cat-1",
      );

      expect(mockCategoryFieldRepo.create).toHaveBeenCalled();
    });

    it("should set correct defaults for new field definitions", async () => {
      const inferrer = new CustomFieldInferrer();

      const inferredFields = new Map<string, InferredFieldDefinition>();
      inferredFields.set("test_field", {
        name: "test_field",
        label: "Test Field",
        dataType: FieldDataTypeEnum.INTEGER,
        sampleValues: [],
      });

      await inferrer.resolveOrCreateFieldDefinitions(
        inferredFields,
        "LAPTOP",
        "cat-1",
      );

      expect(mockFieldDefRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "test_field",
          label: "Test Field",
          dataType: FieldDataTypeEnum.INTEGER,
          entityType: "Asset",
          isGlobal: false,
          isRequired: false,
          isSearchable: true,
          isFilterable: true,
        }),
      );
    });
  });

  describe("transformCustomFieldValues", () => {
    it("should transform INTEGER: '42' -> 42", () => {
      const inferrer = new CustomFieldInferrer();
      const inferredFields = new Map<string, InferredFieldDefinition>();
      inferredFields.set("count", {
        name: "count",
        label: "Count",
        dataType: FieldDataTypeEnum.INTEGER,
        sampleValues: [],
      });

      const result = inferrer.transformCustomFieldValues(
        { count: "42" },
        inferredFields,
      );

      expect(result.count).toBe(42);
      expect(typeof result.count).toBe("number");
    });

    it("should transform DECIMAL: '3.14' -> 3.14", () => {
      const inferrer = new CustomFieldInferrer();
      const inferredFields = new Map<string, InferredFieldDefinition>();
      inferredFields.set("price", {
        name: "price",
        label: "Price",
        dataType: FieldDataTypeEnum.DECIMAL,
        sampleValues: [],
      });

      const result = inferrer.transformCustomFieldValues(
        { price: "3.14" },
        inferredFields,
      );

      expect(result.price).toBe(3.14);
    });

    it("should transform BOOLEAN: 'yes' -> true", () => {
      const inferrer = new CustomFieldInferrer();
      const inferredFields = new Map<string, InferredFieldDefinition>();
      inferredFields.set("active", {
        name: "active",
        label: "Active",
        dataType: FieldDataTypeEnum.BOOLEAN,
        sampleValues: [],
      });

      const result = inferrer.transformCustomFieldValues(
        { active: "yes" },
        inferredFields,
      );

      expect(result.active).toBe(true);
    });

    it("should transform BOOLEAN: '1' -> true", () => {
      const inferrer = new CustomFieldInferrer();
      const inferredFields = new Map<string, InferredFieldDefinition>();
      inferredFields.set("enabled", {
        name: "enabled",
        label: "Enabled",
        dataType: FieldDataTypeEnum.BOOLEAN,
        sampleValues: [],
      });

      const result = inferrer.transformCustomFieldValues(
        { enabled: "1" },
        inferredFields,
      );

      expect(result.enabled).toBe(true);
    });

    it("should transform BOOLEAN: 'false' -> false", () => {
      const inferrer = new CustomFieldInferrer();
      const inferredFields = new Map<string, InferredFieldDefinition>();
      inferredFields.set("active", {
        name: "active",
        label: "Active",
        dataType: FieldDataTypeEnum.BOOLEAN,
        sampleValues: [],
      });

      const result = inferrer.transformCustomFieldValues(
        { active: "false" },
        inferredFields,
      );

      expect(result.active).toBe(false);
    });

    it("should transform BOOLEAN: 'no' -> false", () => {
      const inferrer = new CustomFieldInferrer();
      const inferredFields = new Map<string, InferredFieldDefinition>();
      inferredFields.set("active", {
        name: "active",
        label: "Active",
        dataType: FieldDataTypeEnum.BOOLEAN,
        sampleValues: [],
      });

      const result = inferrer.transformCustomFieldValues(
        { active: "no" },
        inferredFields,
      );

      expect(result.active).toBe(false);
    });

    it("should transform BOOLEAN: '0' -> false", () => {
      const inferrer = new CustomFieldInferrer();
      const inferredFields = new Map<string, InferredFieldDefinition>();
      inferredFields.set("active", {
        name: "active",
        label: "Active",
        dataType: FieldDataTypeEnum.BOOLEAN,
        sampleValues: [],
      });

      const result = inferrer.transformCustomFieldValues(
        { active: "0" },
        inferredFields,
      );

      expect(result.active).toBe(false);
    });

    it("should keep DATE as string", () => {
      const inferrer = new CustomFieldInferrer();
      const inferredFields = new Map<string, InferredFieldDefinition>();
      inferredFields.set("purchase_date", {
        name: "purchase_date",
        label: "Purchase Date",
        dataType: FieldDataTypeEnum.DATE,
        sampleValues: [],
      });

      const result = inferrer.transformCustomFieldValues(
        { purchase_date: "2024-01-15" },
        inferredFields,
      );

      expect(result.purchase_date).toBe("2024-01-15");
      expect(typeof result.purchase_date).toBe("string");
    });

    it("should keep STRING unchanged", () => {
      const inferrer = new CustomFieldInferrer();
      const inferredFields = new Map<string, InferredFieldDefinition>();
      inferredFields.set("notes", {
        name: "notes",
        label: "Notes",
        dataType: FieldDataTypeEnum.STRING,
        sampleValues: [],
      });

      const result = inferrer.transformCustomFieldValues(
        { notes: "some text" },
        inferredFields,
      );

      expect(result.notes).toBe("some text");
    });

    it("should skip null values", () => {
      const inferrer = new CustomFieldInferrer();
      const inferredFields = new Map<string, InferredFieldDefinition>();
      inferredFields.set("count", {
        name: "count",
        label: "Count",
        dataType: FieldDataTypeEnum.INTEGER,
        sampleValues: [],
      });

      const result = inferrer.transformCustomFieldValues(
        { count: null },
        inferredFields,
      );

      expect(result.count).toBeUndefined();
    });

    it("should skip undefined values", () => {
      const inferrer = new CustomFieldInferrer();
      const inferredFields = new Map<string, InferredFieldDefinition>();
      inferredFields.set("count", {
        name: "count",
        label: "Count",
        dataType: FieldDataTypeEnum.INTEGER,
        sampleValues: [],
      });

      const result = inferrer.transformCustomFieldValues(
        { count: undefined },
        inferredFields,
      );

      expect(result.count).toBeUndefined();
    });

    it("should skip empty string values", () => {
      const inferrer = new CustomFieldInferrer();
      const inferredFields = new Map<string, InferredFieldDefinition>();
      inferredFields.set("count", {
        name: "count",
        label: "Count",
        dataType: FieldDataTypeEnum.INTEGER,
        sampleValues: [],
      });

      const result = inferrer.transformCustomFieldValues(
        { count: "" },
        inferredFields,
      );

      expect(result.count).toBeUndefined();
    });

    it("should return field as-is if not in inferredFields map", () => {
      const inferrer = new CustomFieldInferrer();
      const inferredFields = new Map<string, InferredFieldDefinition>();

      const result = inferrer.transformCustomFieldValues(
        { unknown_field: "value" },
        inferredFields,
      );

      expect(result.unknown_field).toBe("value");
    });
  });

  describe("getCreatedFieldDefinitions", () => {
    it("should return array of newly created fields", async () => {
      const inferrer = new CustomFieldInferrer();

      const inferredFields = new Map<string, InferredFieldDefinition>();
      inferredFields.set("new_field_1", {
        name: "new_field_1",
        label: "New Field 1",
        dataType: FieldDataTypeEnum.INTEGER,
        sampleValues: ["1", "2"],
      });
      inferredFields.set("new_field_2", {
        name: "new_field_2",
        label: "New Field 2",
        dataType: FieldDataTypeEnum.STRING,
        sampleValues: ["a", "b"],
      });

      await inferrer.resolveOrCreateFieldDefinitions(
        inferredFields,
        "LAPTOP",
        "cat-1",
      );

      const created = inferrer.getCreatedFieldDefinitions();
      expect(created.length).toBe(2);
      expect(created.some((f) => f.name === "new_field_1")).toBe(true);
      expect(created.some((f) => f.name === "new_field_2")).toBe(true);
    });
  });
});
