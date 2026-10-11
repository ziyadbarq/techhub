/**
 * GetAssetUseCase - Unit Tests
 *
 * Tests for the GetAssetUseCase including:
 * - Successful asset retrieval
 * - Not found scenarios
 */

import { describe, it, expect, beforeEach } from "vitest";
import { GetAssetUseCase } from "../get-asset.use-case";
import type { IAssetRepository } from "@/core/repositories/asset.repository.interface";
import { Asset } from "@/core/domain/entities/asset.entity";

/**
 * Mock Asset Repository
 */
class MockAssetRepository implements Partial<IAssetRepository> {
  private assets = new Map<string, Asset>();

  constructor() {
    // Pre-populate with test assets
    const asset1 = Asset.reconstitute({
      id: "asset-001",
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
      depreciationModel: "straight-line",
      depreciationStart: new Date("2024-01-15"),
      depreciationEnd: new Date("2029-01-15"),
      condition: "NEW",
      currentStockLocationId: "stock-hq",
      owningOrgUnitId: null,
      attributes: { ram: "16GB", storage: "512GB SSD" },
      note: "Engineering laptop",
      createdAt: new Date("2024-01-15"),
      updatedAt: new Date("2024-01-15"),
    });
    this.assets.set("asset-001", asset1);

    const asset2 = Asset.reconstitute({
      id: "asset-002",
      assetTag: "MONITOR-001",
      assetCategoryId: "cat-monitor",
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
      owningOrgUnitId: null,
      attributes: null,
      note: null,
      createdAt: new Date("2024-02-01"),
      updatedAt: new Date("2024-02-01"),
    });
    this.assets.set("asset-002", asset2);
  }

  async findById(id: string): Promise<Asset | null> {
    return this.assets.get(id) || null;
  }
}

describe("GetAssetUseCase", () => {
  let useCase: GetAssetUseCase;
  let mockRepository: MockAssetRepository;

  beforeEach(() => {
    mockRepository = new MockAssetRepository();
    useCase = new GetAssetUseCase(
      mockRepository as unknown as IAssetRepository,
    );
  });

  describe("execute - successful retrieval", () => {
    it("should return asset when found", async () => {
      const result = await useCase.execute("asset-001");

      expect(result).not.toBeNull();
      expect(result!.id).toBe("asset-001");
      expect(result!.assetTag).toBe("LAPTOP-001");
    });

    it("should return asset with all properties", async () => {
      const result = await useCase.execute("asset-001");

      expect(result).not.toBeNull();
      expect(result!.assetCategoryId).toBe("cat-laptop");
      expect(result!.assetModelId).toBe("model-dell");
      expect(result!.vendorId).toBe("vendor-dell");
      expect(result!.lifecycleStateId).toBe("state-active");
      expect(result!.serialNumber).toBe("SN-12345");
      expect(result!.purchaseCost).toBe(1500);
      expect(result!.purchaseCostSar).toBe(5625);
      expect(result!.currency).toBe("USD");
      expect(result!.condition).toBe("NEW");
      expect(result!.attributes).toEqual({ ram: "16GB", storage: "512GB SSD" });
      expect(result!.note).toBe("Engineering laptop");
    });

    it("should return asset with minimal properties", async () => {
      const result = await useCase.execute("asset-002");

      expect(result).not.toBeNull();
      expect(result!.id).toBe("asset-002");
      expect(result!.assetTag).toBe("MONITOR-001");
      expect(result!.assetModelId).toBeNull();
      expect(result!.vendorId).toBeNull();
      expect(result!.serialNumber).toBeNull();
      expect(result!.purchaseCost).toBeNull();
    });

    it("should return different assets for different IDs", async () => {
      const result1 = await useCase.execute("asset-001");
      const result2 = await useCase.execute("asset-002");

      expect(result1).not.toBeNull();
      expect(result2).not.toBeNull();
      expect(result1!.id).not.toBe(result2!.id);
      expect(result1!.assetTag).not.toBe(result2!.assetTag);
    });
  });

  describe("execute - not found", () => {
    it("should return null when asset not found", async () => {
      const result = await useCase.execute("non-existent-id");

      expect(result).toBeNull();
    });

    it("should return null for empty string ID", async () => {
      const result = await useCase.execute("");

      expect(result).toBeNull();
    });

    it("should return null for whitespace ID", async () => {
      const result = await useCase.execute("   ");

      expect(result).toBeNull();
    });

    it("should return null for similar but different ID", async () => {
      const result = await useCase.execute("asset-003"); // Close to asset-001/002

      expect(result).toBeNull();
    });
  });
});
