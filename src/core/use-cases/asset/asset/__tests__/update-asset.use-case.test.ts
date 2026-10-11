/**
 * UpdateAssetUseCase - Unit Tests
 *
 * Tests for the UpdateAssetUseCase including:
 * - Successful asset update
 * - Not found errors
 * - Business rule validation (uniqueness)
 * - SAR conversion
 * - Entity validation (delegated to entity)
 */

import { describe, it, expect, beforeEach } from "vitest";
import { UpdateAssetUseCase } from "../update-asset.use-case";
import type { UpdateAssetInput } from "../update-asset.use-case";
import type { IAssetRepository } from "@/core/repositories/asset.repository.interface";
import type { ISarConversionService } from "@/core/services/sar-conversion.service.interface";
import type { IAssetMovementService } from "@/core/services/asset-movement.service.interface";
import type { ILoggerService } from "@/core/services/logger.service.interface";
import { Asset } from "@/core/domain/entities/asset.entity";
import type { IOrganizationUnitRepository } from "@/core/repositories/organization-unit.repository.interface";

/**
 * Mock Asset Repository
 */
class MockAssetRepository implements Partial<IAssetRepository> {
  private assets = new Map<string, Asset>();
  private assetTags = new Map<string, string>(); // tag -> id
  private serialNumbers = new Map<string, string>(); // serial -> id

  constructor() {
    // Pre-populate with a test asset
    const existingAsset = Asset.reconstitute({
      id: "asset-001",
      assetTag: "EXISTING-001",
      assetCategoryId: "cat-1",
      assetModelId: null,
      vendorId: null,
      contractId: null,
      lifecycleStateId: null,
      serialNumber: "SN-EXISTING-001",
      purchaseDate: null,
      purchaseCost: 1000,
      purchaseCostSar: 3750,
      currency: "USD",
      depreciationModel: null,
      depreciationStart: null,
      depreciationEnd: null,
      condition: null,
      currentStockLocationId: null,
      owningOrgUnitId: null,
      attributes: null,
      note: null,
      createdAt: new Date("2024-01-01"),
      updatedAt: new Date("2024-01-01"),
    });
    this.assets.set("asset-001", existingAsset);
    this.assetTags.set("EXISTING-001", "asset-001");
    this.serialNumbers.set("SN-EXISTING-001", "asset-001");

    // Add another asset for uniqueness tests
    const anotherAsset = Asset.reconstitute({
      id: "asset-002",
      assetTag: "ANOTHER-001",
      assetCategoryId: "cat-1",
      assetModelId: null,
      vendorId: null,
      contractId: null,
      lifecycleStateId: null,
      serialNumber: "SN-ANOTHER-001",
      purchaseDate: null,
      purchaseCost: 2000,
      purchaseCostSar: 7500,
      currency: "USD",
      depreciationModel: null,
      depreciationStart: null,
      depreciationEnd: null,
      condition: null,
      currentStockLocationId: null,
      owningOrgUnitId: null,
      attributes: null,
      note: null,
      createdAt: new Date("2024-01-01"),
      updatedAt: new Date("2024-01-01"),
    });
    this.assets.set("asset-002", anotherAsset);
    this.assetTags.set("ANOTHER-001", "asset-002");
    this.serialNumbers.set("SN-ANOTHER-001", "asset-002");
  }

  async findById(id: string): Promise<Asset | null> {
    return this.assets.get(id) || null;
  }

  async existsByAssetTag(
    assetTag: string,
    excludeId?: string,
  ): Promise<boolean> {
    const existingId = this.assetTags.get(assetTag.toUpperCase());
    if (!existingId) return false;
    if (excludeId && existingId === excludeId) return false;
    return true;
  }

  async existsBySerialNumber(
    serialNumber: string,
    excludeId?: string,
  ): Promise<boolean> {
    const existingId = this.serialNumbers.get(serialNumber);
    if (!existingId) return false;
    if (excludeId && existingId === excludeId) return false;
    return true;
  }

  async update(asset: Asset): Promise<Asset> {
    this.assets.set(asset.id, asset);
    // Update tag and serial lookups
    this.assetTags.set(asset.assetTag, asset.id);
    if (asset.serialNumber) {
      this.serialNumbers.set(asset.serialNumber, asset.id);
    }
    return asset;
  }
}

/**
 * Mock SAR Conversion Service
 */
