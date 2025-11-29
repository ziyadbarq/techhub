/**
 * DeleteAssetUseCase - Unit Tests
 *
 * Tests for the DeleteAssetUseCase including:
 * - Successful asset deletion
 * - Not found errors
 * - Business rule validation (dependency checks)
 */

import { describe, it, expect, beforeEach } from "vitest";
import { DeleteAssetUseCase } from "../delete-asset.use-case";
import type { IAssetRepository } from "@/core/repositories/asset.repository.interface";
import { Asset } from "@/core/domain/entities/asset.entity";

/**
 * Mock Asset Repository
 */
class MockAssetRepository implements Partial<IAssetRepository> {
  private assets = new Map<string, Asset>();
  private assetsWithAssignments = new Set<string>();
  private assetsWithStockMovements = new Set<string>();
  private deletedIds = new Set<string>();

  constructor() {
    // Pre-populate with test assets
    const deletableAsset = Asset.reconstitute({
      id: "asset-deletable",
      assetTag: "DELETABLE-001",
      assetCategoryId: "cat-1",
      assetModelId: null,
      vendorId: null,
      contractId: null,
      lifecycleStateId: null,
      serialNumber: null,
      purchaseDate: null,
      purchaseCost: null,
      purchaseCostSar: null,
      currency: null,
      depreciationModel: null,
      depreciationStart: null,
      depreciationEnd: null,
      condition: null,
      currentStockLocationId: null,
      attributes: null,
      note: null,
      createdAt: new Date("2024-01-01"),
      updatedAt: new Date("2024-01-01"),
    });
    this.assets.set("asset-deletable", deletableAsset);

    // Asset with assignments
    const assetWithAssignments = Asset.reconstitute({
      id: "asset-with-assignments",
      assetTag: "WITH-ASSIGN-001",
      assetCategoryId: "cat-1",
      assetModelId: null,
      vendorId: null,
      contractId: null,
      lifecycleStateId: null,
      serialNumber: null,
      purchaseDate: null,
      purchaseCost: null,
      purchaseCostSar: null,
      currency: null,
      depreciationModel: null,
      depreciationStart: null,
      depreciationEnd: null,
      condition: null,
      currentStockLocationId: null,
      attributes: null,
      note: null,
      createdAt: new Date("2024-01-01"),
      updatedAt: new Date("2024-01-01"),
    });
    this.assets.set("asset-with-assignments", assetWithAssignments);
    this.assetsWithAssignments.add("asset-with-assignments");

    // Asset with stock movements
    const assetWithMovements = Asset.reconstitute({
      id: "asset-with-movements",
      assetTag: "WITH-MOVEMENTS-001",
      assetCategoryId: "cat-1",
      assetModelId: null,
      vendorId: null,
      contractId: null,
      lifecycleStateId: null,
      serialNumber: null,
      purchaseDate: null,
      purchaseCost: null,
      purchaseCostSar: null,
      currency: null,
      depreciationModel: null,
      depreciationStart: null,
      depreciationEnd: null,
      condition: null,
      currentStockLocationId: null,
      attributes: null,
      note: null,
      createdAt: new Date("2024-01-01"),
      updatedAt: new Date("2024-01-01"),
    });
    this.assets.set("asset-with-movements", assetWithMovements);
    this.assetsWithStockMovements.add("asset-with-movements");

    // Asset with both dependencies
    const assetWithBoth = Asset.reconstitute({
      id: "asset-with-both",
      assetTag: "WITH-BOTH-001",
      assetCategoryId: "cat-1",
      assetModelId: null,
      vendorId: null,
      contractId: null,
      lifecycleStateId: null,
      serialNumber: null,
      purchaseDate: null,
      purchaseCost: null,
      purchaseCostSar: null,
      currency: null,
      depreciationModel: null,
      depreciationStart: null,
      depreciationEnd: null,
      condition: null,
      currentStockLocationId: null,
      attributes: null,
      note: null,
      createdAt: new Date("2024-01-01"),
      updatedAt: new Date("2024-01-01"),
    });
    this.assets.set("asset-with-both", assetWithBoth);
    this.assetsWithAssignments.add("asset-with-both");
    this.assetsWithStockMovements.add("asset-with-both");
  }

