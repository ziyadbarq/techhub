/**
 * AssetModel Controller - Unit Tests
 *
 * Tests for asset model CRUD server actions including:
 * - Create asset model
 * - Update asset model
 * - Delete asset model
 * - Get single asset model
 * - List asset models
 * - List asset models by category
 * - Bulk create asset models
 * - Check duplicates
 * - Bulk upsert asset models
 * - Error handling
 * - Zod validation
 * - Permission checks
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  createAssetModelAction,
  updateAssetModelAction,
  deleteAssetModelAction,
  getAssetModelAction,
  listAssetModelsAction,
  listAssetModelsByCategoryAction,
  bulkCreateAssetModelsAction,
  checkAssetModelDuplicatesAction,
  bulkUpsertAssetModelsAction,
} from "../asset-model.controller";
import type { AssetModel } from "@/core/domain/entities/asset-model.entity";
import type {
  CreateAssetModelDTO,
  UpdateAssetModelDTO,
} from "../../dtos/generated/asset-model.dto";

// Mock logger service
const mockLogger = {
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  child: vi.fn(() => mockLogger),
};

// Mock use cases
const mockCreateAssetModelUseCase = {
  execute: vi.fn(),
};

const mockUpdateAssetModelUseCase = {
  execute: vi.fn(),
};

const mockDeleteAssetModelUseCase = {
  execute: vi.fn(),
};

const mockGetAssetModelUseCase = {
  execute: vi.fn(),
};

const mockListAssetModelsUseCase = {
  execute: vi.fn(),
};

const mockListAssetCategoriesUseCase = {
  execute: vi.fn(),
};

const mockListVendorsUseCase = {
  execute: vi.fn(),
};

const mockAssetModelRepository = {
  findById: vi.fn(),
  findByCodes: vi.fn(),
};

// Mock requirePermission
vi.mock("@/lib/permissions/server", () => ({
  requirePermission: vi.fn(),
}));

// Mock revalidatePath
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

// Sample asset model data
const createMockAssetModel = (overrides?: Partial<AssetModel>): AssetModel =>
  ({
    id: "model-1",
    name: "Dell XPS 15",
    code: "DELL-XPS-15",
    description: "Premium laptop",
    assetCategoryId: "cat-laptop",
    vendorId: "vendor-dell",
    defaultWarrantyMonths: 36,
    defaultAttributes: { ram: "16GB" },
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
    ...overrides,
  }) as AssetModel;

// Mock the DI container
vi.mock("@/di/container", () => ({
  getContainer: vi.fn(() => ({
    get: vi.fn((token) => {
      const tokenKey = token.toString();
      if (tokenKey === Symbol.for("CreateAssetModelUseCase").toString()) {
        return mockCreateAssetModelUseCase;
      }
      if (tokenKey === Symbol.for("UpdateAssetModelUseCase").toString()) {
        return mockUpdateAssetModelUseCase;
      }
      if (tokenKey === Symbol.for("DeleteAssetModelUseCase").toString()) {
        return mockDeleteAssetModelUseCase;
      }
      if (tokenKey === Symbol.for("GetAssetModelUseCase").toString()) {
        return mockGetAssetModelUseCase;
      }
      if (tokenKey === Symbol.for("ListAssetModelsUseCase").toString()) {
        return mockListAssetModelsUseCase;
      }
      if (tokenKey === Symbol.for("ListAssetCategoriesUseCase").toString()) {
        return mockListAssetCategoriesUseCase;
      }
      if (tokenKey === Symbol.for("ListVendorsUseCase").toString()) {
        return mockListVendorsUseCase;
      }
      if (tokenKey === Symbol.for("IAssetModelRepository").toString()) {
        return mockAssetModelRepository;
      }
      if (tokenKey === Symbol.for("ILoggerService").toString()) {
        return mockLogger;
      }
      return null;
    }),
  })),
}));

describe("AssetModel Controller", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAssetModelRepository.findByCodes.mockResolvedValue([]);

    // Mock related entity lists for enrichment
    mockListAssetCategoriesUseCase.execute.mockResolvedValue([
      { id: "cat-laptop", name: "Laptop", code: "LAPTOP" },
    ]);
    mockListVendorsUseCase.execute.mockResolvedValue([
      { id: "vendor-dell", name: "Dell Technologies", code: "DELL" },
    ]);
  });

  describe("createAssetModelAction", () => {
    it("should create a new asset model successfully", async () => {
      // Arrange
      const mockModel = createMockAssetModel();
      mockCreateAssetModelUseCase.execute.mockResolvedValue(mockModel);

      const data: CreateAssetModelDTO = {
        name: "Dell XPS 15",
        code: "DELL-XPS-15",
        assetCategoryId: "cat-laptop",
        vendorId: "vendor-dell",
      };

      // Act
      const result = await createAssetModelAction(data);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe("model-1");
        expect(result.data.name).toBe("Dell XPS 15");
        expect(result.data.code).toBe("DELL-XPS-15");
      }
    });

    it("should call use case with validated data", async () => {
      // Arrange
      const mockModel = createMockAssetModel();
      mockCreateAssetModelUseCase.execute.mockResolvedValue(mockModel);

      const data: CreateAssetModelDTO = {
        name: "HP EliteBook",
        code: "HP-ELITE",
        description: "Business laptop",
        assetCategoryId: "cat-laptop",
        vendorId: "vendor-hp",
        defaultWarrantyMonths: 24,
        defaultAttributes: { ram: "8GB" },
      };

      // Act
      await createAssetModelAction(data);

      // Assert
      expect(mockCreateAssetModelUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "HP EliteBook",
          code: "HP-ELITE",
          description: "Business laptop",
          assetCategoryId: "cat-laptop",
          vendorId: "vendor-hp",
          defaultWarrantyMonths: 24,
          defaultAttributes: { ram: "8GB" },
        }),
      );
    });

    it("should return error response on validation failure", async () => {
      // Arrange - missing required assetCategoryId
      const data = {
        name: "Model",
        code: "CODE",
      } as CreateAssetModelDTO;

      // Act
      const result = await createAssetModelAction(data);

      // Assert
      expect(result.success).toBe(false);
    });

    it("should return error response on use case error", async () => {
      // Arrange
      mockCreateAssetModelUseCase.execute.mockRejectedValue(
        new Error("Model code already exists"),
      );

      const data: CreateAssetModelDTO = {
        name: "Dell XPS",
        code: "DELL-XPS",
        assetCategoryId: "cat-laptop",
        vendorId: "vendor-dell",
      };

      // Act
      const result = await createAssetModelAction(data);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Model code already exists");
      }
    });
  });

  describe("listAssetModelsAction", () => {
    it("should list all asset models", async () => {
      // Arrange
      const mockModels = [
        createMockAssetModel(),
        createMockAssetModel({
          id: "model-2",
          name: "HP EliteBook",
          code: "HP-ELITE",
        }),
      ];
      mockListAssetModelsUseCase.execute.mockResolvedValue(mockModels);

      // Act
      const result = await listAssetModelsAction();

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(2);
      }
    });

    it("should handle empty result", async () => {
      // Arrange
      mockListAssetModelsUseCase.execute.mockResolvedValue([]);

      // Act
      const result = await listAssetModelsAction();

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual([]);
      }
    });

    it("should enrich models with related entity names", async () => {
      // Arrange
      const mockModels = [createMockAssetModel()];
      mockListAssetModelsUseCase.execute.mockResolvedValue(mockModels);

      // Act
      const result = await listAssetModelsAction();

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data[0].categoryName).toBe("Laptop");
        expect(result.data[0].vendorName).toBe("Dell Technologies");
      }
    });

    it("should return error response on exception", async () => {
      // Arrange
      mockListAssetModelsUseCase.execute.mockRejectedValue(
        new Error("Database error"),
      );

      // Act
      const result = await listAssetModelsAction();

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Database error");
      }
    });
  });

  describe("listAssetModelsByCategoryAction", () => {
    it("should list asset models by category", async () => {
      // Arrange
      const mockModels = [createMockAssetModel()];
      mockListAssetModelsUseCase.execute.mockResolvedValue(mockModels);

      // Act
      const result = await listAssetModelsByCategoryAction("cat-laptop");

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(1);
      }
    });

    it("should pass category ID to use case", async () => {
      // Arrange
      mockListAssetModelsUseCase.execute.mockResolvedValue([]);

      // Act
      await listAssetModelsByCategoryAction("cat-laptop");

      // Assert
      expect(mockListAssetModelsUseCase.execute).toHaveBeenCalledWith({
        assetCategoryId: "cat-laptop",
      });
    });

    it("should return error response on exception", async () => {
      // Arrange
      mockListAssetModelsUseCase.execute.mockRejectedValue(
        new Error("Database error"),
      );

      // Act
      const result = await listAssetModelsByCategoryAction("cat-laptop");

      // Assert
      expect(result.success).toBe(false);
    });
  });

  describe("getAssetModelAction", () => {
    it("should get asset model by id", async () => {
      // Arrange
      const mockModel = createMockAssetModel();
      mockGetAssetModelUseCase.execute.mockResolvedValue(mockModel);

      // Act
      const result = await getAssetModelAction("model-1");

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe("model-1");
        expect(result.data.name).toBe("Dell XPS 15");
      }
    });

    it("should call use case with validated id", async () => {
      // Arrange
      const mockModel = createMockAssetModel();
      mockGetAssetModelUseCase.execute.mockResolvedValue(mockModel);

      // Act
      await getAssetModelAction("model-1");

      // Assert
      expect(mockGetAssetModelUseCase.execute).toHaveBeenCalledWith("model-1");
    });

    it("should return error when model not found", async () => {
      // Arrange
      mockGetAssetModelUseCase.execute.mockResolvedValue(null);

      // Act
      const result = await getAssetModelAction("nonexistent");

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Asset model not found");
      }
    });

    it("should return error response on exception", async () => {
      // Arrange
      mockGetAssetModelUseCase.execute.mockRejectedValue(
        new Error("Database error"),
      );

      // Act
      const result = await getAssetModelAction("model-1");

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Database error");
      }
    });
  });

  describe("updateAssetModelAction", () => {
    it("should update asset model successfully", async () => {
      // Arrange
      const updatedModel = createMockAssetModel({ name: "Updated Model" });
      mockUpdateAssetModelUseCase.execute.mockResolvedValue(updatedModel);

      const data: UpdateAssetModelDTO = {
        name: "Updated Model",
      };

      // Act
      const result = await updateAssetModelAction("model-1", data);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe("Updated Model");
      }
    });

    it("should call use case with id and validated data", async () => {
      // Arrange
      const updatedModel = createMockAssetModel();
      mockUpdateAssetModelUseCase.execute.mockResolvedValue(updatedModel);

      const data: UpdateAssetModelDTO = {
        name: "New Name",
        description: "New description",
        defaultWarrantyMonths: 48,
      };

      // Act
      await updateAssetModelAction("model-1", data);

      // Assert
      expect(mockUpdateAssetModelUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          id: "model-1",
          name: "New Name",
          description: "New description",
          defaultWarrantyMonths: 48,
        }),
      );
    });

    it("should return error response on use case error", async () => {
      // Arrange
      mockUpdateAssetModelUseCase.execute.mockRejectedValue(
        new Error("Model not found"),
      );

      const data: UpdateAssetModelDTO = {
        name: "Updated",
      };

      // Act
      const result = await updateAssetModelAction("model-1", data);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Model not found");
      }
    });
  });

  describe("deleteAssetModelAction", () => {
    it("should delete asset model successfully", async () => {
      // Arrange
      mockDeleteAssetModelUseCase.execute.mockResolvedValue(undefined);

      // Act
      const result = await deleteAssetModelAction("model-1");

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBeUndefined();
      }
    });

    it("should call use case with validated id", async () => {
      // Arrange
      mockDeleteAssetModelUseCase.execute.mockResolvedValue(undefined);

      // Act
      await deleteAssetModelAction("model-1");

      // Assert
      expect(mockDeleteAssetModelUseCase.execute).toHaveBeenCalledWith(
        "model-1",
      );
    });

    it("should return error response on use case error", async () => {
      // Arrange
      mockDeleteAssetModelUseCase.execute.mockRejectedValue(
        new Error("Model has associated assets"),
      );

      // Act
      const result = await deleteAssetModelAction("model-1");

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Model has associated assets");
      }
    });
  });

  describe("bulkCreateAssetModelsAction", () => {
    it("should bulk create asset models successfully", async () => {
      // Arrange
      const mockModel = createMockAssetModel();
      mockCreateAssetModelUseCase.execute.mockResolvedValue(mockModel);

      const modelsData: CreateAssetModelDTO[] = [
        {
          name: "Model 1",
          code: "M1",
          assetCategoryId: "cat-1",
          vendorId: "vendor-1",
        },
        {
          name: "Model 2",
          code: "M2",
          assetCategoryId: "cat-1",
          vendorId: "vendor-1",
        },
      ];

      // Act
      const result = await bulkCreateAssetModelsAction(modelsData);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.successCount).toBe(2);
        expect(result.data.failureCount).toBe(0);
      }
    });

    it("should track failures", async () => {
      // Arrange
      mockCreateAssetModelUseCase.execute
        .mockResolvedValueOnce(createMockAssetModel())
        .mockRejectedValueOnce(new Error("Duplicate code"));

      const modelsData: CreateAssetModelDTO[] = [
        {
          name: "Model 1",
          code: "M1",
          assetCategoryId: "cat-1",
          vendorId: "vendor-1",
        },
        {
          name: "Model 2",
          code: "M1",
          assetCategoryId: "cat-1",
          vendorId: "vendor-1",
        },
      ];

      // Act
      const result = await bulkCreateAssetModelsAction(modelsData);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.successCount).toBe(1);
        expect(result.data.failureCount).toBe(1);
        expect(result.data.failures).toHaveLength(1);
        expect(result.data.failures[0].error).toBe("Duplicate code");
      }
    });

    it("should handle validation failures in bulk", async () => {
      // Arrange
      const modelsData = [
        { name: "Model", code: "CODE" }, // Missing assetCategoryId
      ] as CreateAssetModelDTO[];

      // Act
      const result = await bulkCreateAssetModelsAction(modelsData);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.failureCount).toBe(1);
      }
    });
  });

  describe("checkAssetModelDuplicatesAction", () => {
    it("should return empty duplicates for new codes", async () => {
      // Arrange
      mockAssetModelRepository.findByCodes.mockResolvedValue([]);

      // Act
      const result = await checkAssetModelDuplicatesAction(["NEW-1", "NEW-2"]);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data?.duplicates).toEqual([]);
        expect(result.data?.duplicateCount).toBe(0);
      }
    });

    it("should return duplicates for existing codes", async () => {
      // Arrange
      const existingModel = createMockAssetModel();
      mockAssetModelRepository.findByCodes.mockResolvedValue([existingModel]);

      // Act
      const result = await checkAssetModelDuplicatesAction(["DELL-XPS-15"]);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data?.duplicateCount).toBe(1);
        expect(result.data?.duplicates[0].code).toBe("DELL-XPS-15");
      }
    });

    it("should filter out empty codes", async () => {
      // Arrange
      mockAssetModelRepository.findByCodes.mockResolvedValue([]);

      // Act
      await checkAssetModelDuplicatesAction(["", "  ", "DELL-XPS"]);

      // Assert
      expect(mockAssetModelRepository.findByCodes).toHaveBeenCalledWith([
        "DELL-XPS",
      ]);
    });

    it("should return empty result for all empty codes", async () => {
      // Act
      const result = await checkAssetModelDuplicatesAction(["", "  "]);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data?.duplicates).toEqual([]);
      }
    });

    it("should return error response on exception", async () => {
      // Arrange
      mockAssetModelRepository.findByCodes.mockRejectedValue(
        new Error("Database error"),
      );

      // Act
      const result = await checkAssetModelDuplicatesAction(["CODE"]);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe("Database error");
    });
  });

  describe("bulkUpsertAssetModelsAction", () => {
    it("should create new models when no duplicates exist", async () => {
      // Arrange
      mockAssetModelRepository.findByCodes.mockResolvedValue([]);
      mockCreateAssetModelUseCase.execute.mockResolvedValue(
        createMockAssetModel(),
      );

      const modelsData = [
        {
          name: "New Model",
          code: "NEW",
          assetCategoryId: "cat-1",
          vendorId: "vendor-1",
        },
      ];

      // Act
      const result = await bulkUpsertAssetModelsAction(modelsData, "skip");

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
      const existingModel = createMockAssetModel({ code: "EXISTS" });
      mockAssetModelRepository.findByCodes.mockResolvedValue([existingModel]);

      const modelsData = [
        {
          name: "Existing",
          code: "EXISTS",
          assetCategoryId: "cat-1",
          vendorId: "vendor-1",
        },
      ];

      // Act
      const result = await bulkUpsertAssetModelsAction(modelsData, "skip");

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data?.skipCount).toBe(1);
        expect(result.data?.createdCount).toBe(0);
      }
    });

    it("should update duplicates with overwrite strategy", async () => {
      // Arrange
      const existingModel = createMockAssetModel({ code: "EXISTS" });
      mockAssetModelRepository.findByCodes.mockResolvedValue([existingModel]);
      mockUpdateAssetModelUseCase.execute.mockResolvedValue(existingModel);

      const modelsData = [
        {
          name: "Updated",
          code: "EXISTS",
          assetCategoryId: "cat-1",
          vendorId: "vendor-1",
        },
      ];

      // Act
      const result = await bulkUpsertAssetModelsAction(modelsData, "overwrite");

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data?.updatedCount).toBe(1);
        expect(result.data?.createdCount).toBe(0);
      }
    });

    it("should fail duplicates with fail strategy", async () => {
      // Arrange
      const existingModel = createMockAssetModel({ code: "EXISTS" });
      mockAssetModelRepository.findByCodes.mockResolvedValue([existingModel]);

      const modelsData = [
        {
          name: "Duplicate",
          code: "EXISTS",
          assetCategoryId: "cat-1",
          vendorId: "vendor-1",
        },
      ];

      // Act
      const result = await bulkUpsertAssetModelsAction(modelsData, "fail");

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data?.failureCount).toBe(1);
        expect(result.data?.failures?.[0].error).toContain("Duplicate code");
      }
    });

    it("should create with modified code for append strategy", async () => {
      // Arrange
      const existingModel = createMockAssetModel({ code: "EXISTS" });
      mockAssetModelRepository.findByCodes.mockResolvedValue([existingModel]);
      mockCreateAssetModelUseCase.execute.mockResolvedValue(
        createMockAssetModel({ code: "EXISTS-COPY-123" }),
      );

      const modelsData = [
        {
          name: "Appended",
          code: "EXISTS",
          assetCategoryId: "cat-1",
          vendorId: "vendor-1",
        },
      ];

      // Act
      const result = await bulkUpsertAssetModelsAction(modelsData, "append");

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data?.createdCount).toBe(1);
      }
      expect(mockCreateAssetModelUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          code: expect.stringContaining("EXISTS-COPY-"),
        }),
      );
    });

    it("should log bulk upsert progress", async () => {
      // Arrange
      mockAssetModelRepository.findByCodes.mockResolvedValue([]);
      mockCreateAssetModelUseCase.execute.mockResolvedValue(
        createMockAssetModel(),
      );

      const modelsData = [
        {
          name: "Log Test",
          code: "LOG",
          assetCategoryId: "cat-1",
          vendorId: "vendor-1",
        },
      ];

      // Act
      await bulkUpsertAssetModelsAction(modelsData, "skip");

      // Assert
      expect(mockLogger.info).toHaveBeenCalledWith(
        "Bulk asset model upsert started",
      );
      expect(mockLogger.info).toHaveBeenCalledWith(
        "Bulk asset model upsert completed",
        expect.any(Object),
      );
    });

    it("should return error response on exception", async () => {
      // Arrange
      mockAssetModelRepository.findByCodes.mockRejectedValue(
        new Error("Database error"),
      );

      const modelsData = [
        {
          name: "Error Test",
          code: "ERR",
          assetCategoryId: "cat-1",
          vendorId: "vendor-1",
        },
      ];

      // Act
      const result = await bulkUpsertAssetModelsAction(modelsData, "skip");

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe("Database error");
    });
  });

  describe("error handling", () => {
    it("should handle validation errors gracefully", async () => {
      // Act
      const result = await createAssetModelAction({
        name: "",
        code: "",
        assetCategoryId: "",
        vendorId: "",
      } as CreateAssetModelDTO);

      // Assert
      expect(result.success).toBe(false);
    });

    it("should handle use case errors", async () => {
      // Arrange
      mockCreateAssetModelUseCase.execute.mockRejectedValue(
        new Error("Business rule violation"),
      );

      // Act
      const result = await createAssetModelAction({
        name: "Test",
        code: "TEST",
        assetCategoryId: "cat-1",
        vendorId: "vendor-1",
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
      const mockModel = createMockAssetModel();
      mockCreateAssetModelUseCase.execute.mockResolvedValue(mockModel);

      // Act
      const result = await createAssetModelAction({
        name: "Model",
        code: "MODEL",
        assetCategoryId: "cat-1",
        vendorId: "vendor-1",
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
      mockCreateAssetModelUseCase.execute.mockRejectedValue(
        new Error("Test error"),
      );

      // Act
      const result = await createAssetModelAction({
        name: "Model",
        code: "MODEL",
        assetCategoryId: "cat-1",
        vendorId: "vendor-1",
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