class MockSarConversionService implements Partial<ISarConversionService> {
  async convertToSarIfNeeded(
    amount: number | null | undefined,
    currency: string | null | undefined,
  ): Promise<number | null> {
    if (amount === null || amount === undefined) return null;
    if (!currency) return null;
    if (currency.toUpperCase() === "SAR") return amount;
    if (currency.toUpperCase() === "USD") return amount * 3.75;
    if (currency.toUpperCase() === "EUR") return amount * 4.0;
    return null;
  }

  shouldRecalculateSar(
    newValues: { amount?: number | null; currency?: string | null },
    existingAmount: number | null,
    existingCurrency: string | null,
  ): {
    needsConversion: boolean;
    amount: number | null;
    currency: string | null;
  } {
    // Check if either cost or currency is being updated
    const amountChanged =
      newValues.amount !== undefined && newValues.amount !== existingAmount;
    const currencyChanged =
      newValues.currency !== undefined &&
      newValues.currency !== existingCurrency;

    if (amountChanged || currencyChanged) {
      return {
        needsConversion: true,
        amount:
          newValues.amount !== undefined ? newValues.amount : existingAmount,
        currency:
          newValues.currency !== undefined
            ? newValues.currency
            : existingCurrency,
      };
    }

    return { needsConversion: false, amount: null, currency: null };
  }
}

/**
 * Mock Asset Movement Service
 */
class MockAssetMovementService implements Partial<IAssetMovementService> {
  async syncAssetLocation(): ReturnType<
    IAssetMovementService["syncAssetLocation"]
  > {
    return { movementType: null, movement: null };
  }
}

/**
 * Mock Logger Service
 */
class MockLoggerService implements Partial<ILoggerService> {
  debug() {}
  info() {}
  warn() {}
  error() {}
  child() {
    return this as unknown as ILoggerService;
  }
}

/**
 * Org unit repository stub. Assets may only be owned by COMPANY-level units,
 * so the use case resolves the unit and checks its type.
 */
class MockOrganizationUnitRepository {
  async findById(id: string) {
    if (id === "org-department") {
      return { id, name: "Finance", unitType: "DEPARTMENT" };
    }
    if (id === "org-missing") {
      return null;
    }
    return { id, name: "Barq", unitType: "COMPANY" };
  }
}