  async findById(id: string): Promise<Asset | null> {
    return this.assets.get(id) || null;
  }

  async hasAssignments(id: string): Promise<boolean> {
    return this.assetsWithAssignments.has(id);
  }

  async hasStockMovements(id: string): Promise<boolean> {
    return this.assetsWithStockMovements.has(id);
  }

  async delete(id: string): Promise<void> {
    this.assets.delete(id);
    this.deletedIds.add(id);
  }

  // Helper to check if deleted
  wasDeleted(id: string): boolean {
    return this.deletedIds.has(id);
  }
}

describe("DeleteAssetUseCase", () => {
  let useCase: DeleteAssetUseCase;
  let mockRepository: MockAssetRepository;

  beforeEach(() => {
    mockRepository = new MockAssetRepository();
    useCase = new DeleteAssetUseCase(
      mockRepository as unknown as IAssetRepository,
    );
  });

  describe("execute - successful deletion", () => {
    it("should delete an asset without dependencies", async () => {
      await useCase.execute("asset-deletable");

      expect(mockRepository.wasDeleted("asset-deletable")).toBe(true);
    });

    it("should not throw when deleting asset without dependencies", async () => {
      await expect(useCase.execute("asset-deletable")).resolves.not.toThrow();
    });
  });

  describe("execute - not found error", () => {
    it("should throw error when asset not found", async () => {
      await expect(useCase.execute("non-existent-id")).rejects.toThrow(
        'Asset with ID "non-existent-id" not found',
      );
    });

    it("should not delete anything when asset not found", async () => {
      try {
        await useCase.execute("non-existent-id");
      } catch {
        // Expected to throw
      }

      expect(mockRepository.wasDeleted("non-existent-id")).toBe(false);
    });
  });

  describe("execute - business rule validation", () => {
    it("should reject deletion of asset with active assignments", async () => {
      await expect(useCase.execute("asset-with-assignments")).rejects.toThrow(
        /has active assignments/,
      );
    });

    it("should include asset tag in assignment error message", async () => {
      await expect(useCase.execute("asset-with-assignments")).rejects.toThrow(
        "WITH-ASSIGN-001",
      );
    });

    it("should not delete asset with assignments", async () => {
      try {
        await useCase.execute("asset-with-assignments");
      } catch {
        // Expected to throw
      }

      expect(mockRepository.wasDeleted("asset-with-assignments")).toBe(false);
    });

    it("should reject deletion of asset with stock movements", async () => {
      await expect(useCase.execute("asset-with-movements")).rejects.toThrow(
        /stock movement history/,
      );
    });

    it("should include asset tag in stock movements error message", async () => {
      await expect(useCase.execute("asset-with-movements")).rejects.toThrow(
        "WITH-MOVEMENTS-001",
      );
    });

    it("should mention audit purposes in stock movements error", async () => {
      await expect(useCase.execute("asset-with-movements")).rejects.toThrow(
        /audit purposes/,
      );
    });

    it("should not delete asset with stock movements", async () => {
      try {
        await useCase.execute("asset-with-movements");
      } catch {
        // Expected to throw
      }

      expect(mockRepository.wasDeleted("asset-with-movements")).toBe(false);
    });

    it("should check assignments before stock movements", async () => {
      // When asset has both, should mention assignments first (as checked first)
      await expect(useCase.execute("asset-with-both")).rejects.toThrow(
        /assignments/,
      );
    });

    it("should not delete asset with both dependencies", async () => {
      try {
        await useCase.execute("asset-with-both");
      } catch {
        // Expected to throw
      }

      expect(mockRepository.wasDeleted("asset-with-both")).toBe(false);
    });
  });
});
