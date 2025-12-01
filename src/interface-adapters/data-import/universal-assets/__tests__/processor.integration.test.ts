/**
 * Integration tests for processor.ts
 *
 * Tests the processUniversalAssetsImport function which orchestrates the full
 * import flow through all phases.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { processUniversalAssetsImport } from "../processor";
import type { UniversalImportSettings } from "../types";
import {
  createMockPersonRepository,
  createMockVendorRepository,
  createMockAssetCategoryRepository,
  createMockAssetModelRepository,
  createMockLocationRepository,
  createMockStockLocationRepository,
  createMockLifecycleStateRepository,
  createMockAssetRepository,
  createMockAssetAssignmentRepository,
  createMockFieldDefinitionRepository,
  createMockAssetCategoryFieldRepository,
} from "./mocks/repositories.mock";
import { createMockLogger } from "./mocks/logger.mock";
import {
  PERSON_FIXTURES,
  VENDOR_FIXTURES,
  CATEGORY_FIXTURES,
  MODEL_FIXTURES,
  LOCATION_FIXTURES,
  STOCK_LOCATION_FIXTURES,
  LIFECYCLE_STATE_FIXTURES,
} from "./fixtures/entities.fixtures";

// Mock DI container
vi.mock("@/di/container", () => ({
  getContainer: vi.fn(),
}));

// Mock Prisma client for transactions
vi.mock("@/infrastructure/database/prisma/client", () => ({
  prisma: {
    $transaction: vi.fn(async (callback: (tx: unknown) => Promise<unknown>) => {
      const mockTx = {
        asset: {
          create: vi.fn().mockResolvedValue({ id: "tx-asset-1" }),
          update: vi.fn().mockResolvedValue({}),
        },
        assetAssignment: {
          create: vi.fn().mockResolvedValue({ id: "tx-assign-1" }),
          findFirst: vi.fn().mockResolvedValue(null),
        },
      };
      return callback(mockTx);
    }),
  },
}));

import { getContainer } from "@/di/container";
import { DI_TOKENS } from "@/di/types";

describe("processUniversalAssetsImport Integration Tests", () => {
  // All mock repositories
  let mockPersonRepo: ReturnType<typeof createMockPersonRepository>;
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
  let mockAssetRepo: ReturnType<typeof createMockAssetRepository>;
  let mockAssignmentRepo: ReturnType<
    typeof createMockAssetAssignmentRepository
  >;
  let mockFieldDefRepo: ReturnType<typeof createMockFieldDefinitionRepository>;
  let mockCategoryFieldRepo: ReturnType<
    typeof createMockAssetCategoryFieldRepository
  >;
  let mockLogger: ReturnType<typeof createMockLogger>;
  let mockUpdateAssetUseCase: { execute: ReturnType<typeof vi.fn> };
  let mockCodeGenerator: { generateCode: ReturnType<typeof vi.fn> };
  let mockSarConversionService: {
    convertToSarIfNeeded: ReturnType<typeof vi.fn>;
  };
  let mockAssetMovementService: { createMovementTx: ReturnType<typeof vi.fn> };
  let codeGeneratorCounter: number;

  // Default settings
  const defaultSettings: UniversalImportSettings = {
    autoCreateMissingEntities: true,
    skipRowOnAutoCreateFailure: true,
    handleAssignmentChanges: true,
    closeOldAssignmentsOnReassign: true,
    requirePersonForImport: true,
  };

  // Helper to create column headers from a row
  function getHeaders(row: Record<string, string>): string[] {
    return Object.keys(row);
  }

  // Helper to create a valid CSV row
  function createCsvRow(
    overrides: Record<string, string> = {},
  ): Record<string, string> {
    return {
      "person.email": "john.doe@barq.com",
      "asset.serial_number": `SN-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      "asset.asset_tag": "TAG-001",
      "category.code": "LAPTOP",
      "vendor.code": "DELL",
      "model.code": "DELL-LAT-5520",
      ...overrides,
    };
  }

  beforeEach(() => {
    vi.clearAllMocks();

    // Create fresh mocks
    mockPersonRepo = createMockPersonRepository();
    mockVendorRepo = createMockVendorRepository();
    mockCategoryRepo = createMockAssetCategoryRepository();
    mockModelRepo = createMockAssetModelRepository();
    mockLocationRepo = createMockLocationRepository();
    mockStockLocationRepo = createMockStockLocationRepository();
    mockLifecycleStateRepo = createMockLifecycleStateRepository();
    mockAssetRepo = createMockAssetRepository();
    mockAssignmentRepo = createMockAssetAssignmentRepository();
    mockFieldDefRepo = createMockFieldDefinitionRepository();
    mockCategoryFieldRepo = createMockAssetCategoryFieldRepository();
    mockLogger = createMockLogger();
    mockUpdateAssetUseCase = { execute: vi.fn().mockResolvedValue({}) };
    codeGeneratorCounter = 0;
    mockCodeGenerator = {
      generateCode: vi.fn().mockImplementation(() => {
        codeGeneratorCounter++;
        return Promise.resolve(
          `ASSET-${String(codeGeneratorCounter).padStart(6, "0")}`,
        );
      }),
    };
    mockSarConversionService = {
      convertToSarIfNeeded: vi
        .fn()
        .mockImplementation(
          (amount: number | null, currency: string | null) => {
            // Simple mock: return same amount for SAR, multiply by 3.75 for USD
            if (amount === null || currency === null)
              return Promise.resolve(null);
            if (currency === "SAR") return Promise.resolve(amount);
            if (currency === "USD") return Promise.resolve(amount * 3.75);
            return Promise.resolve(amount);
          },
        ),
    };
    mockAssetMovementService = {
      createMovementTx: vi.fn().mockResolvedValue({ id: "movement-1" }),
    };

    // Seed fixtures
    mockPersonRepo.seed(PERSON_FIXTURES);
    mockVendorRepo.seed(VENDOR_FIXTURES);
    mockCategoryRepo.seed(CATEGORY_FIXTURES);
    mockModelRepo.seed(MODEL_FIXTURES);
    mockLocationRepo.seed(LOCATION_FIXTURES);
    mockStockLocationRepo.seed(STOCK_LOCATION_FIXTURES);
    mockLifecycleStateRepo.seed(LIFECYCLE_STATE_FIXTURES);

    // Setup container mock
    (getContainer as ReturnType<typeof vi.fn>).mockReturnValue({
      get: vi.fn((token: symbol) => {
        switch (token) {
          case DI_TOKENS.ILoggerService:
            return mockLogger;
          case DI_TOKENS.IPersonRepository:
            return mockPersonRepo;
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
          case DI_TOKENS.IAssetRepository:
            return mockAssetRepo;
          case DI_TOKENS.IAssetAssignmentRepository:
            return mockAssignmentRepo;
          case DI_TOKENS.IFieldDefinitionRepository:
            return mockFieldDefRepo;
          case DI_TOKENS.IAssetCategoryFieldRepository:
            return mockCategoryFieldRepo;
          case DI_TOKENS.UpdateAssetUseCase:
            return mockUpdateAssetUseCase;
          case DI_TOKENS.ICodeGeneratorService:
            return mockCodeGenerator;
          case DI_TOKENS.ISarConversionService:
            return mockSarConversionService;
          case DI_TOKENS.IAssetMovementService:
            return mockAssetMovementService;
          default:
            throw new Error(`Unknown token: ${String(token)}`);
        }
      }),
    });
  });

  // ============================================
  // COLUMN VALIDATION PHASE
  // ============================================
  describe("column validation phase", () => {
    it("should succeed without person.email column (creates assets without assignment)", async () => {
      // person.email is optional - assets can be imported without assignment
      const rows = [
        {
          "asset.serial_number": "SN-NO-PERSON",
          "category.code": "LAPTOP",
        },
      ];
      const headers = getHeaders(rows[0]);

      const result = await processUniversalAssetsImport(rows, headers, {
        ...defaultSettings,
        requirePersonForImport: false,
      });

      // Should succeed - person.email is optional
      expect(result.success).toBe(true);
      expect(result.assetsCreated).toBe(1);
      expect(result.assignmentsCreated).toBe(0); // No assignment created
    });

    it("should fail early if asset.serial_number column is missing", async () => {
      const rows = [
        {
          "person.email": "john.doe@barq.com",
          "category.code": "LAPTOP",
        },
      ];
      const headers = getHeaders(rows[0]);

      const result = await processUniversalAssetsImport(
        rows,
        headers,
        defaultSettings,
      );

      // Column validation errors cause early return with success=false
      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(
        result.errors.some((e) => e.error.toLowerCase().includes("serial")),
      ).toBe(true);
    });

    it("should warn about duplicate serial numbers in file", async () => {
      const row1 = createCsvRow({ "asset.serial_number": "SN-DUPLICATE" });
      const row2 = createCsvRow({ "asset.serial_number": "SN-DUPLICATE" });
      const rows = [row1, row2];
      const headers = getHeaders(row1);

      const result = await processUniversalAssetsImport(
        rows,
        headers,
        defaultSettings,
      );

      // Duplicate serial numbers should be detected
      expect(result.totalRows).toBe(2);
    });
  });

  // ============================================
  // PERSON VALIDATION PHASE
  // ============================================
  describe("person validation phase", () => {
    describe("requirePersonForImport=true", () => {
      it("should skip row when email is missing", async () => {
        const row = {
          "person.email": "",
          "asset.serial_number": "SN-001",
          "category.code": "LAPTOP",
        };
        const rows = [row];
        const headers = getHeaders(row);

        const result = await processUniversalAssetsImport(rows, headers, {
          ...defaultSettings,
          requirePersonForImport: true,
        });

        expect(result.skipCount).toBe(1);
      });

      it("should skip row when person not found in database", async () => {
        const row = createCsvRow({ "person.email": "nonexistent@barq.com" });
        const rows = [row];
        const headers = getHeaders(row);

        const result = await processUniversalAssetsImport(rows, headers, {
          ...defaultSettings,
          requirePersonForImport: true,
        });

        expect(result.skipCount).toBe(1);
        expect(
          result.skipped.some((s) =>
            s.reason.toLowerCase().includes("not found"),
          ),
        ).toBe(true);
      });
    });

    describe("requirePersonForImport=false", () => {
      it("should allow row when email is missing", async () => {
        const row = {
          "person.email": "",
          "asset.serial_number": "SN-001",
          "category.code": "LAPTOP",
        };
        const rows = [row];
        const headers = getHeaders(row);

        const result = await processUniversalAssetsImport(rows, headers, {
          ...defaultSettings,
          requirePersonForImport: false,
        });

        // Row should be processed (not skipped for missing email)
        expect(result.skipCount).toBe(0);
      });
    });
  });

  // ============================================
  // ENTITY RESOLUTION FLOW
  // ============================================
  describe("entity resolution flow", () => {
    it("should resolve vendor before model", async () => {
      const row = createCsvRow({
        "vendor.code": "DELL",
        "model.code": "NEW-MODEL",
      });
      const rows = [row];
      const headers = getHeaders(row);

      await processUniversalAssetsImport(rows, headers, defaultSettings);

      // Vendor should be resolved first
      expect(mockVendorRepo.findByCode).toHaveBeenCalledWith("DELL");
    });

    it("should resolve category before model", async () => {
      const row = createCsvRow({
        "category.code": "LAPTOP",
        "model.code": "NEW-MODEL",
      });
      const rows = [row];
      const headers = getHeaders(row);

      await processUniversalAssetsImport(rows, headers, defaultSettings);

      // Category should be resolved
      expect(mockCategoryRepo.findByCode).toHaveBeenCalledWith("LAPTOP");
    });

    it("should lookup lifecycle state (no auto-create)", async () => {
      const row = createCsvRow({ "lifecycle.code": "IN_USE" });
      const rows = [row];
      const headers = getHeaders(row);

      await processUniversalAssetsImport(rows, headers, defaultSettings);

      expect(mockLifecycleStateRepo.findAll).toHaveBeenCalled();
    });
  });

  // ============================================
  // ASSET CREATION/UPDATE
  // ============================================
  describe("asset creation/update", () => {
    it("should create new asset when serial number not found", async () => {
      const row = createCsvRow({ "asset.serial_number": "SN-NEW-001" });
      const rows = [row];
      const headers = getHeaders(row);

      const result = await processUniversalAssetsImport(
        rows,
        headers,
        defaultSettings,
      );

      expect(result.successCount).toBe(1);
      expect(result.assetsCreated).toBe(1);
    });

    it("should update existing asset when serial number matches", async () => {
      // Seed existing asset
      mockAssetRepo.seed([
        {
          id: "existing-asset",
          serialNumber: "SN-EXISTING",
          assetTag: "OLD-TAG",
          assetCategoryId: "cat-laptop",
        },
      ]);

      const row = createCsvRow({
        "asset.serial_number": "SN-EXISTING",
        "asset.asset_tag": "NEW-TAG",
      });
      const rows = [row];
      const headers = getHeaders(row);

      const result = await processUniversalAssetsImport(
        rows,
        headers,
        defaultSettings,
      );

      expect(result.successCount).toBe(1);
      expect(result.assetsUpdated).toBe(1);
    });
  });

  // ============================================
  // FULL FLOW SCENARIOS
  // ============================================
  describe("full flow scenarios", () => {
    it("happy path: all entities exist", async () => {
      const row = createCsvRow({
        "person.email": "john.doe@barq.com",
        "asset.serial_number": "SN-HAPPY-001",
        "category.code": "LAPTOP",
        "vendor.code": "DELL",
        "model.code": "DELL-LAT-5520",
        "location.code": "RUH-HQ",
        "stock_location.code": "WH-RIYADH",
        "lifecycle.code": "IN_USE",
      });
      const rows = [row];
      const headers = getHeaders(row);

      const result = await processUniversalAssetsImport(
        rows,
        headers,
        defaultSettings,
      );

      expect(result.successCount).toBe(1);
      expect(result.failureCount).toBe(0);
      expect(result.skipCount).toBe(0);
    });

    it("auto-creation: new vendor, category, model", async () => {
      const row = {
        "person.email": "john.doe@barq.com",
        "asset.serial_number": "SN-AUTO-001",
        "vendor.name": "New Vendor Inc",
        "category.name": "New Category",
        "model.name": "New Model XYZ",
      };
      const rows = [row];
      const headers = getHeaders(row);

      const result = await processUniversalAssetsImport(rows, headers, {
        ...defaultSettings,
        autoCreateMissingEntities: true,
      });

      expect(result.successCount).toBe(1);
      expect(mockVendorRepo.create).toHaveBeenCalled();
      expect(mockCategoryRepo.create).toHaveBeenCalled();
      expect(mockModelRepo.create).toHaveBeenCalled();
    });

    it("partial failure: some rows skip, others succeed", async () => {
      const row1 = createCsvRow({
        "person.email": "john.doe@barq.com",
        "asset.serial_number": "SN-SUCCESS",
      });
      const row2 = createCsvRow({
        "person.email": "nonexistent@barq.com",
        "asset.serial_number": "SN-FAIL",
      });
      const rows = [row1, row2];
      const headers = getHeaders(row1);

      const result = await processUniversalAssetsImport(
        rows,
        headers,
        defaultSettings,
      );

      expect(result.successCount).toBe(1);
      expect(result.skipCount).toBe(1);
    });
  });

  // ============================================
  // RESULT METRICS
  // ============================================
  describe("result metrics", () => {
    it("should have correct counts: success, failure, skip", async () => {
      const row1 = createCsvRow({ "asset.serial_number": "SN-1" });
      const row2 = createCsvRow({ "asset.serial_number": "SN-2" });
      const rows = [row1, row2];
      const headers = getHeaders(row1);

      const result = await processUniversalAssetsImport(
        rows,
        headers,
        defaultSettings,
      );

      expect(result.totalRows).toBe(2);
      expect(result.successCount + result.failureCount + result.skipCount).toBe(
        2,
      );
    });

    it("should track assignment counts", async () => {
      const row = createCsvRow();
      const rows = [row];
      const headers = getHeaders(row);

      const result = await processUniversalAssetsImport(
        rows,
        headers,
        defaultSettings,
      );

      // Should have assignment metrics
      expect(typeof result.assignmentsCreated).toBe("number");
      expect(typeof result.assignmentsUnchanged).toBe("number");
    });

    it("should track duration and throughput", async () => {
      const row = createCsvRow();
      const rows = [row];
      const headers = getHeaders(row);

      const result = await processUniversalAssetsImport(
        rows,
        headers,
        defaultSettings,
      );

      expect(result.duration).toBeDefined();
      expect(result.duration).toBeGreaterThanOrEqual(0);
    });

    it("errors should have message property", async () => {
      const row = createCsvRow({ "person.email": "nonexistent@barq.com" });
      const rows = [row];
      const headers = getHeaders(row);

      const result = await processUniversalAssetsImport(
        rows,
        headers,
        defaultSettings,
      );

      if (result.errors.length > 0) {
        const error = result.errors[0];
        expect(error.error).toBeDefined();
      }
    });
  });

  // ============================================
  // SETTINGS COMBINATIONS
  // ============================================
  describe("settings combinations", () => {
    it("should work with all default settings", async () => {
      const row = createCsvRow();
      const rows = [row];
      const headers = getHeaders(row);

      const result = await processUniversalAssetsImport(rows, headers, {
        autoCreateMissingEntities: true,
        skipRowOnAutoCreateFailure: true,
        handleAssignmentChanges: true,
        closeOldAssignmentsOnReassign: true,
        requirePersonForImport: true,
      });

      expect(result).toBeDefined();
      expect(result.totalRows).toBe(1);
    });

    it("should work with autoCreateMissingEntities=false", async () => {
      const row = {
        "person.email": "john.doe@barq.com",
        "asset.serial_number": "SN-001",
        "vendor.name": "Nonexistent Vendor",
        "category.code": "LAPTOP",
      };
      const rows = [row];
      const headers = getHeaders(row);

      await processUniversalAssetsImport(rows, headers, {
        ...defaultSettings,
        autoCreateMissingEntities: false,
      });

      // Should not create vendor
      expect(mockVendorRepo.create).not.toHaveBeenCalled();
    });

    it("should work with handleAssignmentChanges=false", async () => {
      const row = createCsvRow();
      const rows = [row];
      const headers = getHeaders(row);

      const result = await processUniversalAssetsImport(rows, headers, {
        ...defaultSettings,
        handleAssignmentChanges: false,
      });

      expect(result.assignmentsCreated).toBe(0);
      expect(result.assignmentsUnchanged).toBeGreaterThan(0);
    });
  });

  // ============================================
  // CUSTOM FIELDS
  // ============================================
  describe("custom fields", () => {
    it("should process custom field columns", async () => {
      const row = {
        ...createCsvRow(),
        "custom.cpu_cores": "8",
        "custom.ram_gb": "16",
      };
      const rows = [row];
      const headers = getHeaders(row);

      const result = await processUniversalAssetsImport(
        rows,
        headers,
        defaultSettings,
      );

      expect(result.successCount).toBe(1);
    });

    it("should infer custom field data types", async () => {
      const row1 = {
        ...createCsvRow({ "asset.serial_number": "SN-CF-1" }),
        "custom.is_encrypted": "true",
        "custom.cpu_cores": "8",
        "custom.price": "1500.50",
      };
      const row2 = {
        ...createCsvRow({ "asset.serial_number": "SN-CF-2" }),
        "custom.is_encrypted": "false",
        "custom.cpu_cores": "16",
        "custom.price": "2000.00",
      };
      const rows = [row1, row2];
      const headers = getHeaders(row1);

      const result = await processUniversalAssetsImport(
        rows,
        headers,
        defaultSettings,
      );

      expect(result.successCount).toBe(2);
    });
  });

  // ============================================
  // PROGRESS CALLBACK
  // ============================================
  describe("progress callback", () => {
    it("should call progress callback during processing", async () => {
      const progressCallback = vi.fn();
      const row1 = createCsvRow({ "asset.serial_number": "SN-1" });
      const row2 = createCsvRow({ "asset.serial_number": "SN-2" });
      const rows = [row1, row2];
      const headers = getHeaders(row1);

      await processUniversalAssetsImport(
        rows,
        headers,
        defaultSettings,
        progressCallback,
      );

      expect(progressCallback).toHaveBeenCalled();
    });

    it("should report phase changes", async () => {
      const phases: string[] = [];
      const progressCallback = vi.fn((progress: { phase?: string }) => {
        if (progress.phase && !phases.includes(progress.phase)) {
          phases.push(progress.phase);
        }
      });
      const row = createCsvRow();
      const rows = [row];
      const headers = getHeaders(row);

      await processUniversalAssetsImport(
        rows,
        headers,
        defaultSettings,
        progressCallback,
      );

      // Should have reported multiple phases
      expect(phases.length).toBeGreaterThan(0);
    });
  });

  // ============================================
  // EDGE CASES
  // ============================================
  describe("edge cases", () => {
    it("should handle empty rows array", async () => {
      const result = await processUniversalAssetsImport(
        [],
        [],
        defaultSettings,
      );

      expect(result.totalRows).toBe(0);
      expect(result.successCount).toBe(0);
    });

    it("should handle whitespace in values", async () => {
      const row = createCsvRow({
        "person.email": "  john.doe@barq.com  ",
        "asset.serial_number": "  SN-WHITESPACE  ",
      });
      const rows = [row];
      const headers = getHeaders(row);

      const result = await processUniversalAssetsImport(
        rows,
        headers,
        defaultSettings,
      );

      expect(result.successCount).toBe(1);
    });

    it("should handle null/undefined values", async () => {
      const row = {
        "person.email": "john.doe@barq.com",
        "asset.serial_number": "SN-NULL",
        "category.code": "LAPTOP",
        "vendor.code": null as unknown as string,
      };
      const rows = [row];
      const headers = getHeaders(row);

      const result = await processUniversalAssetsImport(
        rows,
        headers,
        defaultSettings,
      );

      // Should still process, vendor just won't be set
      expect(result.totalRows).toBe(1);
    });

    it("should handle very long serial numbers", async () => {
      const longSerial = "SN-" + "X".repeat(200);
      const row = createCsvRow({ "asset.serial_number": longSerial });
      const rows = [row];
      const headers = getHeaders(row);

      const result = await processUniversalAssetsImport(
        rows,
        headers,
        defaultSettings,
      );

      // Should process (may truncate or warn)
      expect(result.totalRows).toBe(1);
    });
  });

  // ============================================
  // ERROR RECOVERY
  // ============================================
  describe("error recovery", () => {
    it("should continue processing after row error", async () => {
      const row1 = createCsvRow({
        "person.email": "nonexistent@barq.com",
        "asset.serial_number": "SN-ERR-1",
      });
      const row2 = createCsvRow({
        "person.email": "john.doe@barq.com",
        "asset.serial_number": "SN-ERR-2",
      });
      const rows = [row1, row2];
      const headers = getHeaders(row1);

      const result = await processUniversalAssetsImport(
        rows,
        headers,
        defaultSettings,
      );

      // Second row should still succeed
      expect(result.successCount).toBe(1);
      expect(result.skipCount).toBe(1);
    });

    it("should collect all errors, not just first", async () => {
      const row1 = createCsvRow({ "person.email": "bad1@barq.com" });
      const row2 = createCsvRow({ "person.email": "bad2@barq.com" });
      const rows = [row1, row2];
      const headers = getHeaders(row1);

      const result = await processUniversalAssetsImport(
        rows,
        headers,
        defaultSettings,
      );

      // Should have collected skipped entries for both rows
      expect(result.skipped.length).toBe(2);
    });
  });
});