describe("UpdateAssetUseCase", () => {
  let useCase: UpdateAssetUseCase;
  let mockRepository: MockAssetRepository;
  let mockSarConversionService: MockSarConversionService;
  let mockAssetMovementService: MockAssetMovementService;
  let mockLoggerService: MockLoggerService;
  let mockOrganizationUnitRepository: MockOrganizationUnitRepository;

  beforeEach(() => {
    mockRepository = new MockAssetRepository();
    mockSarConversionService = new MockSarConversionService();
    mockAssetMovementService = new MockAssetMovementService();
    mockLoggerService = new MockLoggerService();
    mockOrganizationUnitRepository = new MockOrganizationUnitRepository();
    useCase = new UpdateAssetUseCase(
      mockRepository as unknown as IAssetRepository,
      mockSarConversionService as unknown as ISarConversionService,
      mockAssetMovementService as unknown as IAssetMovementService,
      mockLoggerService as unknown as ILoggerService,
      mockOrganizationUnitRepository as unknown as IOrganizationUnitRepository,
    );
  });

  describe("execute - successful update", () => {
    it("should update an asset with valid data", async () => {
      const input: UpdateAssetInput = {
        id: "asset-001",
        note: "Updated note",
      };

      const result = await useCase.execute(input);

      expect(result).toBeDefined();
      expect(result.id).toBe("asset-001");
      expect(result.note).toBe("Updated note");
    });

    it("should update asset tag", async () => {
      const input: UpdateAssetInput = {
        id: "asset-001",
        assetTag: "NEW-TAG-001",
      };

      const result = await useCase.execute(input);

      expect(result.assetTag).toBe("NEW-TAG-001");
    });

    it("should update serial number", async () => {
      const input: UpdateAssetInput = {
        id: "asset-001",
        serialNumber: "NEW-SN-12345",
      };

      const result = await useCase.execute(input);

      expect(result.serialNumber).toBe("NEW-SN-12345");
    });

    it("should allow setting serial number to null", async () => {
      const input: UpdateAssetInput = {
        id: "asset-001",
        serialNumber: null,
      };

      const result = await useCase.execute(input);

      expect(result.serialNumber).toBeNull();
    });

    it("should update multiple fields at once", async () => {
      const input: UpdateAssetInput = {
        id: "asset-001",
        assetTag: "UPDATED-001",
        serialNumber: "UPDATED-SN",
        note: "Multiple updates",
        vendorId: "vendor-123",
      };

      const result = await useCase.execute(input);

      expect(result.assetTag).toBe("UPDATED-001");
      expect(result.serialNumber).toBe("UPDATED-SN");
      expect(result.note).toBe("Multiple updates");
      expect(result.vendorId).toBe("vendor-123");
    });

    it("should update purchase cost and currency", async () => {
      const input: UpdateAssetInput = {
        id: "asset-001",
        purchaseCost: 2500,
        currency: "EUR",
      };

      const result = await useCase.execute(input);

      expect(result.purchaseCost).toBe(2500);
      expect(result.currency).toBe("EUR");
    });

    it("should update lifecycle state", async () => {
      const input: UpdateAssetInput = {
        id: "asset-001",
        lifecycleStateId: "state-deployed",
      };

      const result = await useCase.execute(input);

      expect(result.lifecycleStateId).toBe("state-deployed");
    });

    it("should update attributes", async () => {
      const input: UpdateAssetInput = {
        id: "asset-001",
        attributes: { ram: "32GB", storage: "1TB" },
      };

      const result = await useCase.execute(input);

      expect(result.attributes).toEqual({ ram: "32GB", storage: "1TB" });
    });
  });

  describe("execute - not found error", () => {
    it("should throw error when asset not found", async () => {
      const input: UpdateAssetInput = {
        id: "non-existent-id",
        note: "Should fail",
      };

      await expect(useCase.execute(input)).rejects.toThrow(
        'Asset with ID "non-existent-id" not found',
      );
    });
  });

  describe("execute - business rule validation", () => {
    it("should reject duplicate asset tag", async () => {
      const input: UpdateAssetInput = {
        id: "asset-001",
        assetTag: "ANOTHER-001", // Tag of asset-002
      };

      await expect(useCase.execute(input)).rejects.toThrow(/already exists/);
    });

    it("should allow keeping same asset tag", async () => {
      const input: UpdateAssetInput = {
        id: "asset-001",
        assetTag: "EXISTING-001", // Same as current
        note: "Updated",
      };

      const result = await useCase.execute(input);

      expect(result.assetTag).toBe("EXISTING-001");
      expect(result.note).toBe("Updated");
    });

    it("should reject duplicate serial number", async () => {
      const input: UpdateAssetInput = {
        id: "asset-001",
        serialNumber: "SN-ANOTHER-001", // Serial of asset-002
      };

      await expect(useCase.execute(input)).rejects.toThrow(/already exists/);
    });

    it("should allow keeping same serial number", async () => {
      const input: UpdateAssetInput = {
        id: "asset-001",
        serialNumber: "SN-EXISTING-001", // Same as current
        note: "Updated",
      };

      const result = await useCase.execute(input);

      expect(result.serialNumber).toBe("SN-EXISTING-001");
      expect(result.note).toBe("Updated");
    });
  });

  describe("execute - entity validation", () => {
    it("should reject invalid asset tag", async () => {
      const input: UpdateAssetInput = {
        id: "asset-001",
        assetTag: "A", // Too short
      };

      await expect(useCase.execute(input)).rejects.toThrow(
        /at least 2 characters/,
      );
    });

    it("should reject negative purchase cost", async () => {
      const input: UpdateAssetInput = {
        id: "asset-001",
        purchaseCost: -100,
      };

      await expect(useCase.execute(input)).rejects.toThrow(
        /cannot be negative/,
      );
    });

    it("should reject invalid currency", async () => {
      const input: UpdateAssetInput = {
        id: "asset-001",
        currency: "AB", // Only 2 characters
      };

      await expect(useCase.execute(input)).rejects.toThrow(/3-letter ISO code/);
    });
  });

  describe("edge cases", () => {
    it("should normalize asset tag to uppercase on update", async () => {
      const input: UpdateAssetInput = {
        id: "asset-001",
        assetTag: "lowercase-tag",
      };

      const result = await useCase.execute(input);

      expect(result.assetTag).toBe("LOWERCASE-TAG");
    });

    it("should normalize currency to uppercase on update", async () => {
      const input: UpdateAssetInput = {
        id: "asset-001",
        currency: "eur",
      };

      const result = await useCase.execute(input);

      expect(result.currency).toBe("EUR");
    });

    it("should trim whitespace from note on update", async () => {
      const input: UpdateAssetInput = {
        id: "asset-001",
        note: "  Some note with spaces  ",
      };

      const result = await useCase.execute(input);

      expect(result.note).toBe("Some note with spaces");
    });
  });
});
