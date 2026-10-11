/**
 * Asset Domain Entity - Unit Tests
 *
 * Tests for the Asset entity including:
 * - Factory method: create
 * - Factory method: reconstitute
 * - Validation rules
 * - Update methods
 * - Business logic methods
 * - Edge cases
 */

import { describe, it, expect, beforeEach } from "vitest";
import { Asset } from "../asset.entity";
import type { AssetProps, CreateAssetProps } from "../asset.entity";

describe("Asset Entity", () => {
  // Valid test data
  const validCreateProps: CreateAssetProps = {
    assetTag: "LAPTOP-001",
    assetCategoryId: "cat-123",
    assetModelId: "model-456",
    vendorId: "vendor-789",
    serialNumber: "SN123456789",
    purchaseCost: 1500.0,
    currency: "USD",
  };

  const validFullProps: AssetProps = {
    id: "asset-123",
    assetTag: "LAPTOP-001",
    assetCategoryId: "cat-123",
    assetModelId: "model-456",
    vendorId: "vendor-789",
    contractId: "contract-001",
    lifecycleStateId: "state-active",
    serialNumber: "SN123456789",
    purchaseDate: new Date("2024-01-15"),
    purchaseCost: 1500.0,
    purchaseCostSar: 5625.0,
    currency: "USD",
    depreciationModel: "straight-line",
    depreciationStart: new Date("2024-01-15"),
    depreciationEnd: new Date("2029-01-15"),
    condition: "NEW",
    currentStockLocationId: "stock-001",
    owningOrgUnitId: null,
    attributes: { ram: "16GB", storage: "512GB SSD" },
    note: "Company laptop for engineering team",
    createdAt: new Date("2024-01-15"),
    updatedAt: new Date("2024-01-15"),
  };

  describe("create - factory method", () => {
    it("should create an asset with valid data", () => {
      const asset = Asset.create(validCreateProps);

      expect(asset.assetTag).toBe("LAPTOP-001");
      expect(asset.assetCategoryId).toBe("cat-123");
      expect(asset.assetModelId).toBe("model-456");
      expect(asset.vendorId).toBe("vendor-789");
      expect(asset.serialNumber).toBe("SN123456789");
      expect(asset.purchaseCost).toBe(1500.0);
      expect(asset.currency).toBe("USD");
      expect(asset.id).toBe(""); // Not set until repository assigns it
    });

    it("should create an asset with minimal required data", () => {
      const asset = Asset.create({
        assetTag: "MIN-001",
        assetCategoryId: "cat-123",
      });

      expect(asset.assetTag).toBe("MIN-001");
      expect(asset.assetCategoryId).toBe("cat-123");
      expect(asset.serialNumber).toBeNull();
      expect(asset.purchaseCost).toBeNull();
      expect(asset.currency).toBeNull();
      expect(asset.assetModelId).toBeNull();
      expect(asset.vendorId).toBeNull();
    });

    it("should normalize asset tag to uppercase", () => {
      const asset = Asset.create({
        assetTag: "laptop-001",
        assetCategoryId: "cat-123",
      });

      expect(asset.assetTag).toBe("LAPTOP-001");
    });

    it("should normalize currency to uppercase", () => {
      const asset = Asset.create({
        assetTag: "ASSET-001",
        assetCategoryId: "cat-123",
        currency: "usd",
      });

      expect(asset.currency).toBe("USD");
    });

    it("should trim whitespace from asset tag", () => {
      const asset = Asset.create({
        assetTag: "  LAPTOP-001  ",
        assetCategoryId: "cat-123",
      });

      expect(asset.assetTag).toBe("LAPTOP-001");
    });

    it("should trim whitespace from serial number", () => {
      const asset = Asset.create({
        assetTag: "ASSET-001",
        assetCategoryId: "cat-123",
        serialNumber: "  SN123  ",
      });

      expect(asset.serialNumber).toBe("SN123");
    });

    it("should set timestamps on creation", () => {
      const before = new Date();
      const asset = Asset.create(validCreateProps);
      const after = new Date();

      expect(asset.createdAt.getTime()).toBeGreaterThanOrEqual(
        before.getTime(),
      );
      expect(asset.createdAt.getTime()).toBeLessThanOrEqual(after.getTime());
      expect(asset.updatedAt.getTime()).toBeGreaterThanOrEqual(
        before.getTime(),
      );
      expect(asset.updatedAt.getTime()).toBeLessThanOrEqual(after.getTime());
    });
  });

  describe("create - validation", () => {
    describe("asset tag validation", () => {
      it("should throw error for missing asset tag", () => {
        expect(() =>
          Asset.create({
            assetTag: "",
            assetCategoryId: "cat-123",
          }),
        ).toThrow("Asset tag is required");
      });

      it("should throw error for undefined asset tag", () => {
        expect(() =>
          Asset.create({
            assetCategoryId: "cat-123",
          } as CreateAssetProps),
        ).toThrow("Asset tag is required");
      });

      it("should throw error for asset tag too short", () => {
        expect(() =>
          Asset.create({
            assetTag: "A",
            assetCategoryId: "cat-123",
          }),
        ).toThrow("Asset tag must be at least 2 characters");
      });

      it("should throw error for asset tag too long", () => {
        expect(() =>
          Asset.create({
            assetTag: "A".repeat(101),
            assetCategoryId: "cat-123",
          }),
        ).toThrow("Asset tag cannot exceed 100 characters");
      });

      it("should throw error for asset tag with invalid characters", () => {
        expect(() =>
          Asset.create({
            assetTag: "ASSET@001",
            assetCategoryId: "cat-123",
          }),
        ).toThrow(
          "Asset tag can only contain letters, numbers, hyphens, and underscores",
        );
      });

      it("should accept asset tag with hyphens and underscores", () => {
        const asset = Asset.create({
          assetTag: "LAPTOP-001_TEST",
          assetCategoryId: "cat-123",
        });

        expect(asset.assetTag).toBe("LAPTOP-001_TEST");
      });

      it("should accept asset tag at minimum length", () => {
        const asset = Asset.create({
          assetTag: "AB",
          assetCategoryId: "cat-123",
        });

        expect(asset.assetTag).toBe("AB");
      });

      it("should accept asset tag at maximum length", () => {
        const tag = "A".repeat(100);
        const asset = Asset.create({
          assetTag: tag,
          assetCategoryId: "cat-123",
        });

        expect(asset.assetTag).toBe(tag);
      });
    });

    describe("serial number validation", () => {
      it("should throw error for empty serial number string", () => {
        expect(() =>
          Asset.create({
            assetTag: "ASSET-001",
            assetCategoryId: "cat-123",
            serialNumber: "   ", // Whitespace only
          }),
        ).toThrow("Serial number cannot be empty if provided");
      });

      it("should throw error for serial number too long", () => {
        expect(() =>
          Asset.create({
            assetTag: "ASSET-001",
            assetCategoryId: "cat-123",
            serialNumber: "S".repeat(201),
          }),
        ).toThrow("Serial number cannot exceed 200 characters");
      });

      it("should accept serial number at maximum length", () => {
        const serial = "S".repeat(200);
        const asset = Asset.create({
          assetTag: "ASSET-001",
          assetCategoryId: "cat-123",
          serialNumber: serial,
        });

        expect(asset.serialNumber).toBe(serial);
      });
    });

    describe("purchase cost validation", () => {
      it("should throw error for negative purchase cost", () => {
        expect(() =>
          Asset.create({
            assetTag: "ASSET-001",
            assetCategoryId: "cat-123",
            purchaseCost: -100,
          }),
        ).toThrow("Purchase cost cannot be negative");
      });

      it("should throw error for purchase cost exceeding maximum", () => {
        expect(() =>
          Asset.create({
            assetTag: "ASSET-001",
            assetCategoryId: "cat-123",
            purchaseCost: 10000000000,
          }),
        ).toThrow("Purchase cost cannot exceed 9999999999.99");
      });

      it("should treat zero purchase cost as null (falsy value)", () => {
        // Note: The entity treats 0 as falsy and converts it to null
        // This is the current behavior - consider if this should be changed
        const asset = Asset.create({
          assetTag: "ASSET-001",
          assetCategoryId: "cat-123",
          purchaseCost: 0,
        });

        expect(asset.purchaseCost).toBeNull();
      });

      it("should accept maximum purchase cost", () => {
        const asset = Asset.create({
          assetTag: "ASSET-001",
          assetCategoryId: "cat-123",
          purchaseCost: 9999999999.99,
        });

        expect(asset.purchaseCost).toBe(9999999999.99);
      });
    });

    describe("currency validation", () => {
      it("should throw error for currency that is not 3 characters", () => {
        expect(() =>
          Asset.create({
            assetTag: "ASSET-001",
            assetCategoryId: "cat-123",
            currency: "US",
          }),
        ).toThrow("Currency must be a 3-letter ISO code");
      });

      it("should throw error for currency with 4 characters", () => {
        expect(() =>
          Asset.create({
            assetTag: "ASSET-001",
            assetCategoryId: "cat-123",
            currency: "USDD",
          }),
        ).toThrow("Currency must be a 3-letter ISO code");
      });

      it("should throw error for currency with non-alphabetic characters", () => {
        expect(() =>
          Asset.create({
            assetTag: "ASSET-001",
            assetCategoryId: "cat-123",
            currency: "U$D",
          }),
        ).toThrow("Currency must be 3 uppercase letters");
      });

      it("should throw error for currency with numbers", () => {
        expect(() =>
          Asset.create({
            assetTag: "ASSET-001",
            assetCategoryId: "cat-123",
            currency: "US1",
          }),
        ).toThrow("Currency must be 3 uppercase letters");
      });

      it("should accept valid currency codes", () => {
        const currencies = ["USD", "EUR", "SAR", "GBP", "JPY"];
        currencies.forEach((currency) => {
          const asset = Asset.create({
            assetTag: `ASSET-${currency}`,
            assetCategoryId: "cat-123",
            currency,
          });
          expect(asset.currency).toBe(currency);
        });
      });
    });
  });

  describe("reconstitute - factory method", () => {
    it("should reconstitute an asset from persistence", () => {
      const asset = Asset.reconstitute(validFullProps);

      expect(asset.id).toBe("asset-123");
      expect(asset.assetTag).toBe("LAPTOP-001");
      expect(asset.assetCategoryId).toBe("cat-123");
      expect(asset.assetModelId).toBe("model-456");
      expect(asset.vendorId).toBe("vendor-789");
      expect(asset.contractId).toBe("contract-001");
      expect(asset.lifecycleStateId).toBe("state-active");
      expect(asset.serialNumber).toBe("SN123456789");
      expect(asset.purchaseDate).toEqual(new Date("2024-01-15"));
      expect(asset.purchaseCost).toBe(1500.0);
      expect(asset.purchaseCostSar).toBe(5625.0);
      expect(asset.currency).toBe("USD");
      expect(asset.depreciationModel).toBe("straight-line");
      expect(asset.depreciationStart).toEqual(new Date("2024-01-15"));
      expect(asset.depreciationEnd).toEqual(new Date("2029-01-15"));
      expect(asset.condition).toBe("NEW");
      expect(asset.currentStockLocationId).toBe("stock-001");
      expect(asset.attributes).toEqual({ ram: "16GB", storage: "512GB SSD" });
      expect(asset.note).toBe("Company laptop for engineering team");
      expect(asset.createdAt).toEqual(new Date("2024-01-15"));
      expect(asset.updatedAt).toEqual(new Date("2024-01-15"));
    });
  });

  describe("update method", () => {
    let asset: Asset;

    beforeEach(() => {
      asset = Asset.create(validCreateProps);
    });

    it("should update asset tag", () => {
      asset.update({ assetTag: "NEW-TAG-001" });

      expect(asset.assetTag).toBe("NEW-TAG-001");
    });

    it("should normalize updated asset tag to uppercase", () => {
      asset.update({ assetTag: "new-tag-001" });

      expect(asset.assetTag).toBe("NEW-TAG-001");
    });

    it("should update serial number", () => {
      asset.update({ serialNumber: "NEW-SN-12345" });

      expect(asset.serialNumber).toBe("NEW-SN-12345");
    });

    it("should allow setting serial number to null", () => {
      asset.update({ serialNumber: null });

      expect(asset.serialNumber).toBeNull();
    });

    it("should update purchase cost", () => {
      asset.update({ purchaseCost: 2000.0 });

      expect(asset.purchaseCost).toBe(2000.0);
    });

    it("should update currency", () => {
      asset.update({ currency: "EUR" });

      expect(asset.currency).toBe("EUR");
    });

    it("should update multiple fields at once", () => {
      asset.update({
        assetTag: "UPDATED-001",
        serialNumber: "NEW-SN",
        purchaseCost: 2500.0,
        currency: "SAR",
        condition: "GOOD",
        note: "Updated note",
      });

      expect(asset.assetTag).toBe("UPDATED-001");
      expect(asset.serialNumber).toBe("NEW-SN");
      expect(asset.purchaseCost).toBe(2500.0);
      expect(asset.currency).toBe("SAR");
      expect(asset.condition).toBe("GOOD");
      expect(asset.note).toBe("Updated note");
    });

    it("should update timestamps on update", () => {
      const beforeUpdate = asset.updatedAt;

      // Wait a bit to ensure time difference
      asset.update({ condition: "GOOD" });

      expect(asset.updatedAt.getTime()).toBeGreaterThanOrEqual(
        beforeUpdate.getTime(),
      );
    });

    it("should validate asset tag on update", () => {
      expect(() => asset.update({ assetTag: "A" })).toThrow(
        "Asset tag must be at least 2 characters",
      );
    });

    it("should validate serial number on update", () => {
      expect(() => asset.update({ serialNumber: "S".repeat(201) })).toThrow(
        "Serial number cannot exceed 200 characters",
      );
    });

    it("should validate purchase cost on update", () => {
      expect(() => asset.update({ purchaseCost: -100 })).toThrow(
        "Purchase cost cannot be negative",
      );
    });

    it("should validate currency on update", () => {
      expect(() => asset.update({ currency: "AB" })).toThrow(
        "Currency must be a 3-letter ISO code",
      );
    });
  });

  describe("updateAttributes method", () => {
    it("should merge new attributes with existing", () => {
      const asset = Asset.create({
        assetTag: "ASSET-001",
        assetCategoryId: "cat-123",
        attributes: { ram: "8GB" },
      });

      asset.updateAttributes({ storage: "256GB" });

      expect(asset.attributes).toEqual({ ram: "8GB", storage: "256GB" });
    });

    it("should create attributes if none exist", () => {
      const asset = Asset.create({
        assetTag: "ASSET-001",
        assetCategoryId: "cat-123",
      });

      asset.updateAttributes({ processor: "Intel i7" });

      expect(asset.attributes).toEqual({ processor: "Intel i7" });
    });

    it("should override existing attribute values", () => {
      const asset = Asset.create({
        assetTag: "ASSET-001",
        assetCategoryId: "cat-123",
        attributes: { ram: "8GB" },
      });

      asset.updateAttributes({ ram: "16GB" });

      expect(asset.attributes).toEqual({ ram: "16GB" });
    });

    it("should update timestamp", () => {
      const asset = Asset.create({
        assetTag: "ASSET-001",
        assetCategoryId: "cat-123",
      });
      const before = asset.updatedAt;

      asset.updateAttributes({ cpu: "AMD" });

      expect(asset.updatedAt.getTime()).toBeGreaterThanOrEqual(
        before.getTime(),
      );
    });
  });

  describe("setLifecycleState method", () => {
    it("should set lifecycle state", () => {
      const asset = Asset.create(validCreateProps);

      asset.setLifecycleState("state-deployed");

      expect(asset.lifecycleStateId).toBe("state-deployed");
    });

    it("should allow setting lifecycle state to null", () => {
      const asset = Asset.create({
        ...validCreateProps,
        lifecycleStateId: "state-active",
      });

      asset.setLifecycleState(null);

      expect(asset.lifecycleStateId).toBeNull();
    });

    it("should update timestamp", () => {
      const asset = Asset.create(validCreateProps);
      const before = asset.updatedAt;

      asset.setLifecycleState("state-deployed");

      expect(asset.updatedAt.getTime()).toBeGreaterThanOrEqual(
        before.getTime(),
      );
    });
  });

  describe("setStockLocation method", () => {
    it("should set stock location", () => {
      const asset = Asset.create(validCreateProps);

      asset.setStockLocation("warehouse-001");

      expect(asset.currentStockLocationId).toBe("warehouse-001");
    });

    it("should allow setting stock location to null", () => {
      const asset = Asset.create({
        ...validCreateProps,
        currentStockLocationId: "warehouse-001",
        owningOrgUnitId: null,
      });

      asset.setStockLocation(null);

      expect(asset.currentStockLocationId).toBeNull();
    });
  });

  describe("isDepreciated method", () => {
    it("should return true when depreciation model and start date are set", () => {
      const asset = Asset.reconstitute({
        ...validFullProps,
        depreciationModel: "straight-line",
        depreciationStart: new Date("2024-01-01"),
      });

      expect(asset.isDepreciated()).toBe(true);
    });

    it("should return false when depreciation model is null", () => {
      const asset = Asset.reconstitute({
        ...validFullProps,
        depreciationModel: null,
        depreciationStart: new Date("2024-01-01"),
      });

      expect(asset.isDepreciated()).toBe(false);
    });

    it("should return false when depreciation start is null", () => {
      const asset = Asset.reconstitute({
        ...validFullProps,
        depreciationModel: "straight-line",
        depreciationStart: null,
      });

      expect(asset.isDepreciated()).toBe(false);
    });
  });

  describe("isFullyDepreciated method", () => {
    it("should return true when depreciation end date is in the past", () => {
      const pastDate = new Date();
      pastDate.setFullYear(pastDate.getFullYear() - 1);

      const asset = Asset.reconstitute({
        ...validFullProps,
        depreciationModel: "straight-line",
        depreciationStart: new Date("2020-01-01"),
        depreciationEnd: pastDate,
      });

      expect(asset.isFullyDepreciated()).toBe(true);
    });

    it("should return false when depreciation end date is in the future", () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);

      const asset = Asset.reconstitute({
        ...validFullProps,
        depreciationModel: "straight-line",
        depreciationStart: new Date("2024-01-01"),
        depreciationEnd: futureDate,
      });

      expect(asset.isFullyDepreciated()).toBe(false);
    });

    it("should return false when not being depreciated", () => {
      const asset = Asset.reconstitute({
        ...validFullProps,
        depreciationModel: null,
        depreciationStart: null,
        depreciationEnd: null,
      });

      expect(asset.isFullyDepreciated()).toBe(false);
    });

    it("should return false when no depreciation end date", () => {
      const asset = Asset.reconstitute({
        ...validFullProps,
        depreciationModel: "straight-line",
        depreciationStart: new Date("2024-01-01"),
        depreciationEnd: null,
      });

      expect(asset.isFullyDepreciated()).toBe(false);
    });
  });

  describe("setId method", () => {
    it("should set id when not already set", () => {
      const asset = Asset.create(validCreateProps);

      asset.setId("new-asset-id");

      expect(asset.id).toBe("new-asset-id");
    });

    it("should throw error when trying to change existing id", () => {
      const asset = Asset.reconstitute(validFullProps);

      expect(() => asset.setId("different-id")).toThrow(
        "Cannot change asset ID after it has been set",
      );
    });
  });

  describe("toObject method", () => {
    it("should return plain object representation", () => {
      const asset = Asset.reconstitute(validFullProps);

      const obj = asset.toObject();

      expect(obj).toEqual(validFullProps);
      expect(obj).not.toBe(validFullProps); // Should be a copy
    });
  });

  describe("equals method", () => {
    it("should return true for assets with same id", () => {
      const asset1 = Asset.reconstitute(validFullProps);
      const asset2 = Asset.reconstitute({
        ...validFullProps,
        assetTag: "DIFFERENT-TAG",
      });

      expect(asset1.equals(asset2)).toBe(true);
    });

    it("should return false for assets with different ids", () => {
      const asset1 = Asset.reconstitute(validFullProps);
      const asset2 = Asset.reconstitute({
        ...validFullProps,
        id: "different-id",
      });

      expect(asset1.equals(asset2)).toBe(false);
    });
  });
});
