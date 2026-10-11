/**
 * Asset Controller - Unit Tests
 *
 * Tests for asset CRUD server actions including:
 * - Create asset
 * - Update asset
 * - Delete asset
 * - Get single asset
 * - List assets
 * - Bulk create assets
 * - Get import lookup maps
 * - Check asset duplicates
 * - Bulk upsert assets
 * - Error handling
 * - Zod validation
 * - Permission checks
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  createAssetAction,
  updateAssetAction,
  deleteAssetAction,
  getAssetAction,
  listAssetsAction,
  bulkCreateAssetsAction,
  getImportLookupMapsAction,
  checkAssetDuplicatesAction,
  bulkUpsertAssetsAction,
} from "../asset.controller";
import type { Asset } from "@/core/domain/entities/asset.entity";
import type {
  CreateAssetDTO,
  UpdateAssetDTO,
} from "../../dtos/generated/asset.dto";

// Mock logger service
const mockLogger = {
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  child: vi.fn(() => mockLogger),
};

// Mock use cases
const mockCreateAssetUseCase = {
  execute: vi.fn(),
};

const mockUpdateAssetUseCase = {
  execute: vi.fn(),
};

const mockDeleteAssetWithConfirmationUseCase = {
  execute: vi.fn(),
  executeSoftDelete: vi.fn(),
};

const mockListAssetsUseCase = {
  execute: vi.fn(),
};

const mockListAssetCategoriesUseCase = {
  execute: vi.fn(),
};

const mockListAssetModelsUseCase = {
  execute: vi.fn(),
};

const mockListVendorsUseCase = {
  execute: vi.fn(),
};

const mockListStockLocationsUseCase = {
  execute: vi.fn(),
};

const mockListLifecycleStatesUseCase = {
  execute: vi.fn(),
};

const mockListOrganizationUnitsUseCase = {
  execute: vi.fn(),
};

const mockAssetAssignmentRepository = {
  findAll: vi.fn(),
};

const mockPersonRepository = {
  findById: vi.fn(),
  findByUserId: vi.fn(),
  findByEmail: vi.fn(),
  findActive: vi.fn(),
};

const mockAssetRepository = {
  findById: vi.fn(),
  findByAssetTag: vi.fn(),
  findBySerialNumbers: vi.fn(),
};

// Mock requirePermission
vi.mock("@/lib/permissions/server", () => ({
  requirePermission: vi.fn(),
}));

// Mock revalidatePath
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/auth/session", () => ({
  getSession: vi.fn(() => Promise.resolve({ user: null })),
}));

// Sample asset data - includes methods that presenter calls
// Cast through unknown to bypass private constructor check in tests
const createMockAsset = (overrides?: Partial<Asset>): Asset =>
  ({
    id: "asset-1",
    assetTag: "LAPTOP-001",
    assetCategoryId: "cat-laptop",
    assetModelId: "model-dell",
    vendorId: "vendor-dell",
    contractId: null,
    lifecycleStateId: "state-active",
    serialNumber: "SN-12345",
    purchaseDate: new Date("2024-01-15"),
    purchaseCost: 1500,
    purchaseCostSar: 5625,
    currency: "USD",
    depreciationModel: null,
    depreciationStart: null,
    depreciationEnd: null,
    condition: "NEW",
    currentStockLocationId: "stock-hq",
    attributes: null,
    note: null,
    createdAt: new Date("2024-01-15"),
    updatedAt: new Date("2024-01-15"),
    // Methods required by presenter
    isUnderWarranty: () => true,
    isDepreciated: () => false,
    isFullyDepreciated: () => false,
    ...overrides,
  }) as unknown as Asset;

// Mock the DI container
vi.mock("@/di/container", () => ({
  getContainer: vi.fn(() => ({
    isBound: vi.fn(() => false),
    get: vi.fn((token) => {
      const tokenKey = token.toString();
      if (tokenKey === Symbol.for("CreateAssetUseCase").toString()) {
        return mockCreateAssetUseCase;
      }
      if (tokenKey === Symbol.for("UpdateAssetUseCase").toString()) {
        return mockUpdateAssetUseCase;
      }
      if (
        tokenKey === Symbol.for("DeleteAssetWithConfirmationUseCase").toString()
      ) {
        return mockDeleteAssetWithConfirmationUseCase;
      }
      if (tokenKey === Symbol.for("ListAssetsUseCase").toString()) {
        return mockListAssetsUseCase;
      }
      if (tokenKey === Symbol.for("ListAssetCategoriesUseCase").toString()) {
        return mockListAssetCategoriesUseCase;
      }
      if (tokenKey === Symbol.for("ListAssetModelsUseCase").toString()) {
        return mockListAssetModelsUseCase;
      }
      if (tokenKey === Symbol.for("ListVendorsUseCase").toString()) {
        return mockListVendorsUseCase;
      }
      if (tokenKey === Symbol.for("ListStockLocationsUseCase").toString()) {
        return mockListStockLocationsUseCase;
      }
      if (tokenKey === Symbol.for("ListLifecycleStatesUseCase").toString()) {
        return mockListLifecycleStatesUseCase;
      }
      if (tokenKey === Symbol.for("ListOrganizationUnitsUseCase").toString()) {
        return mockListOrganizationUnitsUseCase;
      }
      if (tokenKey === Symbol.for("IAssetRepository").toString()) {
        return mockAssetRepository;
      }
      if (tokenKey === Symbol.for("IAssetAssignmentRepository").toString()) {
        return mockAssetAssignmentRepository;
      }
      if (tokenKey === Symbol.for("IPersonRepository").toString()) {
        return mockPersonRepository;
      }
      if (tokenKey === Symbol.for("ILoggerService").toString()) {
        return mockLogger;
      }
      return null;
    }),
  })),
}));

describe("Asset Controller", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default successful mocks
    mockAssetRepository.findByAssetTag.mockResolvedValue(createMockAsset());
    mockAssetRepository.findBySerialNumbers.mockResolvedValue([]);
    mockAssetAssignmentRepository.findAll.mockResolvedValue([]);
    mockPersonRepository.findById.mockResolvedValue(null);
    mockPersonRepository.findByUserId.mockResolvedValue(null);
    mockPersonRepository.findByEmail.mockResolvedValue(null);
    mockPersonRepository.findActive.mockResolvedValue([
      {
        id: "person-ahmed",
        email: "Ahmed.Alharbi@barq.com",
      },
    ]);

    // Mock related entity lists for enrichment
    mockListAssetCategoriesUseCase.execute.mockResolvedValue([
      { id: "cat-laptop", name: "Laptop", code: "LAPTOP" },
    ]);
    mockListAssetModelsUseCase.execute.mockResolvedValue([
      { id: "model-dell", name: "Dell XPS 15", code: "DELL-XPS" },
    ]);
    mockListVendorsUseCase.execute.mockResolvedValue([
      { id: "vendor-dell", name: "Dell Technologies", code: "DELL" },
    ]);
    mockListStockLocationsUseCase.execute.mockResolvedValue([
      { id: "stock-hq", name: "HQ Warehouse", code: "HQ" },
    ]);
    mockListLifecycleStatesUseCase.execute.mockResolvedValue([
      { id: "state-active", name: "Active", code: "ACTIVE" },
    ]);
    mockListOrganizationUnitsUseCase.execute.mockResolvedValue([
      { id: "org-barq", name: "Barq", code: "BARQ", unitType: "COMPANY" },
      { id: "org-aoun", name: "Aoun", code: "AOUN", unitType: "COMPANY" },
      { id: "org-it", name: "IT", code: "IT", unitType: "DEPARTMENT" },
    ]);
  });

  describe("createAssetAction", () => {
    it("should create a new asset successfully", async () => {
      // Arrange
      const mockAsset = createMockAsset();
      mockCreateAssetUseCase.execute.mockResolvedValue(mockAsset);

      const data: CreateAssetDTO = {
        assetTag: "LAPTOP-001",
        assetCategoryId: "cat-laptop",
        serialNumber: "SN-12345",
        purchaseCost: null,
      };

      // Act
      const result = await createAssetAction(data);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe("asset-1");
        expect(result.data.assetTag).toBe("LAPTOP-001");
      }
    });

    it("should call use case with validated data", async () => {
      // Arrange
      const mockAsset = createMockAsset();
      mockCreateAssetUseCase.execute.mockResolvedValue(mockAsset);

      const data: CreateAssetDTO = {
        assetTag: "LAPTOP-002",
        assetCategoryId: "cat-laptop",
        assetModelId: "model-dell",
        vendorId: "vendor-dell",
        serialNumber: "SN-67890",
        purchaseCost: 2000,
        currency: "USD",
      };

      // Act
      await createAssetAction(data);

      // Assert
      expect(mockCreateAssetUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          assetTag: "LAPTOP-002",
          assetCategoryId: "cat-laptop",
          assetModelId: "model-dell",
          vendorId: "vendor-dell",
          serialNumber: "SN-67890",
          purchaseCost: 2000,
          currency: "USD",
        }),
      );
    });

    it("should return error response on validation failure", async () => {
      // Arrange - missing required assetCategoryId
      const data = {
        assetTag: "LAPTOP-001",
      } as CreateAssetDTO;

      // Act
      const result = await createAssetAction(data);

      // Assert
      expect(result.success).toBe(false);
    });

    it("should return error response on use case error", async () => {
      // Arrange
      mockCreateAssetUseCase.execute.mockRejectedValue(
        new Error("Asset tag already exists"),
      );

      const data: CreateAssetDTO = {
        assetTag: "LAPTOP-001",
        assetCategoryId: "cat-laptop",
        purchaseCost: null,
      };

      // Act
      const result = await createAssetAction(data);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Asset tag already exists");
      }
    });

    it("should handle optional fields correctly", async () => {
      // Arrange
      const mockAsset = createMockAsset();
      mockCreateAssetUseCase.execute.mockResolvedValue(mockAsset);

      const data: CreateAssetDTO = {
        assetTag: "LAPTOP-003",
        assetCategoryId: "cat-laptop",
        note: "Test note",
        attributes: { ram: "16GB" },
        purchaseCost: null,
      };

      // Act
      await createAssetAction(data);

      // Assert
      expect(mockCreateAssetUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          assetTag: "LAPTOP-003",
          note: "Test note",
          attributes: { ram: "16GB" },
        }),
      );
    });
  });

  describe("listAssetsAction", () => {
    it("should list all assets", async () => {
      // Arrange
      const mockAssets = [
        createMockAsset(),
        createMockAsset({ id: "asset-2", assetTag: "LAPTOP-002" }),
      ];
      mockListAssetsUseCase.execute.mockResolvedValue(mockAssets);

      // Act
      const result = await listAssetsAction();

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(2);
      }
    });

    it("should handle empty result", async () => {
      // Arrange
      mockListAssetsUseCase.execute.mockResolvedValue([]);

      // Act
      const result = await listAssetsAction();

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual([]);
      }
    });

    it("should pass search options to use case", async () => {
      // Arrange
      mockListAssetsUseCase.execute.mockResolvedValue([]);

      const searchOptions = {
        assetCategoryId: "cat-laptop",
        searchTerm: "LAPTOP",
      };

      // Act
      await listAssetsAction(searchOptions);

      // Assert
      expect(mockListAssetsUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          assetCategoryId: "cat-laptop",
          searchTerm: "LAPTOP",
        }),
      );
    });

    it("should enrich assets with related entity names", async () => {
      // Arrange
      const mockAssets = [createMockAsset()];
      mockListAssetsUseCase.execute.mockResolvedValue(mockAssets);

      // Act
      const result = await listAssetsAction();

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data[0].categoryName).toBe("Laptop");
        expect(result.data[0].modelName).toBe("Dell XPS 15");
        expect(result.data[0].vendorName).toBe("Dell Technologies");
      }
    });

    it("should return error response on exception", async () => {
      // Arrange
      mockListAssetsUseCase.execute.mockRejectedValue(
        new Error("Database error"),
      );

      // Act
      const result = await listAssetsAction();

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Database error");
      }
    });
  });

  describe("getAssetAction", () => {
    it("should get asset by asset tag", async () => {
      // Arrange
      const mockAsset = createMockAsset();
      mockAssetRepository.findByAssetTag.mockResolvedValue(mockAsset);

      // Act
      const result = await getAssetAction("LAPTOP-001");

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe("asset-1");
        expect(result.data.assetTag).toBe("LAPTOP-001");
      }
    });

    it("should call repository with asset tag", async () => {
      // Arrange
      const mockAsset = createMockAsset();
      mockAssetRepository.findByAssetTag.mockResolvedValue(mockAsset);

      // Act
      await getAssetAction("LAPTOP-001");

      // Assert
      expect(mockAssetRepository.findByAssetTag).toHaveBeenCalledWith(
        "LAPTOP-001",
      );
    });

    it("should return error when asset not found", async () => {
      // Arrange
      mockAssetRepository.findByAssetTag.mockResolvedValue(null);

      // Act
      const result = await getAssetAction("NONEXISTENT");

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Asset not found");
      }
    });

    it("should enrich asset with related entity names", async () => {
      // Arrange
      const mockAsset = createMockAsset();
      mockAssetRepository.findByAssetTag.mockResolvedValue(mockAsset);

      // Act
      const result = await getAssetAction("LAPTOP-001");

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.categoryName).toBe("Laptop");
        expect(result.data.stockLocationName).toBe("HQ Warehouse");
      }
    });

    it("should return error response on exception", async () => {
      // Arrange
      mockAssetRepository.findByAssetTag.mockRejectedValue(
        new Error("Database error"),
      );

      // Act
      const result = await getAssetAction("LAPTOP-001");

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Database error");
      }
    });
  });

  describe("updateAssetAction", () => {
    it("should update asset successfully", async () => {
      // Arrange
      const existingAsset = createMockAsset();
      const updatedAsset = createMockAsset({ serialNumber: "SN-UPDATED" });
      mockAssetRepository.findByAssetTag.mockResolvedValue(existingAsset);
      mockUpdateAssetUseCase.execute.mockResolvedValue(updatedAsset);

      const data: UpdateAssetDTO = {
        serialNumber: "SN-UPDATED",
        purchaseCost: null,
      };

      // Act
      const result = await updateAssetAction("LAPTOP-001", data);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.serialNumber).toBe("SN-UPDATED");
      }
    });

    it("should call use case with asset ID and validated data", async () => {
      // Arrange
      const existingAsset = createMockAsset();
      const updatedAsset = createMockAsset();
      mockAssetRepository.findByAssetTag.mockResolvedValue(existingAsset);
      mockUpdateAssetUseCase.execute.mockResolvedValue(updatedAsset);

      const data: UpdateAssetDTO = {
        serialNumber: "SN-NEW",
        purchaseCost: 2500,
        note: "Updated note",
      };

      // Act
      await updateAssetAction("LAPTOP-001", data);

      // Assert
      expect(mockUpdateAssetUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          id: "asset-1",
          serialNumber: "SN-NEW",
          purchaseCost: 2500,
          note: "Updated note",
        }),
      );
    });

    it("should return error when asset not found", async () => {
      // Arrange
      mockAssetRepository.findByAssetTag.mockResolvedValue(null);

      const data: UpdateAssetDTO = {
        serialNumber: "SN-NEW",
        purchaseCost: null,
      };

      // Act
      const result = await updateAssetAction("NONEXISTENT", data);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Asset not found");
      }
    });

    it("should return error response on use case error", async () => {
      // Arrange
      const existingAsset = createMockAsset();
      mockAssetRepository.findByAssetTag.mockResolvedValue(existingAsset);
      mockUpdateAssetUseCase.execute.mockRejectedValue(
        new Error("Serial number already exists"),
      );

      const data: UpdateAssetDTO = {
        serialNumber: "DUPLICATE-SN",
        purchaseCost: null,
      };

      // Act
      const result = await updateAssetAction("LAPTOP-001", data);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Serial number already exists");
      }
    });

    it("should handle asset tag change", async () => {
      // Arrange
      const existingAsset = createMockAsset();
      const updatedAsset = createMockAsset({ assetTag: "LAPTOP-NEW" });
      mockAssetRepository.findByAssetTag.mockResolvedValue(existingAsset);
      mockUpdateAssetUseCase.execute.mockResolvedValue(updatedAsset);

      const data: UpdateAssetDTO = {
        assetTag: "LAPTOP-NEW",
        purchaseCost: null,
      };

      // Act
      const result = await updateAssetAction("LAPTOP-001", data);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.assetTag).toBe("LAPTOP-NEW");
      }
    });
  });

  describe("deleteAssetAction", () => {
    it("should delete asset successfully", async () => {
      // Arrange
      const existingAsset = createMockAsset();
      mockAssetRepository.findByAssetTag.mockResolvedValue(existingAsset);
      mockDeleteAssetWithConfirmationUseCase.execute.mockResolvedValue({
        canDelete: true,
        blockers: [],
      });
      mockDeleteAssetWithConfirmationUseCase.executeSoftDelete.mockResolvedValue(
        undefined,
      );

      // Act
      const result = await deleteAssetAction("LAPTOP-001");

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBeUndefined();
      }
    });

    it("should call use case with asset ID", async () => {
      // Arrange
      const existingAsset = createMockAsset();
      mockAssetRepository.findByAssetTag.mockResolvedValue(existingAsset);
      mockDeleteAssetWithConfirmationUseCase.execute.mockResolvedValue({
        canDelete: true,
        blockers: [],
      });
      mockDeleteAssetWithConfirmationUseCase.executeSoftDelete.mockResolvedValue(
        undefined,
      );

      // Act
      await deleteAssetAction("LAPTOP-001");

      // Assert
      expect(
        mockDeleteAssetWithConfirmationUseCase.execute,
      ).toHaveBeenCalledWith({ id: "asset-1" });
      expect(
        mockDeleteAssetWithConfirmationUseCase.executeSoftDelete,
      ).toHaveBeenCalledWith("asset-1");
    });

    it("should return error when asset not found", async () => {
      // Arrange
      mockAssetRepository.findByAssetTag.mockResolvedValue(null);

      // Act
      const result = await deleteAssetAction("NONEXISTENT");

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Asset not found");
      }
    });

    it("should return error and skip soft delete when asset has blockers", async () => {
      // Arrange
      const existingAsset = createMockAsset();
      mockAssetRepository.findByAssetTag.mockResolvedValue(existingAsset);
      mockDeleteAssetWithConfirmationUseCase.execute.mockResolvedValue({
        canDelete: false,
        blockers: ["1 active assignment(s). Unassign the asset first."],
      });

      // Act
      const result = await deleteAssetAction("LAPTOP-001");

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe(
          'Cannot delete asset "LAPTOP-001". 1 active assignment(s). Unassign the asset first.',
        );
      }
      expect(
        mockDeleteAssetWithConfirmationUseCase.executeSoftDelete,
      ).not.toHaveBeenCalled();
    });

    it("should return error response on use case error", async () => {
      // Arrange
      const existingAsset = createMockAsset();
      mockAssetRepository.findByAssetTag.mockResolvedValue(existingAsset);
      mockDeleteAssetWithConfirmationUseCase.execute.mockRejectedValue(
        new Error("Asset with ID not found"),
      );

      // Act
      const result = await deleteAssetAction("LAPTOP-001");

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Asset with ID not found");
      }
    });
  });

  describe("bulkCreateAssetsAction", () => {
    it("should bulk create assets successfully", async () => {
      // Arrange
      const mockAsset = createMockAsset();
      mockCreateAssetUseCase.execute.mockResolvedValue(mockAsset);

      const assetsData: CreateAssetDTO[] = [
        {
          assetTag: "LAPTOP-001",
          assetCategoryId: "cat-laptop",
          purchaseCost: null,
        },
        {
          assetTag: "LAPTOP-002",
          assetCategoryId: "cat-laptop",
          purchaseCost: null,
        },
      ];

      // Act
      const result = await bulkCreateAssetsAction(assetsData);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.successCount).toBe(2);
        expect(result.data.failureCount).toBe(0);
      }
    });

    it("should track failures", async () => {
      // Arrange
      mockCreateAssetUseCase.execute
        .mockResolvedValueOnce(createMockAsset())
        .mockRejectedValueOnce(new Error("Duplicate asset tag"));

      const assetsData: CreateAssetDTO[] = [
        {
          assetTag: "LAPTOP-001",
          assetCategoryId: "cat-laptop",
          purchaseCost: null,
        },
        {
          assetTag: "LAPTOP-002",
          assetCategoryId: "cat-laptop",
          purchaseCost: null,
        },
      ];

      // Act
      const result = await bulkCreateAssetsAction(assetsData);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.successCount).toBe(1);
        expect(result.data.failureCount).toBe(1);
        expect(result.data.failures).toHaveLength(1);
        expect(result.data.failures[0].error).toBe("Duplicate asset tag");
      }
    });

    it("should log bulk import progress", async () => {
      // Arrange
      mockCreateAssetUseCase.execute.mockResolvedValue(createMockAsset());

      const assetsData: CreateAssetDTO[] = [
        {
          assetTag: "LAPTOP-001",
          assetCategoryId: "cat-laptop",
          purchaseCost: null,
        },
      ];

      // Act
      await bulkCreateAssetsAction(assetsData);

      // Assert
      expect(mockLogger.info).toHaveBeenCalledWith("Bulk asset import started");
      expect(mockLogger.info).toHaveBeenCalledWith(
        "Bulk asset import completed",
        expect.any(Object),
      );
    });

    it("should handle validation failures in bulk", async () => {
      // Arrange
      const assetsData = [
        { assetTag: "LAPTOP-001" }, // Missing assetCategoryId
      ] as CreateAssetDTO[];

      // Act
      const result = await bulkCreateAssetsAction(assetsData);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.failureCount).toBe(1);
      }
    });
  });

  describe("getImportLookupMapsAction", () => {
    it("should return lookup maps", async () => {
      // Act
      const result = await getImportLookupMapsAction();

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.categoryMap).toHaveProperty("LAPTOP");
        expect(result.data.modelMap).toHaveProperty("DELL-XPS");
        expect(result.data.vendorMap).toHaveProperty("DELL");
        expect(result.data.locationMap).toHaveProperty("HQ");
        expect(result.data.stateMap).toHaveProperty("ACTIVE");
        expect(result.data.personEmailMap).toHaveProperty(
          "ahmed.alharbi@barq.com",
          "person-ahmed",
        );
      }
    });

    it("should normalize codes to uppercase", async () => {
      // Arrange
      mockListAssetCategoriesUseCase.execute.mockResolvedValue([
        { id: "cat-1", name: "Category", code: "lowercase" },
      ]);

      // Act
      const result = await getImportLookupMapsAction();

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.categoryMap).toHaveProperty("LOWERCASE");
      }
    });

    it("should return error response on exception", async () => {
      // Arrange
      mockListAssetCategoriesUseCase.execute.mockRejectedValue(
        new Error("Database error"),
      );

      // Act
      const result = await getImportLookupMapsAction();

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Database error");
      }
    });
  });

  describe("checkAssetDuplicatesAction", () => {
    it("should return empty duplicates for new serial numbers", async () => {
      // Arrange
      mockAssetRepository.findBySerialNumbers.mockResolvedValue([]);

      // Act
      const result = await checkAssetDuplicatesAction(["SN-NEW-1", "SN-NEW-2"]);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data?.duplicates).toEqual([]);
        expect(result.data?.duplicateCount).toBe(0);
      }
    });

    it("should return duplicates for existing serial numbers", async () => {
      // Arrange
      const existingAsset = createMockAsset();
      mockAssetRepository.findBySerialNumbers.mockResolvedValue([
        existingAsset,
      ]);

      // Act
      const result = await checkAssetDuplicatesAction(["SN-12345"]);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data?.duplicateCount).toBe(1);
        expect(result.data?.duplicates[0].serialNumber).toBe("SN-12345");
      }
    });

    it("should filter out empty serial numbers", async () => {
      // Arrange
      mockAssetRepository.findBySerialNumbers.mockResolvedValue([]);

      // Act
      await checkAssetDuplicatesAction(["", "  ", "SN-123"]);

      // Assert
      expect(mockAssetRepository.findBySerialNumbers).toHaveBeenCalledWith([
        "SN-123",
      ]);
    });

    it("should return empty result for all empty serial numbers", async () => {
      // Act
      const result = await checkAssetDuplicatesAction(["", "  "]);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data?.duplicates).toEqual([]);
      }
    });

    it("should return error response on exception", async () => {
      // Arrange
      mockAssetRepository.findBySerialNumbers.mockRejectedValue(
        new Error("Database error"),
      );

      // Act
      const result = await checkAssetDuplicatesAction(["SN-123"]);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Database error");
      }
    });
  });

  describe("bulkUpsertAssetsAction", () => {
    it("should create new assets when no duplicates exist", async () => {
      // Arrange
      mockAssetRepository.findBySerialNumbers.mockResolvedValue([]);
      mockCreateAssetUseCase.execute.mockResolvedValue(createMockAsset());

      const assetsData = [
        {
          assetTag: "NEW-001",
          assetCategoryId: "cat-laptop",
          serialNumber: "SN-NEW",
        },
      ];

      // Act
      const result = await bulkUpsertAssetsAction(assetsData, "skip");

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data?.createdCount).toBe(1);
        expect(result.data?.updatedCount).toBe(0);
        expect(result.data?.skipCount).toBe(0);
      }
    });

    it("should skip duplicates with skip strategy", async () => {
      // Arrange
      const existingAsset = createMockAsset({ serialNumber: "SN-EXISTS" });
      mockAssetRepository.findBySerialNumbers.mockResolvedValue([
        existingAsset,
      ]);

      const assetsData = [
        {
          assetTag: "DUP-001",
          assetCategoryId: "cat-laptop",
          serialNumber: "SN-EXISTS",
        },
      ];

      // Act
      const result = await bulkUpsertAssetsAction(assetsData, "skip");

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data?.skipCount).toBe(1);
        expect(result.data?.createdCount).toBe(0);
      }
    });

    it("should update duplicates with overwrite strategy", async () => {
      // Arrange
      const existingAsset = createMockAsset({ serialNumber: "SN-EXISTS" });
      mockAssetRepository.findBySerialNumbers.mockResolvedValue([
        existingAsset,
      ]);
      mockUpdateAssetUseCase.execute.mockResolvedValue(existingAsset);

      const assetsData = [
        {
          assetTag: "UPD-001",
          assetCategoryId: "cat-laptop",
          serialNumber: "SN-EXISTS",
        },
      ];

      // Act
      const result = await bulkUpsertAssetsAction(assetsData, "overwrite");

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data?.updatedCount).toBe(1);
        expect(result.data?.createdCount).toBe(0);
      }
    });

    it("should fail duplicates with fail strategy", async () => {
      // Arrange
      const existingAsset = createMockAsset({ serialNumber: "SN-EXISTS" });
      mockAssetRepository.findBySerialNumbers.mockResolvedValue([
        existingAsset,
      ]);

      const assetsData = [
        {
          assetTag: "FAIL-001",
          assetCategoryId: "cat-laptop",
          serialNumber: "SN-EXISTS",
        },
      ];

      // Act
      const result = await bulkUpsertAssetsAction(assetsData, "fail");

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data?.failureCount).toBe(1);
        expect(result.data?.failures?.[0].error).toContain(
          "Duplicate serial number",
        );
      }
    });

    it("should create with modified serial for append strategy", async () => {
      // Arrange
      const existingAsset = createMockAsset({ serialNumber: "SN-EXISTS" });
      mockAssetRepository.findBySerialNumbers.mockResolvedValue([
        existingAsset,
      ]);
      mockCreateAssetUseCase.execute.mockResolvedValue(
        createMockAsset({ serialNumber: "SN-EXISTS-COPY-123" }),
      );

      const assetsData = [
        {
          assetTag: "APP-001",
          assetCategoryId: "cat-laptop",
          serialNumber: "SN-EXISTS",
        },
      ];

      // Act
      const result = await bulkUpsertAssetsAction(assetsData, "append");

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data?.createdCount).toBe(1);
      }
      expect(mockCreateAssetUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          serialNumber: expect.stringContaining("SN-EXISTS-COPY-"),
        }),
      );
    });

    it("should log bulk upsert progress", async () => {
      // Arrange
      mockAssetRepository.findBySerialNumbers.mockResolvedValue([]);
      mockCreateAssetUseCase.execute.mockResolvedValue(createMockAsset());

      const assetsData = [
        {
          assetTag: "LOG-001",
          assetCategoryId: "cat-laptop",
          serialNumber: "SN-1",
        },
      ];

      // Act
      await bulkUpsertAssetsAction(assetsData, "skip");

      // Assert
      expect(mockLogger.info).toHaveBeenCalledWith("Bulk asset upsert started");
      expect(mockLogger.info).toHaveBeenCalledWith(
        "Bulk asset upsert completed",
        expect.any(Object),
      );
    });

    it("should return error response on exception", async () => {
      // Arrange
      mockAssetRepository.findBySerialNumbers.mockRejectedValue(
        new Error("Database error"),
      );

      const assetsData = [
        {
          assetTag: "ERR-001",
          assetCategoryId: "cat-laptop",
          serialNumber: "SN-1",
        },
      ];

      // Act
      const result = await bulkUpsertAssetsAction(assetsData, "skip");

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Database error");
      }
    });
  });

  describe("error handling", () => {
    it("should handle validation errors gracefully", async () => {
      // Act
      const result = await createAssetAction({
        assetTag: "",
        assetCategoryId: "",
        purchaseCost: null,
      } as CreateAssetDTO);

      // Assert
      expect(result.success).toBe(false);
    });

    it("should handle use case errors", async () => {
      // Arrange
      mockCreateAssetUseCase.execute.mockRejectedValue(
        new Error("Business rule violation"),
      );

      // Act
      const result = await createAssetAction({
        assetTag: "LAPTOP-001",
        assetCategoryId: "cat-laptop",
        purchaseCost: null,
      });

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Business rule violation");
      }
    });
  });

  describe("response format", () => {
    it("should return discriminated union with success=true", async () => {
      // Arrange
      const mockAsset = createMockAsset();
      mockCreateAssetUseCase.execute.mockResolvedValue(mockAsset);

      // Act
      const result = await createAssetAction({
        assetTag: "LAPTOP-001",
        assetCategoryId: "cat-laptop",
        purchaseCost: null,
      });

      // Assert
      expect(result).toHaveProperty("success");
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result).toHaveProperty("data");
        expect(result).not.toHaveProperty("error");
      }
    });

    it("should return discriminated union with success=false for errors", async () => {
      // Arrange
      mockCreateAssetUseCase.execute.mockRejectedValue(new Error("Test error"));

      // Act
      const result = await createAssetAction({
        assetTag: "LAPTOP-001",
        assetCategoryId: "cat-laptop",
        purchaseCost: null,
      });

      // Assert
      expect(result).toHaveProperty("success");
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result).toHaveProperty("error");
        expect(result).not.toHaveProperty("data");
      }
    });
  });
});
