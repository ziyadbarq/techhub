/**
 * CreateAssetUseCase - Unit Tests
 *
 * Tests for the CreateAssetUseCase including:
 * - Successful asset creation
 * - Validation errors (entity-level)
 * - Business rule errors (uniqueness)
 * - Edge cases (normalization)
 */

import { describe, it, expect, beforeEach } from "vitest";
import { CreateAssetUseCase } from "../create-asset.use-case";
import type { IAssetRepository } from "@/core/repositories/asset.repository.interface";
import type { ICodeGeneratorService } from "@/core/services/code-generator.service.interface";
import type { ISarConversionService } from "@/core/services/sar-conversion.service.interface";
import type { Asset } from "@/core/domain/entities/asset.entity";

/**
 * Mock Asset Repository
 */
class MockAssetRepository implements Partial<IAssetRepository> {
  private assets = new Map<string, Asset>();
  private assetTags = new Set<string>();
  private serialNumbers = new Set<string>();
  private idCounter = 1;

  async create(asset: Asset): Promise<Asset> {
    // Assign ID if not set (simulate repository behavior)
    if (!asset.id) {
      asset.setId(`asset-${this.idCounter++}`);
    }
    this.assets.set(asset.id, asset);
    this.assetTags.add(asset.assetTag);
    if (asset.serialNumber) {
      this.serialNumbers.add(asset.serialNumber);
    }
    return asset;
  }

  async existsByAssetTag(assetTag: string): Promise<boolean> {
    return this.assetTags.has(assetTag.toUpperCase());
  }

  async existsBySerialNumber(serialNumber: string): Promise<boolean> {
    return this.serialNumbers.has(serialNumber);
  }

  clear(): void {
    this.assets.clear();
    this.assetTags.clear();
    this.serialNumbers.clear();
    this.idCounter = 1;
  }
}

/**
 * Mock Code Generator Service
 */
class MockCodeGeneratorService implements Partial<ICodeGeneratorService> {
  private counters = new Map<string, number>();

  async generateCode(entityType: string, prefix: string): Promise<string> {
    const current = this.counters.get(entityType) || 0;
    const next = current + 1;
    this.counters.set(entityType, next);
    return `${prefix}-${String(next).padStart(6, "0")}`;
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
    // Simple mock: assume 1 USD = 3.75 SAR, SAR = 1
    if (currency.toUpperCase() === "SAR") return amount;
    if (currency.toUpperCase() === "USD") return amount * 3.75;
    return null; // Unknown currency
  }

  shouldRecalculateSar() {
    return { needsConversion: true, amount: null, currency: null };
  }
}

