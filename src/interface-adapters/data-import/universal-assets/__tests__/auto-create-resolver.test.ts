/**
 * Unit tests for auto-create-resolver.ts
 *
 * Tests the AutoCreateResolver class which handles find-or-create logic
 * for entities during universal asset import.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { AutoCreateResolver } from "../auto-create-resolver";
import {
  createMockVendorRepository,
  createMockAssetCategoryRepository,
  createMockAssetModelRepository,
  createMockLocationRepository,
  createMockStockLocationRepository,
  createMockLifecycleStateRepository,
  createMockPersonRepository,
} from "./mocks/repositories.mock";
import { createMockLogger } from "./mocks/logger.mock";
import {
  VENDOR_FIXTURES,
  CATEGORY_FIXTURES,
  MODEL_FIXTURES,
  LOCATION_FIXTURES,
  STOCK_LOCATION_FIXTURES,
  LIFECYCLE_STATE_FIXTURES,
  PERSON_FIXTURES,
} from "./fixtures/entities.fixtures";

// Mock DI container
vi.mock("@/di/container", () => ({
  getContainer: vi.fn(),
}));

import { getContainer } from "@/di/container";
import { DI_TOKENS } from "@/di/types";

describe("AutoCreateResolver", () => {
  let mockVendorRepo: ReturnType<typeof createMockVendorRepository>;
  let mockCategoryRepo: ReturnType<typeof createMockAssetCategoryRepository>;
  let mockModelRepo: ReturnType<typeof createMockAssetModelRepository>;
  let mockLocationRepo: ReturnType<typeof createMockLocationRepository>;
  let mockStockLocationRepo: ReturnType<
    typeof createMockStockLocationRepository
  >;
  let mockLifecycleStateRepo: ReturnType<
    typeof createMockLifecycleStateRepository
  >;
  let mockPersonRepo: ReturnType<typeof createMockPersonRepository>;
  let mockLogger: ReturnType<typeof createMockLogger>;
  let mockCodeGenerator: { generateCode: ReturnType<typeof vi.fn> };
  let codeGeneratorCounters: Record<string, number>;

  beforeEach(() => {
    vi.clearAllMocks();

    // Create fresh mocks
    mockVendorRepo = createMockVendorRepository();
    mockCategoryRepo = createMockAssetCategoryRepository();
    mockModelRepo = createMockAssetModelRepository();
    mockLocationRepo = createMockLocationRepository();
    mockStockLocationRepo = createMockStockLocationRepository();
    mockLifecycleStateRepo = createMockLifecycleStateRepository();
    mockPersonRepo = createMockPersonRepository();
    mockLogger = createMockLogger();
    codeGeneratorCounters = {};
    mockCodeGenerator = {
      generateCode: vi
        .fn()
        .mockImplementation((entityType: string, prefix: string) => {
          codeGeneratorCounters[entityType] =
            (codeGeneratorCounters[entityType] || 0) + 1;
          return Promise.resolve(
            `${prefix}-${String(codeGeneratorCounters[entityType]).padStart(6, "0")}`,
          );
        }),
    };

    // Seed fixtures
    mockVendorRepo.seed(VENDOR_FIXTURES);
    mockCategoryRepo.seed(CATEGORY_FIXTURES);
    mockModelRepo.seed(MODEL_FIXTURES);
    mockLocationRepo.seed(LOCATION_FIXTURES);
    mockStockLocationRepo.seed(STOCK_LOCATION_FIXTURES);
    mockLifecycleStateRepo.seed(LIFECYCLE_STATE_FIXTURES);
    mockPersonRepo.seed(PERSON_FIXTURES);

    // Setup container mock
    (getContainer as ReturnType<typeof vi.fn>).mockReturnValue({
      get: vi.fn((token: symbol) => {
        switch (token) {
          case DI_TOKENS.ILoggerService:
            return mockLogger;
          case DI_TOKENS.IVendorRepository:
            return mockVendorRepo;
          case DI_TOKENS.IAssetCategoryRepository:
            return mockCategoryRepo;
          case DI_TOKENS.IAssetModelRepository:
            return mockModelRepo;
          case DI_TOKENS.ILocationRepository:
            return mockLocationRepo;
          case DI_TOKENS.IStockLocationRepository:
            return mockStockLocationRepo;
          case DI_TOKENS.ILifecycleStateRepository:
            return mockLifecycleStateRepo;
          case DI_TOKENS.IPersonRepository:
            return mockPersonRepo;
          case DI_TOKENS.ICodeGeneratorService:
            return mockCodeGenerator;
          default:
            throw new Error(`Unknown token: ${String(token)}`);
        }
      }),
    });
  });

  // ============================================
  // INITIALIZATION
  // ============================================
  describe("initialization", () => {
    it("should initialize with empty caches", () => {
      const resolver = new AutoCreateResolver();
      expect(resolver.getAutoCreatedEntities()).toEqual([]);
      expect(resolver.getFieldDefinitionCache().size).toBe(0);
    });

    it("should initialize with zero auto-create summary", () => {
      const resolver = new AutoCreateResolver();
      const summary = resolver.getAutoCreateSummary();
      expect(summary).toEqual({
        vendors: 0,
        categories: 0,
        models: 0,
        locations: 0,
        stockLocations: 0,
        fieldDefinitions: 0,
      });
    });
  });

  // ============================================
  // PERSON RESOLUTION (Lookup Only)
  // ============================================
  describe("resolvePerson", () => {
    it("should find person by email", async () => {
      const resolver = new AutoCreateResolver();
      const result = await resolver.resolvePerson("john.doe@barq.com");
      expect(result.id).toBe("person-1");
      expect(result.error).toBeUndefined();
    });

    it("should be case-insensitive", async () => {
      const resolver = new AutoCreateResolver();
      const result = await resolver.resolvePerson("JOHN.DOE@BARQ.COM");
      expect(result.id).toBe("person-1");
    });

    it("should trim whitespace", async () => {
      const resolver = new AutoCreateResolver();
      const result = await resolver.resolvePerson("  john.doe@barq.com  ");
      expect(result.id).toBe("person-1");
    });

    it("should return error when person not found", async () => {
      const resolver = new AutoCreateResolver();
      const result = await resolver.resolvePerson("nonexistent@barq.com");
      expect(result.id).toBeNull();
      expect(result.error).toContain("not found");
    });

    it("should use cache on subsequent lookups", async () => {
      const resolver = new AutoCreateResolver();

      // First lookup
      await resolver.resolvePerson("john.doe@barq.com");
      expect(mockPersonRepo.findByEmail).toHaveBeenCalledTimes(1);

      // Second lookup should use cache
      await resolver.resolvePerson("john.doe@barq.com");
      expect(mockPersonRepo.findByEmail).toHaveBeenCalledTimes(1);
    });

    it("should NOT auto-create persons", async () => {
      const resolver = new AutoCreateResolver();
      const result = await resolver.resolvePerson("new@barq.com");
      expect(result.id).toBeNull();
      expect(result.error).toContain("Persons must exist before import");
    });
  });

  describe("preloadPersons", () => {
    it("should batch preload persons into cache", async () => {
      const resolver = new AutoCreateResolver();
      await resolver.preloadPersons([
        "john.doe@barq.com",
        "jane.smith@barq.com",
      ]);

      // Subsequent lookups should use cache
      const result1 = await resolver.resolvePerson("john.doe@barq.com");
      const result2 = await resolver.resolvePerson("jane.smith@barq.com");

      expect(result1.id).toBe("person-1");
      expect(result2.id).toBe("person-2");
      // Each email was looked up once during preload
      expect(mockPersonRepo.findByEmail).toHaveBeenCalledTimes(2);
    });

    it("should handle empty email array", async () => {
      const resolver = new AutoCreateResolver();
      await resolver.preloadPersons([]);
      expect(mockPersonRepo.findByEmail).not.toHaveBeenCalled();
    });

    it("should skip already cached emails", async () => {
      const resolver = new AutoCreateResolver();

      // First preload
      await resolver.preloadPersons(["john.doe@barq.com"]);
      expect(mockPersonRepo.findByEmail).toHaveBeenCalledTimes(1);

      // Second preload with same email
      await resolver.preloadPersons(["john.doe@barq.com"]);
      expect(mockPersonRepo.findByEmail).toHaveBeenCalledTimes(1);
    });

    it("should handle missing persons gracefully", async () => {
      const resolver = new AutoCreateResolver();
      await resolver.preloadPersons(["nonexistent@barq.com"]);
      // Should not throw
      expect(mockPersonRepo.findByEmail).toHaveBeenCalledTimes(1);
    });
  });

  // ============================================
  // VENDOR RESOLUTION
  // ============================================
  describe("resolveOrCreateVendor", () => {
    it("should return { id: null } when no code or name provided", async () => {
      const resolver = new AutoCreateResolver();
      const result = await resolver.resolveOrCreateVendor({});
      expect(result.id).toBeNull();
      expect(result.error).toBeUndefined();
    });

    it("should find vendor by code", async () => {
      const resolver = new AutoCreateResolver();
      const result = await resolver.resolveOrCreateVendor({ code: "DELL" });
      expect(result.id).toBe("vendor-dell");
    });

    it("should find vendor by name when code not found", async () => {
      const resolver = new AutoCreateResolver();
      const result = await resolver.resolveOrCreateVendor({
        name: "Dell Technologies",
      });
      expect(result.id).toBe("vendor-dell");
    });

    it("should prefer code lookup over name", async () => {
      const resolver = new AutoCreateResolver();
      const result = await resolver.resolveOrCreateVendor({
        code: "DELL",
        name: "Different Name",
      });
      expect(result.id).toBe("vendor-dell");
      expect(mockVendorRepo.findByCode).toHaveBeenCalledWith("DELL");
    });

    it("should create vendor when not found", async () => {
      const resolver = new AutoCreateResolver();
      const result = await resolver.resolveOrCreateVendor({
        code: "LENOVO",
        name: "Lenovo Inc.",
      });

      expect(result.id).toBeTruthy();
      expect(mockVendorRepo.create).toHaveBeenCalled();
    });

    it("should generate sequential code using CodeGeneratorService if code not provided", async () => {
      const resolver = new AutoCreateResolver();
      await resolver.resolveOrCreateVendor({ name: "New Vendor Company" });

      expect(mockVendorRepo.create).toHaveBeenCalled();
      expect(mockCodeGenerator.generateCode).toHaveBeenCalledWith(
        "VENDOR",
        "VENDOR",
      );
      const createCall = mockVendorRepo.create.mock.calls[0][0];
      expect(createCall.code).toBe("VENDOR-000001"); // Sequential code from CodeGeneratorService
    });

    it("should record auto-created vendor", async () => {
      const resolver = new AutoCreateResolver();
      await resolver.resolveOrCreateVendor({
        code: "NEW-VENDOR",
        name: "New Vendor",
      });

      const autoCreated = resolver.getAutoCreatedEntities();
      expect(autoCreated).toHaveLength(1);
      expect(autoCreated[0]).toMatchObject({
        entityType: "Vendor",
        identifier: "NEW-VENDOR",
        action: "created",
      });
    });

    it("should use cache on subsequent lookups", async () => {
      const resolver = new AutoCreateResolver();

      await resolver.resolveOrCreateVendor({ code: "DELL" });
      await resolver.resolveOrCreateVendor({ code: "DELL" });

      expect(mockVendorRepo.findByCode).toHaveBeenCalledTimes(1);
    });

    it("should use case-insensitive cache keys", async () => {
      const resolver = new AutoCreateResolver();

      await resolver.resolveOrCreateVendor({ code: "DELL" });
      await resolver.resolveOrCreateVendor({ code: "dell" });

      expect(mockVendorRepo.findByCode).toHaveBeenCalledTimes(1);
    });

    it("should handle creation error", async () => {
      mockVendorRepo.create.mockRejectedValueOnce(new Error("DB error"));

      const resolver = new AutoCreateResolver();
      const result = await resolver.resolveOrCreateVendor({
        code: "FAIL",
        name: "Failing Vendor",
      });

      expect(result.id).toBeNull();
      expect(result.error).toContain("Failed to create vendor");

      const autoCreated = resolver.getAutoCreatedEntities();
      expect(autoCreated[0].action).toBe("failed");
    });
  });

  // ============================================
  // CATEGORY RESOLUTION
  // ============================================
  describe("resolveOrCreateCategory", () => {
    it("should return error when no code or name provided", async () => {
      const resolver = new AutoCreateResolver();
      const result = await resolver.resolveOrCreateCategory({});
      expect(result.id).toBeNull();
      expect(result.error).toContain("required");
    });

    it("should find category by code", async () => {
      const resolver = new AutoCreateResolver();
      const result = await resolver.resolveOrCreateCategory({ code: "LAPTOP" });
      expect(result.id).toBe("cat-laptop");
    });

    it("should find category by name when code not found", async () => {
      const resolver = new AutoCreateResolver();
      const result = await resolver.resolveOrCreateCategory({
        name: "Laptop Computers",
      });
      expect(result.id).toBe("cat-laptop");
    });

    it("should create category when not found", async () => {
      const resolver = new AutoCreateResolver();
      const result = await resolver.resolveOrCreateCategory({
        code: "MONITOR",
        name: "Monitors",
      });

      expect(result.id).toBeTruthy();
      expect(mockCategoryRepo.create).toHaveBeenCalled();
    });

    it("should record auto-created category", async () => {
      const resolver = new AutoCreateResolver();
      await resolver.resolveOrCreateCategory({
        code: "NEW-CAT",
        name: "New Category",
      });

      const autoCreated = resolver.getAutoCreatedEntities();
      expect(autoCreated).toHaveLength(1);
      expect(autoCreated[0]).toMatchObject({
        entityType: "AssetCategory",
        identifier: "NEW-CAT",
        action: "created",
      });
    });
  });

  // ============================================
  // MODEL RESOLUTION
  // ============================================
  describe("resolveOrCreateModel", () => {
    it("should return { id: null } when no code or name provided", async () => {
      const resolver = new AutoCreateResolver();
      const result = await resolver.resolveOrCreateModel(
        {},
        "vendor-1",
        "cat-1",
      );
      expect(result.id).toBeNull();
      expect(result.error).toBeUndefined();
    });

    it("should return error when vendorId missing", async () => {
      const resolver = new AutoCreateResolver();
      const result = await resolver.resolveOrCreateModel(
        { code: "MODEL-1" },
        undefined,
        "cat-laptop",
      );
      expect(result.id).toBeNull();
      expect(result.error).toContain("vendor and category");
    });

    it("should return error when categoryId missing", async () => {
      const resolver = new AutoCreateResolver();
      const result = await resolver.resolveOrCreateModel(
        { code: "MODEL-1" },
        "vendor-dell",
        undefined,
      );
      expect(result.id).toBeNull();
      expect(result.error).toContain("vendor and category");
    });

    it("should find model by code", async () => {
      const resolver = new AutoCreateResolver();
      const result = await resolver.resolveOrCreateModel(
        { code: "DELL-LAT-5520" },
        "vendor-dell",
        "cat-laptop",
      );
      expect(result.id).toBe("model-lat5520");
    });

    it("should create model when not found", async () => {
      const resolver = new AutoCreateResolver();
      const result = await resolver.resolveOrCreateModel(
        { code: "NEW-MODEL", name: "New Model" },
        "vendor-dell",
        "cat-laptop",
      );

      expect(result.id).toBeTruthy();
      expect(mockModelRepo.create).toHaveBeenCalled();
      const createCall = mockModelRepo.create.mock.calls[0][0];
      expect(createCall.vendorId).toBe("vendor-dell");
      expect(createCall.assetCategoryId).toBe("cat-laptop");
    });

    it("should include defaultWarrantyMonths if provided", async () => {
      const resolver = new AutoCreateResolver();
      await resolver.resolveOrCreateModel(
        {
          code: "MODEL-WARRANTY",
          name: "Model with Warranty",
          defaultWarrantyMonths: "24",
        },
        "vendor-dell",
        "cat-laptop",
      );

      const createCall = mockModelRepo.create.mock.calls[0][0];
      expect(createCall.defaultWarrantyMonths).toBe(24);
    });

    it("should NOT look up model by name - BUG DOCUMENTATION", async () => {
      // This test documents that model lookup only works by code, NOT by name
      // This is a potential bug area where duplicates could be created
      const resolver = new AutoCreateResolver();
      const result = await resolver.resolveOrCreateModel(
        { name: "Dell Latitude 5520" }, // Name matches existing, but no code
        "vendor-dell",
        "cat-laptop",
      );

      // Current behavior: Creates new model (potential duplicate)
      // Expected behavior: Should find by name
      expect(mockModelRepo.create).toHaveBeenCalled();
      expect(result.id).toBeTruthy();

      // This test documents the current behavior - if you want to fix the bug,
      // update the implementation and change these assertions
    });

    it("should record auto-created model", async () => {
      const resolver = new AutoCreateResolver();
      await resolver.resolveOrCreateModel(
        { code: "NEW-MODEL" },
        "vendor-dell",
        "cat-laptop",
      );

      const autoCreated = resolver.getAutoCreatedEntities();
      expect(autoCreated).toHaveLength(1);
      expect(autoCreated[0]).toMatchObject({
        entityType: "AssetModel",
        action: "created",
      });
    });
  });

  // ============================================
  // LOCATION RESOLUTION
  // ============================================
  describe("resolveOrCreateLocation", () => {
    it("should return { id: null } when no code or name provided", async () => {
      const resolver = new AutoCreateResolver();
      const result = await resolver.resolveOrCreateLocation({});
      expect(result.id).toBeNull();
      expect(result.error).toBeUndefined();
    });

    it("should find location by code", async () => {
      const resolver = new AutoCreateResolver();
      const result = await resolver.resolveOrCreateLocation({ code: "RUH-HQ" });
      expect(result.id).toBe("loc-ruh");
    });

    it("should create location when not found", async () => {
      const resolver = new AutoCreateResolver();
      const result = await resolver.resolveOrCreateLocation({
        code: "JED-OFFICE",
        name: "Jeddah Office",
      });

      expect(result.id).toBeTruthy();
      expect(mockLocationRepo.create).toHaveBeenCalled();
    });

    it("should create location with BUILDING type by default", async () => {
      const resolver = new AutoCreateResolver();
      await resolver.resolveOrCreateLocation({
        code: "NEW-LOC",
        name: "New Location",
      });

      const createCall = mockLocationRepo.create.mock.calls[0][0];
      expect(createCall.locationType).toBe("BUILDING");
    });

    it("should record auto-created location", async () => {
      const resolver = new AutoCreateResolver();
      await resolver.resolveOrCreateLocation({
        code: "NEW-LOC",
        name: "New Location",
      });

      const autoCreated = resolver.getAutoCreatedEntities();
      expect(autoCreated).toHaveLength(1);
      expect(autoCreated[0]).toMatchObject({
        entityType: "Location",
        action: "created",
      });
    });
  });

  // ============================================
  // STOCK LOCATION RESOLUTION
  // ============================================
  describe("resolveOrCreateStockLocation", () => {
    it("should return { id: null } when no code or name provided", async () => {
      const resolver = new AutoCreateResolver();
      const result = await resolver.resolveOrCreateStockLocation({});
      expect(result.id).toBeNull();
      expect(result.error).toBeUndefined();
    });

    it("should find stock location by code", async () => {
      const resolver = new AutoCreateResolver();
      const result = await resolver.resolveOrCreateStockLocation({
        code: "WH-RIYADH",
      });
      expect(result.id).toBe("stock-ruh");
    });

    it("should create stock location when not found", async () => {
      const resolver = new AutoCreateResolver();
      const result = await resolver.resolveOrCreateStockLocation({
        code: "WH-JEDDAH",
        name: "Jeddah Warehouse",
      });

      expect(result.id).toBeTruthy();
      expect(mockStockLocationRepo.create).toHaveBeenCalled();
    });

    it("should create stock location with locationId reference", async () => {
      const resolver = new AutoCreateResolver();
      await resolver.resolveOrCreateStockLocation(
        { code: "WH-NEW", name: "New Warehouse" },
        "loc-ruh",
      );

      const createCall = mockStockLocationRepo.create.mock.calls[0][0];
      expect(createCall.locationId).toBe("loc-ruh");
    });

    it("should create stock location without locationId reference", async () => {
      const resolver = new AutoCreateResolver();
      await resolver.resolveOrCreateStockLocation({
        code: "WH-STANDALONE",
        name: "Standalone Warehouse",
      });

      const createCall = mockStockLocationRepo.create.mock.calls[0][0];
      // locationId can be undefined or null when not provided
      expect(createCall.locationId ?? undefined).toBeUndefined();
    });

    it("should record auto-created stock location", async () => {
      const resolver = new AutoCreateResolver();
      await resolver.resolveOrCreateStockLocation({
        code: "WH-NEW",
        name: "New Warehouse",
      });

      const autoCreated = resolver.getAutoCreatedEntities();
      expect(autoCreated).toHaveLength(1);
      expect(autoCreated[0]).toMatchObject({
        entityType: "StockLocation",
        action: "created",
      });
    });
  });

  // ============================================
  // LIFECYCLE STATE LOOKUP (No Auto-Create)
  // ============================================
  describe("lookupLifecycleState", () => {
    it("should return { id: null } when no code provided", async () => {
      const resolver = new AutoCreateResolver();
      const result = await resolver.lookupLifecycleState(undefined);
      expect(result.id).toBeNull();
    });

    it("should find lifecycle state by code", async () => {
      const resolver = new AutoCreateResolver();
      const result = await resolver.lookupLifecycleState("IN_USE");
      expect(result.id).toBe("lc-inuse");
    });

    it("should be case-insensitive", async () => {
      const resolver = new AutoCreateResolver();
      const result = await resolver.lookupLifecycleState("in_use");
      expect(result.id).toBe("lc-inuse");
    });

    it("should return { id: null } when state not found", async () => {
      const resolver = new AutoCreateResolver();
      const result = await resolver.lookupLifecycleState("NONEXISTENT");
      expect(result.id).toBeNull();
      // No error property - this is expected behavior
    });

    it("should NOT auto-create lifecycle states", async () => {
      const resolver = new AutoCreateResolver();
      await resolver.lookupLifecycleState("NEW_STATE");

      const autoCreated = resolver.getAutoCreatedEntities();
      expect(autoCreated).toHaveLength(0);
    });

    it("should use cache on subsequent lookups", async () => {
      const resolver = new AutoCreateResolver();

      await resolver.lookupLifecycleState("IN_USE");
      await resolver.lookupLifecycleState("IN_USE");

      expect(mockLifecycleStateRepo.findAll).toHaveBeenCalledTimes(1);
    });
  });

  // ============================================
  // FIELD DEFINITION CACHE
  // ============================================
  describe("field definition cache", () => {
    it("should start with empty cache", () => {
      const resolver = new AutoCreateResolver();
      expect(resolver.getFieldDefinitionCache().size).toBe(0);
    });

    it("should add to cache with lowercase key", () => {
      const resolver = new AutoCreateResolver();
      resolver.addToFieldDefinitionCache("CPU_Cores", "field-id-1");

      const cache = resolver.getFieldDefinitionCache();
      expect(cache.get("cpu_cores")).toBe("field-id-1");
    });

    it("should retrieve by lowercase key", () => {
      const resolver = new AutoCreateResolver();
      resolver.addToFieldDefinitionCache("Memory_GB", "field-id-2");

      const cache = resolver.getFieldDefinitionCache();
      expect(cache.get("memory_gb")).toBe("field-id-2");
    });
  });

  // ============================================
  // AUTO-CREATE SUMMARY
  // ============================================
  describe("getAutoCreateSummary", () => {
    it("should count created entities by type", async () => {
      const resolver = new AutoCreateResolver();

      // Create multiple entities
      await resolver.resolveOrCreateVendor({ code: "V1", name: "Vendor 1" });
      await resolver.resolveOrCreateVendor({ code: "V2", name: "Vendor 2" });
      await resolver.resolveOrCreateCategory({
        code: "C1",
        name: "Category 1",
      });
      await resolver.resolveOrCreateLocation({
        code: "L1",
        name: "Location 1",
      });

      const summary = resolver.getAutoCreateSummary();
      expect(summary.vendors).toBe(2);
      expect(summary.categories).toBe(1);
      expect(summary.locations).toBe(1);
      expect(summary.models).toBe(0);
      expect(summary.stockLocations).toBe(0);
      expect(summary.fieldDefinitions).toBe(0);
    });

    it("should NOT count failed creations", async () => {
      mockVendorRepo.create.mockRejectedValueOnce(new Error("DB error"));

      const resolver = new AutoCreateResolver();
      await resolver.resolveOrCreateVendor({ code: "FAIL", name: "Failing" });

      const summary = resolver.getAutoCreateSummary();
      expect(summary.vendors).toBe(0);
    });

    it("should NOT count found (not created) entities", async () => {
      const resolver = new AutoCreateResolver();

      // This finds existing vendor, doesn't create
      await resolver.resolveOrCreateVendor({ code: "DELL" });

      const summary = resolver.getAutoCreateSummary();
      expect(summary.vendors).toBe(0);
    });
  });

  // ============================================
  // CACHE KEY EDGE CASES
  // ============================================
  describe("cache key handling", () => {
    it("should handle mixed case for vendor code vs name", async () => {
      const resolver = new AutoCreateResolver();

      // First lookup by code
      const result1 = await resolver.resolveOrCreateVendor({ code: "DELL" });
      // Second lookup by lowercase code
      const result2 = await resolver.resolveOrCreateVendor({ code: "dell" });

      expect(result1.id).toBe(result2.id);
    });

    it("should handle trimmed keys for vendors", async () => {
      const resolver = new AutoCreateResolver();

      const result1 = await resolver.resolveOrCreateVendor({
        code: "  DELL  ",
      });
      const result2 = await resolver.resolveOrCreateVendor({ code: "DELL" });

      // Both should hit cache after first lookup
      expect(result1.id).toBe(result2.id);
    });

    it("should differentiate between code and name lookups that differ", async () => {
      // If code is "A" and name is "B", cache key should be consistent
      const resolver = new AutoCreateResolver();

      // First lookup uses code "DELL"
      await resolver.resolveOrCreateVendor({ code: "DELL" });

      // Second lookup uses name "Dell Technologies" - different cache key
      const result = await resolver.resolveOrCreateVendor({
        name: "Dell Technologies",
      });

      // Should still find the existing vendor by name
      expect(result.id).toBe("vendor-dell");
    });
  });

  // ============================================
  // ERROR HANDLING
  // ============================================
  describe("error handling", () => {
    it("should handle vendor creation failure", async () => {
      mockVendorRepo.create.mockRejectedValueOnce(new Error("Duplicate code"));

      const resolver = new AutoCreateResolver();
      const result = await resolver.resolveOrCreateVendor({
        code: "DUP",
        name: "Duplicate",
      });

      expect(result.id).toBeNull();
      expect(result.error).toContain("Duplicate code");
    });

    it("should handle category creation failure", async () => {
      mockCategoryRepo.create.mockRejectedValueOnce(
        new Error("Validation failed"),
      );

      const resolver = new AutoCreateResolver();
      const result = await resolver.resolveOrCreateCategory({
        code: "BAD",
        name: "Bad Category",
      });

      expect(result.id).toBeNull();
      expect(result.error).toContain("Validation failed");
    });

    it("should handle model creation failure", async () => {
      mockModelRepo.create.mockRejectedValueOnce(
        new Error("Foreign key error"),
      );

      const resolver = new AutoCreateResolver();
      const result = await resolver.resolveOrCreateModel(
        { code: "BAD-MODEL" },
        "vendor-dell",
        "cat-laptop",
      );

      expect(result.id).toBeNull();
      expect(result.error).toContain("Foreign key error");
    });

    it("should handle location creation failure", async () => {
      mockLocationRepo.create.mockRejectedValueOnce(new Error("Insert failed"));

      const resolver = new AutoCreateResolver();
      const result = await resolver.resolveOrCreateLocation({
        code: "BAD-LOC",
        name: "Bad Location",
      });

      expect(result.id).toBeNull();
      expect(result.error).toContain("Insert failed");
    });

    it("should handle stock location creation failure", async () => {
      mockStockLocationRepo.create.mockRejectedValueOnce(
        new Error("Insert failed"),
      );

      const resolver = new AutoCreateResolver();
      const result = await resolver.resolveOrCreateStockLocation({
        code: "BAD-STOCK",
        name: "Bad Stock Location",
      });

      expect(result.id).toBeNull();
      expect(result.error).toContain("Insert failed");
    });
  });

  // ============================================
  // CODE GENERATION (via CodeGeneratorService)
  // ============================================
  describe("code generation via CodeGeneratorService", () => {
    it("should use CodeGeneratorService for vendor code when not provided", async () => {
      const resolver = new AutoCreateResolver();
      await resolver.resolveOrCreateVendor({ name: "my vendor name" });

      expect(mockCodeGenerator.generateCode).toHaveBeenCalledWith(
        "VENDOR",
        "VENDOR",
      );
      const createCall = mockVendorRepo.create.mock.calls[0][0];
      expect(createCall.code).toBe("VENDOR-000001");
    });

    it("should use CodeGeneratorService for category code when not provided", async () => {
      const resolver = new AutoCreateResolver();
      await resolver.resolveOrCreateCategory({ name: "New Category" });

      expect(mockCodeGenerator.generateCode).toHaveBeenCalledWith(
        "ASSET_CATEGORY",
        "CAT",
      );
      const createCall = mockCategoryRepo.create.mock.calls[0][0];
      expect(createCall.code).toBe("CAT-000001");
    });

    it("should use CodeGeneratorService for model code when not provided", async () => {
      const resolver = new AutoCreateResolver();
      await resolver.resolveOrCreateModel(
        { name: "New Model" },
        "vendor-1", // vendorId
        "category-1", // categoryId
      );

      expect(mockCodeGenerator.generateCode).toHaveBeenCalledWith(
        "ASSET_MODEL",
        "MODEL",
      );
      const createCall = mockModelRepo.create.mock.calls[0][0];
      expect(createCall.code).toBe("MODEL-000001");
    });

    it("should use CodeGeneratorService for location code when not provided", async () => {
      const resolver = new AutoCreateResolver();
      await resolver.resolveOrCreateLocation({ name: "New Location" });

      expect(mockCodeGenerator.generateCode).toHaveBeenCalledWith(
        "LOCATION",
        "LOC",
      );
      const createCall = mockLocationRepo.create.mock.calls[0][0];
      expect(createCall.code).toBe("LOC-000001");
    });

    it("should use CodeGeneratorService for stock location code when not provided", async () => {
      const resolver = new AutoCreateResolver();
      await resolver.resolveOrCreateStockLocation({
        name: "New Stock Location",
      });

      expect(mockCodeGenerator.generateCode).toHaveBeenCalledWith(
        "STOCK_LOCATION",
        "STOCK",
      );
      const createCall = mockStockLocationRepo.create.mock.calls[0][0];
      expect(createCall.code).toBe("STOCK-000001");
    });

    it("should NOT call CodeGeneratorService when code is provided", async () => {
      const resolver = new AutoCreateResolver();
      await resolver.resolveOrCreateVendor({
        code: "CUSTOM-CODE",
        name: "Custom Vendor",
      });

      // Should not call generateCode since code was provided
      expect(mockCodeGenerator.generateCode).not.toHaveBeenCalled();
      const createCall = mockVendorRepo.create.mock.calls[0][0];
      expect(createCall.code).toBe("CUSTOM-CODE");
    });
  });
});
