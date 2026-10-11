/**
 * ListAssetsUseCase - Unit Tests
 *
 * Tests for the ListAssetsUseCase including:
 * - List all assets
 * - Search with various filters
 * - Empty results
 */

import { describe, it, expect, beforeEach } from "vitest";
import { ListAssetsUseCase } from "../list-assets.use-case";
import type {
  IAssetRepository,
  AssetSearchOptions,
} from "@/core/repositories/asset.repository.interface";
import { Asset } from "@/core/domain/entities/asset.entity";

/**
 * Mock Asset Repository
 */
class MockAssetRepository implements Partial<IAssetRepository> {
  private assets: Asset[] = [];

  constructor() {
    // Pre-populate with test assets
    this.assets = [
      Asset.reconstitute({
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
        depreciationModel: null,
        depreciationStart: null,
        depreciationEnd: null,
        condition: "NEW",
        currentStockLocationId: "stock-hq",
        owningOrgUnitId: null,
        attributes: null,
        note: null,
        createdAt: new Date("2024-01-15"),
        updatedAt: new Date("2024-01-15"),
      }),
      Asset.reconstitute({
        id: "asset-002",
        assetTag: "LAPTOP-002",
        assetCategoryId: "cat-laptop",
        assetModelId: "model-hp",
        vendorId: "vendor-hp",
        contractId: null,
        lifecycleStateId: "state-deployed",
        serialNumber: "SN-67890",
        purchaseDate: new Date("2024-02-01"),
        purchaseCost: 1800,
        purchaseCostSar: 6750,
        currency: "USD",
        depreciationModel: null,
        depreciationStart: null,
        depreciationEnd: null,
        condition: "NEW",
        currentStockLocationId: "stock-branch",
        owningOrgUnitId: null,
        attributes: null,
        note: null,
        createdAt: new Date("2024-02-01"),
        updatedAt: new Date("2024-02-01"),
      }),
      Asset.reconstitute({
        id: "asset-003",
        assetTag: "MONITOR-001",
        assetCategoryId: "cat-monitor",
        assetModelId: "model-lg",
        vendorId: "vendor-lg",
        contractId: null,
        lifecycleStateId: "state-active",
        serialNumber: "SN-ABCDE",
        purchaseDate: new Date("2024-03-01"),
        purchaseCost: 500,
        purchaseCostSar: 1875,
        currency: "USD",
        depreciationModel: null,
        depreciationStart: null,
        depreciationEnd: null,
        condition: "GOOD",
        currentStockLocationId: "stock-hq",
        owningOrgUnitId: null,
        attributes: null,
        note: null,
        createdAt: new Date("2024-03-01"),
        updatedAt: new Date("2024-03-01"),
      }),
      Asset.reconstitute({
        id: "asset-004",
        assetTag: "SERVER-001",
        assetCategoryId: "cat-server",
        assetModelId: "model-dell-server",
        vendorId: "vendor-dell",
        contractId: null,
        lifecycleStateId: "state-active",
        serialNumber: "SN-SERVER-001",
        purchaseDate: new Date("2024-01-01"),
        purchaseCost: 15000,
        purchaseCostSar: 56250,
        currency: "USD",
        depreciationModel: null,
        depreciationStart: null,
        depreciationEnd: null,
        condition: "NEW",
        currentStockLocationId: "stock-dc",
        owningOrgUnitId: null,
        attributes: null,
        note: null,
        createdAt: new Date("2024-01-01"),
        updatedAt: new Date("2024-01-01"),
      }),
    ];
  }

  async findAll(): Promise<Asset[]> {
    return [...this.assets];
  }

  async search(options: AssetSearchOptions): Promise<Asset[]> {
    let result = [...this.assets];

    if (options.assetCategoryId) {
      result = result.filter(
        (a) => a.assetCategoryId === options.assetCategoryId,
      );
    }

    if (options.vendorId) {
      result = result.filter((a) => a.vendorId === options.vendorId);
    }

    if (options.lifecycleStateId) {
      result = result.filter(
        (a) => a.lifecycleStateId === options.lifecycleStateId,
      );
    }

    if (options.currentStockLocationId) {
      result = result.filter(
        (a) => a.currentStockLocationId === options.currentStockLocationId,
      );
    }

    if (options.searchTerm) {
      const searchLower = options.searchTerm.toLowerCase();
      result = result.filter(
        (a) =>
          a.assetTag.toLowerCase().includes(searchLower) ||
          (a.serialNumber &&
            a.serialNumber.toLowerCase().includes(searchLower)),
      );
    }

    return result;
  }
}

