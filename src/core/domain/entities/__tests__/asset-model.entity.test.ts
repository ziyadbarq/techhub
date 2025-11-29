/**
 * AssetModel Domain Entity - Unit Tests
 *
 * Tests for the AssetModel entity including:
 * - Factory method: create
 * - Factory method: reconstitute
 * - Validation rules
 * - Update methods
 * - Business logic methods
 * - Edge cases
 */

import { describe, it, expect, beforeEach } from "vitest";
import { AssetModel } from "../asset-model.entity";
import type {
  AssetModelProps,
  CreateAssetModelProps,
} from "../asset-model.entity";

describe("AssetModel Entity", () => {
  // Valid test data
  const validCreateProps: CreateAssetModelProps = {
    assetCategoryId: "cat-123",
    vendorId: "vendor-456",
    name: "Latitude 7490",
    code: "LAT-7490",
    description: "Dell business laptop with 14-inch display",
    defaultWarrantyMonths: 36,
    defaultAttributes: { processor: "Intel i7", ram: "16GB" },
  };

  const validFullProps: AssetModelProps = {
    id: "model-123",
    assetCategoryId: "cat-123",
    vendorId: "vendor-456",
    name: "Latitude 7490",
    code: "LAT-7490",
    description: "Dell business laptop with 14-inch display",
    defaultWarrantyMonths: 36,
    defaultAttributes: { processor: "Intel i7", ram: "16GB" },
    createdAt: new Date("2024-01-15"),
    updatedAt: new Date("2024-01-15"),
  };

  describe("create - factory method", () => {
    it("should create an asset model with valid data", () => {
      const model = AssetModel.create(validCreateProps);

      expect(model.assetCategoryId).toBe("cat-123");
      expect(model.vendorId).toBe("vendor-456");
      expect(model.name).toBe("Latitude 7490");
      expect(model.code).toBe("LAT-7490");
      expect(model.description).toBe(
        "Dell business laptop with 14-inch display",
      );
      expect(model.defaultWarrantyMonths).toBe(36);
      expect(model.defaultAttributes).toEqual({
        processor: "Intel i7",
        ram: "16GB",
      });
      expect(model.id).toBe(""); // Not set until repository assigns it
    });

    it("should create an asset model with minimal required data", () => {
      const model = AssetModel.create({
        assetCategoryId: "cat-123",
        vendorId: "vendor-456",
        name: "Basic Model",
        code: "BM-001",
      });

      expect(model.assetCategoryId).toBe("cat-123");
      expect(model.vendorId).toBe("vendor-456");
      expect(model.name).toBe("Basic Model");
      expect(model.code).toBe("BM-001");
      expect(model.description).toBeNull();
      expect(model.defaultWarrantyMonths).toBeNull();
      expect(model.defaultAttributes).toBeNull();
    });

    it("should normalize code to uppercase", () => {
      const model = AssetModel.create({
        assetCategoryId: "cat-123",
        vendorId: "vendor-456",
        name: "Test Model",
        code: "test-001",
      });

      expect(model.code).toBe("TEST-001");
    });

    it("should trim whitespace from name", () => {
      const model = AssetModel.create({
        assetCategoryId: "cat-123",
        vendorId: "vendor-456",
        name: "  Model Name  ",
        code: "CODE",
      });

      expect(model.name).toBe("Model Name");
    });

    it("should trim whitespace from code", () => {
      const model = AssetModel.create({
        assetCategoryId: "cat-123",
        vendorId: "vendor-456",
        name: "Model",
        code: "  CODE  ",
      });

      expect(model.code).toBe("CODE");
    });

    it("should trim whitespace from description", () => {
      const model = AssetModel.create({
        assetCategoryId: "cat-123",
        vendorId: "vendor-456",
        name: "Model",
        code: "CODE",
        description: "  Description  ",
      });

      expect(model.description).toBe("Description");
    });

    it("should set timestamps on creation", () => {
      const before = new Date();
      const model = AssetModel.create(validCreateProps);
      const after = new Date();

      expect(model.createdAt.getTime()).toBeGreaterThanOrEqual(
        before.getTime(),
      );
      expect(model.createdAt.getTime()).toBeLessThanOrEqual(after.getTime());
      expect(model.updatedAt.getTime()).toBeGreaterThanOrEqual(
        before.getTime(),
      );
      expect(model.updatedAt.getTime()).toBeLessThanOrEqual(after.getTime());
    });
  });

  describe("create - validation", () => {
    describe("name validation", () => {
      it("should throw error for empty name", () => {
        expect(() =>
          AssetModel.create({
            assetCategoryId: "cat-123",
            vendorId: "vendor-456",
            name: "",
            code: "CODE",
          }),
        ).toThrow("Asset model name cannot be empty");
      });

      it("should throw error for whitespace-only name", () => {
        expect(() =>
          AssetModel.create({
            assetCategoryId: "cat-123",
            vendorId: "vendor-456",
            name: "   ",
            code: "CODE",
          }),
        ).toThrow("Asset model name cannot be empty");
      });

      it("should throw error for name too short", () => {
        expect(() =>
          AssetModel.create({
            assetCategoryId: "cat-123",
            vendorId: "vendor-456",
            name: "A",
            code: "CODE",
          }),
        ).toThrow("Asset model name must be at least 2 characters");
      });

      it("should throw error for name too long", () => {
        expect(() =>
          AssetModel.create({
            assetCategoryId: "cat-123",
            vendorId: "vendor-456",
            name: "A".repeat(201),
            code: "CODE",
          }),
        ).toThrow("Asset model name cannot exceed 200 characters");
      });

      it("should accept name at minimum length", () => {
        const model = AssetModel.create({
          assetCategoryId: "cat-123",
          vendorId: "vendor-456",
          name: "AB",
          code: "CODE",
        });

        expect(model.name).toBe("AB");
      });

      it("should accept name at maximum length", () => {
        const name = "A".repeat(200);
        const model = AssetModel.create({
          assetCategoryId: "cat-123",
          vendorId: "vendor-456",
          name,
          code: "CODE",
        });

        expect(model.name).toBe(name);
      });
    });

    describe("code validation", () => {
      it("should throw error for empty code", () => {
        expect(() =>
          AssetModel.create({
            assetCategoryId: "cat-123",
            vendorId: "vendor-456",
            name: "Model Name",
            code: "",
          }),
        ).toThrow("Asset model code cannot be empty");
      });

      it("should throw error for whitespace-only code", () => {
        expect(() =>
          AssetModel.create({
            assetCategoryId: "cat-123",
            vendorId: "vendor-456",
            name: "Model Name",
            code: "   ",
          }),
        ).toThrow("Asset model code cannot be empty");
      });

      it("should throw error for code too short", () => {
        expect(() =>
          AssetModel.create({
            assetCategoryId: "cat-123",
            vendorId: "vendor-456",
            name: "Model Name",
            code: "A",
          }),
        ).toThrow("Asset model code must be at least 2 characters");
      });

      it("should throw error for code too long", () => {
        expect(() =>
          AssetModel.create({
            assetCategoryId: "cat-123",
            vendorId: "vendor-456",
            name: "Model Name",
            code: "A".repeat(51),
          }),
        ).toThrow("Asset model code cannot exceed 50 characters");
      });

      it("should throw error for code with invalid characters", () => {
        expect(() =>
          AssetModel.create({
            assetCategoryId: "cat-123",
            vendorId: "vendor-456",
            name: "Model Name",
            code: "CODE@123",
          }),
        ).toThrow(
          "Asset model code can only contain letters, numbers, hyphens, and underscores",
        );
      });

      it("should throw error for code with spaces", () => {
        expect(() =>
          AssetModel.create({
            assetCategoryId: "cat-123",
            vendorId: "vendor-456",
            name: "Model Name",
            code: "CODE 123",
          }),
        ).toThrow(
          "Asset model code can only contain letters, numbers, hyphens, and underscores",
        );
      });

      it("should accept code with hyphens and underscores", () => {
        const model = AssetModel.create({
          assetCategoryId: "cat-123",
          vendorId: "vendor-456",
          name: "Model Name",
          code: "CODE-123_V2",
        });

        expect(model.code).toBe("CODE-123_V2");
      });

      it("should accept code at minimum length", () => {
        const model = AssetModel.create({
          assetCategoryId: "cat-123",
          vendorId: "vendor-456",
          name: "Model",
          code: "AB",
        });

        expect(model.code).toBe("AB");
      });

      it("should accept code at maximum length", () => {
        const code = "A".repeat(50);
        const model = AssetModel.create({
          assetCategoryId: "cat-123",
          vendorId: "vendor-456",
          name: "Model",
          code,
        });

        expect(model.code).toBe(code);
      });
    });

    describe("warranty months validation", () => {
      it("should throw error for negative warranty months", () => {
        expect(() =>
          AssetModel.create({
            assetCategoryId: "cat-123",
            vendorId: "vendor-456",
            name: "Model",
            code: "CODE",
            defaultWarrantyMonths: -1,
          }),
        ).toThrow("Warranty months cannot be negative");
      });

      it("should throw error for warranty months exceeding maximum", () => {
        expect(() =>
          AssetModel.create({
            assetCategoryId: "cat-123",
            vendorId: "vendor-456",
            name: "Model",
            code: "CODE",
            defaultWarrantyMonths: 121,
          }),
        ).toThrow("Warranty months cannot exceed 120 (10 years)");
      });

      it("should accept zero warranty months", () => {
        const model = AssetModel.create({
          assetCategoryId: "cat-123",
          vendorId: "vendor-456",
          name: "Model",
          code: "CODE",
          defaultWarrantyMonths: 0,
        });

        expect(model.defaultWarrantyMonths).toBe(0);
      });

      it("should accept maximum warranty months", () => {
        const model = AssetModel.create({
          assetCategoryId: "cat-123",
          vendorId: "vendor-456",
          name: "Model",
          code: "CODE",
          defaultWarrantyMonths: 120,
        });

        expect(model.defaultWarrantyMonths).toBe(120);
      });

      it("should accept common warranty periods", () => {
        const periods = [12, 24, 36, 48, 60];
        periods.forEach((months) => {
          const model = AssetModel.create({
            assetCategoryId: "cat-123",
            vendorId: "vendor-456",
            name: `Model-${months}`,
            code: `CODE-${months}`,
            defaultWarrantyMonths: months,
          });
          expect(model.defaultWarrantyMonths).toBe(months);
        });
      });
    });
  });

  describe("reconstitute - factory method", () => {
    it("should reconstitute an asset model from persistence", () => {
      const model = AssetModel.reconstitute(validFullProps);

      expect(model.id).toBe("model-123");
      expect(model.assetCategoryId).toBe("cat-123");
      expect(model.vendorId).toBe("vendor-456");
      expect(model.name).toBe("Latitude 7490");
      expect(model.code).toBe("LAT-7490");
      expect(model.description).toBe(
        "Dell business laptop with 14-inch display",
      );
      expect(model.defaultWarrantyMonths).toBe(36);
      expect(model.defaultAttributes).toEqual({
        processor: "Intel i7",
        ram: "16GB",
      });
      expect(model.createdAt).toEqual(new Date("2024-01-15"));
      expect(model.updatedAt).toEqual(new Date("2024-01-15"));
    });
  });

  describe("update method", () => {
    let model: AssetModel;

    beforeEach(() => {
      model = AssetModel.create(validCreateProps);
    });

    it("should update name", () => {
      model.update({ name: "New Model Name" });

      expect(model.name).toBe("New Model Name");
    });

    it("should update code", () => {
      model.update({ code: "NEW-CODE" });

      expect(model.code).toBe("NEW-CODE");
    });

    it("should normalize updated code to uppercase", () => {
      model.update({ code: "new-code" });

      expect(model.code).toBe("NEW-CODE");
    });

    it("should update description", () => {
      model.update({ description: "Updated description" });

      expect(model.description).toBe("Updated description");
    });

    it("should allow setting description to null", () => {
      model.update({ description: null });

      expect(model.description).toBeNull();
    });

    it("should update assetCategoryId", () => {
      model.update({ assetCategoryId: "cat-999" });

      expect(model.assetCategoryId).toBe("cat-999");
    });

    it("should update vendorId", () => {
      model.update({ vendorId: "vendor-999" });

      expect(model.vendorId).toBe("vendor-999");
    });

    it("should update defaultWarrantyMonths", () => {
      model.update({ defaultWarrantyMonths: 48 });

      expect(model.defaultWarrantyMonths).toBe(48);
    });

    it("should allow setting defaultWarrantyMonths to null", () => {
      model.update({ defaultWarrantyMonths: null });

      expect(model.defaultWarrantyMonths).toBeNull();
    });

    it("should update defaultAttributes", () => {
      model.update({ defaultAttributes: { cpu: "AMD Ryzen" } });

      expect(model.defaultAttributes).toEqual({ cpu: "AMD Ryzen" });
    });

    it("should allow setting defaultAttributes to null", () => {
      model.update({ defaultAttributes: null });

      expect(model.defaultAttributes).toBeNull();
    });

    it("should update multiple fields at once", () => {
      model.update({
        name: "Updated Name",
        code: "UPDT",
        description: "New description",
        defaultWarrantyMonths: 60,
      });

      expect(model.name).toBe("Updated Name");
      expect(model.code).toBe("UPDT");
      expect(model.description).toBe("New description");
      expect(model.defaultWarrantyMonths).toBe(60);
    });

    it("should update timestamp on update", () => {
      const beforeUpdate = model.updatedAt;

      model.update({ name: "New Name" });

      expect(model.updatedAt.getTime()).toBeGreaterThanOrEqual(
        beforeUpdate.getTime(),
      );
    });

    it("should validate name on update", () => {
      expect(() => model.update({ name: "A" })).toThrow(
        "Asset model name must be at least 2 characters",
      );
    });

    it("should validate code on update", () => {
      expect(() => model.update({ code: "A" })).toThrow(
        "Asset model code must be at least 2 characters",
      );
    });

    it("should validate warranty months on update", () => {
      expect(() => model.update({ defaultWarrantyMonths: -1 })).toThrow(
        "Warranty months cannot be negative",
      );
    });
  });

  describe("canBeDeleted method", () => {
    it("should return true when no assets exist", () => {
      const model = AssetModel.create(validCreateProps);

      expect(model.canBeDeleted(false)).toBe(true);
    });

    it("should return false when assets exist", () => {
      const model = AssetModel.create(validCreateProps);

      expect(model.canBeDeleted(true)).toBe(false);
    });
  });

  describe("setId method", () => {
    it("should set id when not already set", () => {
      const model = AssetModel.create(validCreateProps);

      model.setId("new-model-id");

      expect(model.id).toBe("new-model-id");
    });

    it("should throw error when trying to change existing id", () => {
      const model = AssetModel.reconstitute(validFullProps);

      expect(() => model.setId("different-id")).toThrow(
        "Cannot change asset model ID after it has been set",
      );
    });
  });

  describe("toObject method", () => {
    it("should return plain object representation", () => {
      const model = AssetModel.reconstitute(validFullProps);

      const obj = model.toObject();

      expect(obj).toEqual(validFullProps);
      expect(obj).not.toBe(validFullProps); // Should be a copy
    });
  });

  describe("equals method", () => {
    it("should return true for models with same id", () => {
      const model1 = AssetModel.reconstitute(validFullProps);
      const model2 = AssetModel.reconstitute({
        ...validFullProps,
        name: "Different Name",
      });

      expect(model1.equals(model2)).toBe(true);
    });

    it("should return false for models with different ids", () => {
      const model1 = AssetModel.reconstitute(validFullProps);
      const model2 = AssetModel.reconstitute({
        ...validFullProps,
        id: "different-id",
      });

      expect(model1.equals(model2)).toBe(false);
    });
  });
});