describe("CreateAssetUseCase", () => {
  let useCase: CreateAssetUseCase;
  let mockRepository: MockAssetRepository;
  let mockCodeGenerator: MockCodeGeneratorService;
  let mockSarConversionService: MockSarConversionService;

  beforeEach(() => {
    mockRepository = new MockAssetRepository();
    mockCodeGenerator = new MockCodeGeneratorService();
    mockSarConversionService = new MockSarConversionService();
    useCase = new CreateAssetUseCase(
      mockRepository as unknown as IAssetRepository,
      mockCodeGenerator as unknown as ICodeGeneratorService,
      mockSarConversionService as unknown as ISarConversionService,
    );
  });

  describe("execute - successful creation", () => {
    it("should create an asset with valid data", async () => {
      // Arrange
      const props = {
        assetTag: "LAPTOP-001",
        assetCategoryId: "cat-1",
        serialNumber: "SN123456",
        purchaseCost: 1500.0,
        currency: "USD",
      };

      // Act
      const result = await useCase.execute(props);

      // Assert
      expect(result).toBeDefined();
      expect(result.assetTag).toBe("LAPTOP-001");
      expect(result.assetCategoryId).toBe("cat-1");
      expect(result.serialNumber).toBe("SN123456");
      expect(result.purchaseCost).toBe(1500.0);
      expect(result.currency).toBe("USD");
      expect(result.id).toBeDefined();
    });

    it("should create an asset without optional fields", async () => {
      // Arrange
      const props = {
        assetTag: "MINIMAL-001",
        assetCategoryId: "cat-1",
      };

      // Act
      const result = await useCase.execute(props);

      // Assert
      expect(result.assetTag).toBe("MINIMAL-001");
      expect(result.assetCategoryId).toBe("cat-1");
      expect(result.serialNumber).toBeNull();
      expect(result.purchaseCost).toBeNull();
      expect(result.currency).toBeNull();
    });
  });

  describe("execute - business rule validation", () => {
    it("should reject duplicate asset tag", async () => {
      // Arrange
      const props = {
        assetTag: "DUPLICATE-001",
        assetCategoryId: "cat-1",
      };

      await useCase.execute(props);

      // Act & Assert - Try to create with same tag
      await expect(
        useCase.execute({
          assetTag: "DUPLICATE-001",
          assetCategoryId: "cat-1",
        }),
      ).rejects.toThrow(/already exists/);
    });

    it("should reject duplicate serial number", async () => {
      // Arrange
      const props1 = {
        assetTag: "ASSET-001",
        assetCategoryId: "cat-1",
        serialNumber: "DUPLICATE-SN",
      };

      await useCase.execute(props1);

      // Act & Assert - Try to create with same serial number
      await expect(
        useCase.execute({
          assetTag: "ASSET-002",
          assetCategoryId: "cat-1",
          serialNumber: "DUPLICATE-SN",
        }),
      ).rejects.toThrow(/already exists/);
    });
  });

  describe("execute - entity validation", () => {
    it("should reject asset tag that is too short", async () => {
      // Arrange
      const props = {
        assetTag: "A", // Only 1 character
        assetCategoryId: "cat-1",
      };

      // Act & Assert
      await expect(useCase.execute(props)).rejects.toThrow(
        /at least 2 characters/,
      );
    });

    it("should reject asset tag that is too long", async () => {
      // Arrange
      const props = {
        assetTag: "A".repeat(101), // 101 characters
        assetCategoryId: "cat-1",
      };

      // Act & Assert
      await expect(useCase.execute(props)).rejects.toThrow(
        /cannot exceed 100 characters/,
      );
    });

    it("should reject asset tag with invalid characters", async () => {
      // Arrange
      const props = {
        assetTag: "ASSET@001", // @ is not allowed
        assetCategoryId: "cat-1",
      };

      // Act & Assert
      await expect(useCase.execute(props)).rejects.toThrow(
        /can only contain letters, numbers, hyphens, and underscores/,
      );
    });

    it("should reject serial number that is too long", async () => {
      // Arrange
      const props = {
        assetTag: "ASSET-001",
        assetCategoryId: "cat-1",
        serialNumber: "S".repeat(201), // 201 characters
      };

      // Act & Assert
      await expect(useCase.execute(props)).rejects.toThrow(
        /cannot exceed 200 characters/,
      );
    });

    it("should reject negative purchase cost", async () => {
      // Arrange
      const props = {
        assetTag: "ASSET-001",
        assetCategoryId: "cat-1",
        purchaseCost: -100,
      };

      // Act & Assert
      await expect(useCase.execute(props)).rejects.toThrow(
        /cannot be negative/,
      );
    });

    it("should reject purchase cost that is too large", async () => {
      // Arrange
      const props = {
        assetTag: "ASSET-001",
        assetCategoryId: "cat-1",
        purchaseCost: 10000000000, // Exceeds max
      };

      // Act & Assert
      await expect(useCase.execute(props)).rejects.toThrow(
        /cannot exceed 9999999999.99/,
      );
    });

    it("should reject currency that is not 3 characters", async () => {
      // Arrange
      const props = {
        assetTag: "ASSET-001",
        assetCategoryId: "cat-1",
        currency: "US", // Only 2 characters
      };

      // Act & Assert
      await expect(useCase.execute(props)).rejects.toThrow(
        /must be a 3-letter ISO code/,
      );
    });

    it("should reject currency with non-alphabetic characters", async () => {
      // Arrange
      const props = {
        assetTag: "ASSET-001",
        assetCategoryId: "cat-1",
        currency: "U$D", // Contains special character
      };

      // Act & Assert
      await expect(useCase.execute(props)).rejects.toThrow(
        /must be 3 uppercase letters/,
      );
    });
  });

  describe("edge cases", () => {
    it("should normalize asset tag to uppercase", async () => {
      // Arrange
      const props = {
        assetTag: "laptop-001", // lowercase
        assetCategoryId: "cat-1",
      };

      // Act
      const result = await useCase.execute(props);

      // Assert
      expect(result.assetTag).toBe("LAPTOP-001");
    });

    it("should normalize currency to uppercase", async () => {
      // Arrange
      const props = {
        assetTag: "ASSET-001",
        assetCategoryId: "cat-1",
        currency: "usd", // lowercase
      };

      // Act
      const result = await useCase.execute(props);

      // Assert
      expect(result.currency).toBe("USD");
    });
  });
});