describe("ListAssetsUseCase", () => {
  let useCase: ListAssetsUseCase;
  let mockRepository: MockAssetRepository;

  beforeEach(() => {
    mockRepository = new MockAssetRepository();
    useCase = new ListAssetsUseCase(
      mockRepository as unknown as IAssetRepository,
    );
  });

  describe("execute - list all", () => {
    it("should return all assets when no options provided", async () => {
      const result = await useCase.execute();

      expect(result).toHaveLength(4);
    });

    it("should return all assets when empty options provided", async () => {
      const result = await useCase.execute({});

      expect(result).toHaveLength(4);
    });

    it("should return assets with correct properties", async () => {
      const result = await useCase.execute();

      const laptop = result.find((a) => a.id === "asset-001");
      expect(laptop).toBeDefined();
      expect(laptop!.assetTag).toBe("LAPTOP-001");
      expect(laptop!.assetCategoryId).toBe("cat-laptop");
    });
  });

  describe("execute - search by category", () => {
    it("should filter by category", async () => {
      const result = await useCase.execute({ assetCategoryId: "cat-laptop" });

      expect(result).toHaveLength(2);
      result.forEach((asset) => {
        expect(asset.assetCategoryId).toBe("cat-laptop");
      });
    });

    it("should return empty array for non-existent category", async () => {
      const result = await useCase.execute({
        assetCategoryId: "cat-non-existent",
      });

      expect(result).toHaveLength(0);
    });

    it("should return single asset for category with one asset", async () => {
      const result = await useCase.execute({ assetCategoryId: "cat-server" });

      expect(result).toHaveLength(1);
      expect(result[0].assetCategoryId).toBe("cat-server");
    });
  });

  describe("execute - search by vendor", () => {
    it("should filter by vendor", async () => {
      const result = await useCase.execute({ vendorId: "vendor-dell" });

      expect(result).toHaveLength(2);
      result.forEach((asset) => {
        expect(asset.vendorId).toBe("vendor-dell");
      });
    });

    it("should return assets from single vendor", async () => {
      const result = await useCase.execute({ vendorId: "vendor-hp" });

      expect(result).toHaveLength(1);
      expect(result[0].vendorId).toBe("vendor-hp");
    });
  });

  describe("execute - search by lifecycle state", () => {
    it("should filter by lifecycle state", async () => {
      const result = await useCase.execute({
        lifecycleStateId: "state-active",
      });

      expect(result).toHaveLength(3);
      result.forEach((asset) => {
        expect(asset.lifecycleStateId).toBe("state-active");
      });
    });

    it("should return deployed assets only", async () => {
      const result = await useCase.execute({
        lifecycleStateId: "state-deployed",
      });

      expect(result).toHaveLength(1);
      expect(result[0].lifecycleStateId).toBe("state-deployed");
    });
  });

  describe("execute - search by stock location", () => {
    it("should filter by stock location", async () => {
      const result = await useCase.execute({
        currentStockLocationId: "stock-hq",
      });

      expect(result).toHaveLength(2);
      result.forEach((asset) => {
        expect(asset.currentStockLocationId).toBe("stock-hq");
      });
    });

    it("should return assets at single location", async () => {
      const result = await useCase.execute({
        currentStockLocationId: "stock-dc",
      });

      expect(result).toHaveLength(1);
      expect(result[0].currentStockLocationId).toBe("stock-dc");
    });
  });

  describe("execute - search by text", () => {
    it("should search by asset tag", async () => {
      const result = await useCase.execute({ searchTerm: "LAPTOP" });

      expect(result).toHaveLength(2);
      result.forEach((asset) => {
        expect(asset.assetTag).toContain("LAPTOP");
      });
    });

    it("should search by serial number", async () => {
      const result = await useCase.execute({ searchTerm: "SERVER" });

      expect(result).toHaveLength(1);
      expect(result[0].serialNumber).toContain("SERVER");
    });

    it("should be case insensitive", async () => {
      const result = await useCase.execute({ searchTerm: "laptop" });

      expect(result).toHaveLength(2);
    });

    it("should return empty array for no matches", async () => {
      const result = await useCase.execute({ searchTerm: "NONEXISTENT" });

      expect(result).toHaveLength(0);
    });

    it("should match partial strings", async () => {
      const result = await useCase.execute({ searchTerm: "001" });

      expect(result.length).toBeGreaterThan(0);
      result.forEach((asset) => {
        const matches =
          asset.assetTag.includes("001") ||
          (asset.serialNumber && asset.serialNumber.includes("001"));
        expect(matches).toBe(true);
      });
    });
  });

  describe("execute - combined filters", () => {
    it("should combine category and vendor filters", async () => {
      const result = await useCase.execute({
        assetCategoryId: "cat-laptop",
        vendorId: "vendor-dell",
      });

      expect(result).toHaveLength(1);
      expect(result[0].assetCategoryId).toBe("cat-laptop");
      expect(result[0].vendorId).toBe("vendor-dell");
    });

    it("should combine category and lifecycle state filters", async () => {
      const result = await useCase.execute({
        assetCategoryId: "cat-laptop",
        lifecycleStateId: "state-deployed",
      });

      expect(result).toHaveLength(1);
      expect(result[0].assetCategoryId).toBe("cat-laptop");
      expect(result[0].lifecycleStateId).toBe("state-deployed");
    });

    it("should return empty for non-matching combination", async () => {
      const result = await useCase.execute({
        assetCategoryId: "cat-server",
        vendorId: "vendor-hp", // Server is Dell, not HP
      });

      expect(result).toHaveLength(0);
    });

    it("should combine multiple filters with search", async () => {
      const result = await useCase.execute({
        assetCategoryId: "cat-laptop",
        vendorId: "vendor-dell",
        searchTerm: "001",
      });

      expect(result).toHaveLength(1);
      expect(result[0].assetTag).toBe("LAPTOP-001");
    });
  });
});
