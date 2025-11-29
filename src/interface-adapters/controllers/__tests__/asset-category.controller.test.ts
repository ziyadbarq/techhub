/**
 * AssetCategory Controller - Unit Tests
 *
 * Tests for asset category CRUD server actions including:
 * - Create asset category
 * - Update asset category
 * - Delete asset category
 * - Get single asset category
 * - List asset categories
 * - Bulk create asset categories
 * - Check duplicates
 * - Bulk upsert asset categories
 * - Error handling
 * - Zod validation
 * - Permission checks
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  createAssetCategoryAction,
  updateAssetCategoryAction,
  deleteAssetCategoryAction,
  getAssetCategoryAction,
  listAssetCategoriesAction,
  bulkCreateAssetCategoriesAction,
  checkAssetCategoryDuplicatesAction,
  bulkUpsertAssetCategoriesAction,
} from "../asset-category.controller";
import type { AssetCategory } from "@/core/domain/entities/asset-category.entity";
import type {
  CreateAssetCategoryDTO,
  UpdateAssetCategoryDTO,
} from "../../dtos/generated/asset-category.dto";

// Mock logger service
const mockLogger = {
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  child: vi.fn(() => mockLogger),
};

// Mock use cases
const mockCreateAssetCategoryUseCase = {
  execute: vi.fn(),
};

const mockUpdateAssetCategoryUseCase = {
  execute: vi.fn(),
};

const mockDeleteAssetCategoryUseCase = {
  execute: vi.fn(),
};

const mockGetAssetCategoryUseCase = {
  execute: vi.fn(),
};

const mockListAssetCategoriesUseCase = {
  execute: vi.fn(),
};

const mockAssetCategoryRepository = {
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

// Sample asset category data
const createMockAssetCategory = (
  overrides?: Partial<AssetCategory>,
): AssetCategory =>
  ({
    id: "cat-1",
    name: "Laptop",
    code: "LAPTOP",
    description: "Portable computers",
    lifecycleModelId: "lifecycle-1",
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
    ...overrides,
  }) as AssetCategory;

// Mock the DI container
vi.mock("@/di/container", () => ({
  getContainer: vi.fn(() => ({
    get: vi.fn((token) => {
      const tokenKey = token.toString();
      if (tokenKey === Symbol.for("CreateAssetCategoryUseCase").toString()) {
        return mockCreateAssetCategoryUseCase;
      }
      if (tokenKey === Symbol.for("UpdateAssetCategoryUseCase").toString()) {
        return mockUpdateAssetCategoryUseCase;
      }
      if (tokenKey === Symbol.for("DeleteAssetCategoryUseCase").toString()) {
        return mockDeleteAssetCategoryUseCase;
      }
      if (tokenKey === Symbol.for("GetAssetCategoryUseCase").toString()) {
        return mockGetAssetCategoryUseCase;
      }
      if (tokenKey === Symbol.for("ListAssetCategoriesUseCase").toString()) {
        return mockListAssetCategoriesUseCase;
      }
      if (tokenKey === Symbol.for("IAssetCategoryRepository").toString()) {
        return mockAssetCategoryRepository;
      }
      if (tokenKey === Symbol.for("ILoggerService").toString()) {
        return mockLogger;
      }
      return null;
    }),
  })),
}));

describe("AssetCategory Controller", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAssetCategoryRepository.findByCodes.mockResolvedValue([]);
  });

  describe("createAssetCategoryAction", () => {
    it("should create a new asset category successfully", async () => {
      // Arrange
      const mockCategory = createMockAssetCategory();
      mockCreateAssetCategoryUseCase.execute.mockResolvedValue(mockCategory);

      const data: CreateAssetCategoryDTO = {
        name: "Laptop",
        code: "LAPTOP",
        description: "Portable computers",
      };

      // Act
      const result = await createAssetCategoryAction(data);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe("cat-1");
        expect(result.data.name).toBe("Laptop");
        expect(result.data.code).toBe("LAPTOP");
      }
    });

    it("should call use case with validated data", async () => {
      // Arrange
      const mockCategory = createMockAssetCategory();
      mockCreateAssetCategoryUseCase.execute.mockResolvedValue(mockCategory);

      const data: CreateAssetCategoryDTO = {
        name: "Monitor",
        code: "MONITOR",
        description: "Display screens",
        lifecycleModelId: "lifecycle-1",
      };

      // Act
      await createAssetCategoryAction(data);

      // Assert
      expect(mockCreateAssetCategoryUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Monitor",
          code: "MONITOR",
          description: "Display screens",
          lifecycleModelId: "lifecycle-1",
        }),
      );
    });

    it("should return error response on validation failure", async () => {
      // Arrange - name is required
      const data = {
        code: "LAPTOP",
      } as CreateAssetCategoryDTO;

      // Act
      const result = await createAssetCategoryAction(data);

      // Assert
      expect(result.success).toBe(false);
    });

    it("should return error response on use case error", async () => {
      // Arrange
      mockCreateAssetCategoryUseCase.execute.mockRejectedValue(
        new Error("Category code already exists"),
      );

      const data: CreateAssetCategoryDTO = {
        name: "Laptop",
        code: "LAPTOP",
      };

      // Act
      const result = await createAssetCategoryAction(data);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Category code already exists");
      }
    });
  });

  describe("listAssetCategoriesAction", () => {
    it("should list all asset categories", async () => {
      // Arrange
      const mockCategories = [
        createMockAssetCategory(),
        createMockAssetCategory({
          id: "cat-2",
          name: "Monitor",
          code: "MONITOR",
        }),
      ];
      mockListAssetCategoriesUseCase.execute.mockResolvedValue(mockCategories);

      // Act
      const result = await listAssetCategoriesAction();

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(2);
      }
    });

    it("should handle empty result", async () => {
      // Arrange
      mockListAssetCategoriesUseCase.execute.mockResolvedValue([]);

      // Act
      const result = await listAssetCategoriesAction();

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual([]);
      }
    });

    it("should return error response on exception", async () => {
      // Arrange
      mockListAssetCategoriesUseCase.execute.mockRejectedValue(
        new Error("Database error"),
      );

      // Act
      const result = await listAssetCategoriesAction();

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Database error");
      }
    });
  });

  describe("getAssetCategoryAction", () => {
    it("should get asset category by id", async () => {
      // Arrange
      const mockCategory = createMockAssetCategory();
      mockGetAssetCategoryUseCase.execute.mockResolvedValue(mockCategory);

      // Act
      const result = await getAssetCategoryAction("cat-1");

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe("cat-1");
        expect(result.data.name).toBe("Laptop");
      }
    });

    it("should call use case with validated id", async () => {
      // Arrange
      const mockCategory = createMockAssetCategory();
      mockGetAssetCategoryUseCase.execute.mockResolvedValue(mockCategory);

      // Act
      await getAssetCategoryAction("cat-1");

      // Assert
      expect(mockGetAssetCategoryUseCase.execute).toHaveBeenCalledWith("cat-1");
    });

    it("should return error when category not found", async () => {
      // Arrange
      mockGetAssetCategoryUseCase.execute.mockResolvedValue(null);

      // Act
      const result = await getAssetCategoryAction("nonexistent");

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Asset category not found");
      }
    });

    it("should return error response on exception", async () => {
      // Arrange
      mockGetAssetCategoryUseCase.execute.mockRejectedValue(
        new Error("Database error"),
      );

      // Act
      const result = await getAssetCategoryAction("cat-1");

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Database error");
      }
    });
  });

  describe("updateAssetCategoryAction", () => {
    it("should update asset category successfully", async () => {
      // Arrange
      const updatedCategory = createMockAssetCategory({
        name: "Updated Laptop",
      });
      mockUpdateAssetCategoryUseCase.execute.mockResolvedValue(updatedCategory);

      const data: UpdateAssetCategoryDTO = {
        name: "Updated Laptop",
      };

      // Act
      const result = await updateAssetCategoryAction("cat-1", data);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe("Updated Laptop");
      }
    });

    it("should call use case with id and validated data", async () => {
      // Arrange
      const updatedCategory = createMockAssetCategory();
      mockUpdateAssetCategoryUseCase.execute.mockResolvedValue(updatedCategory);

      const data: UpdateAssetCategoryDTO = {
        name: "New Name",
        description: "New description",
      };

      // Act
      await updateAssetCategoryAction("cat-1", data);

      // Assert
      expect(mockUpdateAssetCategoryUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          id: "cat-1",
          name: "New Name",
          description: "New description",
        }),
      );
    });

    it("should return error response on use case error", async () => {
      // Arrange
      mockUpdateAssetCategoryUseCase.execute.mockRejectedValue(
        new Error("Category not found"),
      );

      const data: UpdateAssetCategoryDTO = {
        name: "Updated",
      };

      // Act
      const result = await updateAssetCategoryAction("cat-1", data);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Category not found");
      }
    });
  });

  describe("deleteAssetCategoryAction", () => {
    it("should delete asset category successfully", async () => {
      // Arrange
      mockDeleteAssetCategoryUseCase.execute.mockResolvedValue(undefined);

      // Act
      const result = await deleteAssetCategoryAction("cat-1");

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBeUndefined();
      }
    });

    it("should call use case with validated id", async () => {
      // Arrange
      mockDeleteAssetCategoryUseCase.execute.mockResolvedValue(undefined);

      // Act
      await deleteAssetCategoryAction("cat-1");

      // Assert
      expect(mockDeleteAssetCategoryUseCase.execute).toHaveBeenCalledWith(
        "cat-1",
      );
    });

    it("should return error response on use case error", async () => {
      // Arrange
      mockDeleteAssetCategoryUseCase.execute.mockRejectedValue(
        new Error("Category has associated assets"),
      );

      // Act
      const result = await deleteAssetCategoryAction("cat-1");

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Category has associated assets");
      }
    });
  });

  describe("bulkCreateAssetCategoriesAction", () => {
    it("should bulk create asset categories successfully", async () => {
      // Arrange
      const mockCategory = createMockAssetCategory();
      mockCreateAssetCategoryUseCase.execute.mockResolvedValue(mockCategory);

      const categoriesData: CreateAssetCategoryDTO[] = [
        { name: "Laptop", code: "LAPTOP" },
        { name: "Monitor", code: "MONITOR" },
      ];

      // Act
      const result = await bulkCreateAssetCategoriesAction(categoriesData);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.successCount).toBe(2);
        expect(result.data.failureCount).toBe(0);
      }
    });

    it("should track failures", async () => {
      // Arrange
      mockCreateAssetCategoryUseCase.execute
        .mockResolvedValueOnce(createMockAssetCategory())
        .mockRejectedValueOnce(new Error("Duplicate code"));

      const categoriesData: CreateAssetCategoryDTO[] = [
        { name: "Laptop", code: "LAPTOP" },
        { name: "Laptop 2", code: "LAPTOP" },
      ];

      // Act
      const result = await bulkCreateAssetCategoriesAction(categoriesData);

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
      const categoriesData = [
        { code: "LAPTOP" }, // Missing name
      ] as CreateAssetCategoryDTO[];

      // Act
      const result = await bulkCreateAssetCategoriesAction(categoriesData);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.failureCount).toBe(1);
      }
    });
  });

  describe("checkAssetCategoryDuplicatesAction", () => {
    it("should return empty duplicates for new codes", async () => {
      // Arrange
      mockAssetCategoryRepository.findByCodes.mockResolvedValue([]);

      // Act
      const result = await checkAssetCategoryDuplicatesAction([
        "NEW-1",
        "NEW-2",
      ]);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data?.duplicates).toEqual([]);
        expect(result.data?.duplicateCount).toBe(0);
      }
    });

    it("should return duplicates for existing codes", async () => {
      // Arrange
      const existingCategory = createMockAssetCategory();
      mockAssetCategoryRepository.findByCodes.mockResolvedValue([
        existingCategory,
      ]);

      // Act
      const result = await checkAssetCategoryDuplicatesAction(["LAPTOP"]);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data?.duplicateCount).toBe(1);
        expect(result.data?.duplicates[0].code).toBe("LAPTOP");
      }
    });

    it("should filter out empty codes", async () => {
      // Arrange
      mockAssetCategoryRepository.findByCodes.mockResolvedValue([]);

      // Act
      await checkAssetCategoryDuplicatesAction(["", "  ", "LAPTOP"]);

      // Assert
      expect(mockAssetCategoryRepository.findByCodes).toHaveBeenCalledWith([
        "LAPTOP",
      ]);
    });

    it("should return empty result for all empty codes", async () => {
      // Act
      const result = await checkAssetCategoryDuplicatesAction(["", "  "]);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data?.duplicates).toEqual([]);
      }
    });

    it("should return error response on exception", async () => {
      // Arrange
      mockAssetCategoryRepository.findByCodes.mockRejectedValue(
        new Error("Database error"),
      );

      // Act
      const result = await checkAssetCategoryDuplicatesAction(["LAPTOP"]);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe("Database error");
    });
  });

  describe("bulkUpsertAssetCategoriesAction", () => {
    it("should create new categories when no duplicates exist", async () => {
      // Arrange
      mockAssetCategoryRepository.findByCodes.mockResolvedValue([]);
      mockCreateAssetCategoryUseCase.execute.mockResolvedValue(
        createMockAssetCategory(),
      );

      const categoriesData = [{ name: "New Category", code: "NEW" }];

      // Act
      const result = await bulkUpsertAssetCategoriesAction(
        categoriesData,
        "skip",
      );

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
      const existingCategory = createMockAssetCategory({ code: "EXISTS" });
      mockAssetCategoryRepository.findByCodes.mockResolvedValue([
        existingCategory,
      ]);

      const categoriesData = [{ name: "Existing", code: "EXISTS" }];

      // Act
      const result = await bulkUpsertAssetCategoriesAction(
        categoriesData,
        "skip",
      );

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data?.skipCount).toBe(1);
        expect(result.data?.createdCount).toBe(0);
      }
    });

    it("should update duplicates with overwrite strategy", async () => {
      // Arrange
      const existingCategory = createMockAssetCategory({ code: "EXISTS" });
      mockAssetCategoryRepository.findByCodes.mockResolvedValue([
        existingCategory,
      ]);
      mockUpdateAssetCategoryUseCase.execute.mockResolvedValue(
        existingCategory,
      );

      const categoriesData = [{ name: "Updated", code: "EXISTS" }];

      // Act
      const result = await bulkUpsertAssetCategoriesAction(
        categoriesData,
        "overwrite",
      );

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data?.updatedCount).toBe(1);
        expect(result.data?.createdCount).toBe(0);
      }
    });

    it("should fail duplicates with fail strategy", async () => {
      // Arrange
      const existingCategory = createMockAssetCategory({ code: "EXISTS" });
      mockAssetCategoryRepository.findByCodes.mockResolvedValue([
        existingCategory,
      ]);

      const categoriesData = [{ name: "Duplicate", code: "EXISTS" }];

      // Act
      const result = await bulkUpsertAssetCategoriesAction(
        categoriesData,
        "fail",
      );

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data?.failureCount).toBe(1);
        expect(result.data?.failures?.[0].error).toContain("Duplicate code");
      }
    });

    it("should create with modified code for append strategy", async () => {
      // Arrange
      const existingCategory = createMockAssetCategory({ code: "EXISTS" });
      mockAssetCategoryRepository.findByCodes.mockResolvedValue([
        existingCategory,
      ]);
      mockCreateAssetCategoryUseCase.execute.mockResolvedValue(
        createMockAssetCategory({ code: "EXISTS-COPY-123" }),
      );

      const categoriesData = [{ name: "Appended", code: "EXISTS" }];

      // Act
      const result = await bulkUpsertAssetCategoriesAction(
        categoriesData,
        "append",
      );

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data?.createdCount).toBe(1);
      }
      expect(mockCreateAssetCategoryUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          code: expect.stringContaining("EXISTS-COPY-"),
        }),
      );
    });

    it("should log bulk upsert progress", async () => {
      // Arrange
      mockAssetCategoryRepository.findByCodes.mockResolvedValue([]);
      mockCreateAssetCategoryUseCase.execute.mockResolvedValue(
        createMockAssetCategory(),
      );

      const categoriesData = [{ name: "Log Test", code: "LOG" }];

      // Act
      await bulkUpsertAssetCategoriesAction(categoriesData, "skip");

      // Assert
      expect(mockLogger.info).toHaveBeenCalledWith(
        "Bulk asset category upsert started",
      );
      expect(mockLogger.info).toHaveBeenCalledWith(
        "Bulk asset category upsert completed",
        expect.any(Object),
      );
    });

    it("should return error response on exception", async () => {
      // Arrange
      mockAssetCategoryRepository.findByCodes.mockRejectedValue(
        new Error("Database error"),
      );

      const categoriesData = [{ name: "Error Test", code: "ERR" }];

      // Act
      const result = await bulkUpsertAssetCategoriesAction(
        categoriesData,
        "skip",
      );

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe("Database error");
    });
  });

  describe("error handling", () => {
    it("should handle validation errors gracefully", async () => {
      // Act
      const result = await createAssetCategoryAction({
        name: "",
        code: "",
      } as CreateAssetCategoryDTO);

      // Assert
      expect(result.success).toBe(false);
    });

    it("should handle use case errors", async () => {
      // Arrange
      mockCreateAssetCategoryUseCase.execute.mockRejectedValue(
        new Error("Business rule violation"),
      );

      // Act
      const result = await createAssetCategoryAction({
        name: "Test",
        code: "TEST",
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
      const mockCategory = createMockAssetCategory();
      mockCreateAssetCategoryUseCase.execute.mockResolvedValue(mockCategory);

      // Act
      const result = await createAssetCategoryAction({
        name: "Laptop",
        code: "LAPTOP",
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
      mockCreateAssetCategoryUseCase.execute.mockRejectedValue(
        new Error("Test error"),
      );

      // Act
      const result = await createAssetCategoryAction({
        name: "Laptop",
        code: "LAPTOP",
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
