/**
 * AssetCategory Domain Entity - Unit Tests
 *
 * Tests for the AssetCategory entity including:
 * - Factory method: create
 * - Factory method: reconstitute
 * - Validation rules
 * - Update methods
 * - Business logic methods
 * - Edge cases
 */

import { describe, it, expect, beforeEach } from "vitest";
import { AssetCategory } from "../asset-category.entity";
import type {
  AssetCategoryProps,
  CreateAssetCategoryProps,
} from "../asset-category.entity";

describe("AssetCategory Entity", () => {
  // Valid test data
  const validCreateProps: CreateAssetCategoryProps = {
    name: "Laptop",
    code: "LAPTOP",
    description: "Portable computers",
    lifecycleModelId: "lifecycle-001",
  };

  const validFullProps: AssetCategoryProps = {
    id: "cat-123",
    name: "Laptop",
    code: "LAPTOP",
    description: "Portable computers for employees",
    lifecycleModelId: "lifecycle-001",
    createdAt: new Date("2024-01-15"),
    updatedAt: new Date("2024-01-15"),
  };

  describe("create - factory method", () => {
    it("should create an asset category with valid data", () => {
      const category = AssetCategory.create(validCreateProps);

      expect(category.name).toBe("Laptop");
      expect(category.code).toBe("LAPTOP");
      expect(category.description).toBe("Portable computers");
      expect(category.lifecycleModelId).toBe("lifecycle-001");
      expect(category.id).toBe(""); // Not set until repository assigns it
    });

    it("should create an asset category with minimal required data", () => {
      const category = AssetCategory.create({
        name: "Monitor",
        code: "MON",
      });

      expect(category.name).toBe("Monitor");
      expect(category.code).toBe("MON");
      expect(category.description).toBeNull();
      expect(category.lifecycleModelId).toBeNull();
    });

    it("should normalize code to uppercase", () => {
      const category = AssetCategory.create({
        name: "Desktop",
        code: "desktop",
      });

      expect(category.code).toBe("DESKTOP");
    });

    it("should trim whitespace from name", () => {
      const category = AssetCategory.create({
        name: "  Server  ",
        code: "SERVER",
      });

      expect(category.name).toBe("Server");
    });

    it("should trim whitespace from code", () => {
      const category = AssetCategory.create({
        name: "Printer",
        code: "  PRN  ",
      });

      expect(category.code).toBe("PRN");
    });

    it("should trim whitespace from description", () => {
      const category = AssetCategory.create({
        name: "Router",
        code: "RTR",
        description: "  Network routers  ",
      });

      expect(category.description).toBe("Network routers");
    });

    it("should set timestamps on creation", () => {
      const before = new Date();
      const category = AssetCategory.create(validCreateProps);
      const after = new Date();

      expect(category.createdAt.getTime()).toBeGreaterThanOrEqual(
        before.getTime(),
      );
      expect(category.createdAt.getTime()).toBeLessThanOrEqual(after.getTime());
      expect(category.updatedAt.getTime()).toBeGreaterThanOrEqual(
        before.getTime(),
      );
      expect(category.updatedAt.getTime()).toBeLessThanOrEqual(after.getTime());
    });
  });

  describe("create - validation", () => {
    describe("name validation", () => {
      it("should throw error for empty name", () => {
        expect(() =>
          AssetCategory.create({
            name: "",
            code: "TEST",
          }),
        ).toThrow("Asset category name cannot be empty");
      });

      it("should throw error for whitespace-only name", () => {
        expect(() =>
          AssetCategory.create({
            name: "   ",
            code: "TEST",
          }),
        ).toThrow("Asset category name cannot be empty");
      });

      it("should throw error for name too short", () => {
        expect(() =>
          AssetCategory.create({
            name: "A",
            code: "TEST",
          }),
        ).toThrow("Asset category name must be at least 2 characters");
      });

      it("should throw error for name too long", () => {
        expect(() =>
          AssetCategory.create({
            name: "A".repeat(201),
            code: "TEST",
          }),
        ).toThrow("Asset category name cannot exceed 200 characters");
      });

      it("should accept name at minimum length", () => {
        const category = AssetCategory.create({
          name: "AB",
          code: "TEST",
        });

        expect(category.name).toBe("AB");
      });

      it("should accept name at maximum length", () => {
        const name = "A".repeat(200);
        const category = AssetCategory.create({
          name,
          code: "TEST",
        });

        expect(category.name).toBe(name);
      });
    });

    describe("code validation", () => {
      it("should throw error for empty code", () => {
        expect(() =>
          AssetCategory.create({
            name: "Test Category",
            code: "",
          }),
        ).toThrow("Asset category code cannot be empty");
      });

      it("should throw error for whitespace-only code", () => {
        expect(() =>
          AssetCategory.create({
            name: "Test Category",
            code: "   ",
          }),
        ).toThrow("Asset category code cannot be empty");
      });

      it("should throw error for code too short", () => {
        expect(() =>
          AssetCategory.create({
            name: "Test Category",
            code: "A",
          }),
        ).toThrow("Asset category code must be at least 2 characters");
      });

      it("should throw error for code too long", () => {
        expect(() =>
          AssetCategory.create({
            name: "Test Category",
            code: "A".repeat(51),
          }),
        ).toThrow("Asset category code cannot exceed 50 characters");
      });

      it("should throw error for code with invalid characters", () => {
        expect(() =>
          AssetCategory.create({
            name: "Test Category",
            code: "TEST@CODE",
          }),
        ).toThrow(
          "Asset category code can only contain letters, numbers, hyphens, and underscores",
        );
      });

      it("should throw error for code with spaces", () => {
        expect(() =>
          AssetCategory.create({
            name: "Test Category",
            code: "TEST CODE",
          }),
        ).toThrow(
          "Asset category code can only contain letters, numbers, hyphens, and underscores",
        );
      });

      it("should accept code with hyphens and underscores", () => {
        const category = AssetCategory.create({
          name: "Test Category",
          code: "TEST-CODE_01",
        });

        expect(category.code).toBe("TEST-CODE_01");
      });

      it("should accept code at minimum length", () => {
        const category = AssetCategory.create({
          name: "Test",
          code: "AB",
        });

        expect(category.code).toBe("AB");
      });

      it("should accept code at maximum length", () => {
        const code = "A".repeat(50);
        const category = AssetCategory.create({
          name: "Test",
          code,
        });

        expect(category.code).toBe(code);
      });
    });
  });

  describe("reconstitute - factory method", () => {
    it("should reconstitute an asset category from persistence", () => {
      const category = AssetCategory.reconstitute(validFullProps);

      expect(category.id).toBe("cat-123");
      expect(category.name).toBe("Laptop");
      expect(category.code).toBe("LAPTOP");
      expect(category.description).toBe("Portable computers for employees");
      expect(category.lifecycleModelId).toBe("lifecycle-001");
      expect(category.createdAt).toEqual(new Date("2024-01-15"));
      expect(category.updatedAt).toEqual(new Date("2024-01-15"));
    });
  });

  describe("update method", () => {
    let category: AssetCategory;

    beforeEach(() => {
      category = AssetCategory.create(validCreateProps);
    });

    it("should update name", () => {
      category.update({ name: "Notebook" });

      expect(category.name).toBe("Notebook");
    });

    it("should update code", () => {
      category.update({ code: "NB" });

      expect(category.code).toBe("NB");
    });

    it("should normalize updated code to uppercase", () => {
      category.update({ code: "notebook" });

      expect(category.code).toBe("NOTEBOOK");
    });

    it("should update description", () => {
      category.update({ description: "Updated description" });

      expect(category.description).toBe("Updated description");
    });

    it("should allow setting description to null", () => {
      category.update({ description: null });

      expect(category.description).toBeNull();
    });

    it("should update lifecycle model", () => {
      category.update({ lifecycleModelId: "lifecycle-002" });

      expect(category.lifecycleModelId).toBe("lifecycle-002");
    });

    it("should update multiple fields at once", () => {
      category.update({
        name: "Updated Name",
        code: "UPDT",
        description: "New description",
      });

      expect(category.name).toBe("Updated Name");
      expect(category.code).toBe("UPDT");
      expect(category.description).toBe("New description");
    });

    it("should update timestamp on update", () => {
      const beforeUpdate = category.updatedAt;

      category.update({ name: "New Name" });

      expect(category.updatedAt.getTime()).toBeGreaterThanOrEqual(
        beforeUpdate.getTime(),
      );
    });

    it("should validate name on update", () => {
      expect(() => category.update({ name: "A" })).toThrow(
        "Asset category name must be at least 2 characters",
      );
    });

    it("should validate code on update", () => {
      expect(() => category.update({ code: "A" })).toThrow(
        "Asset category code must be at least 2 characters",
      );
    });
  });

  describe("setLifecycleModel method", () => {
    it("should set lifecycle model", () => {
      const category = AssetCategory.create({
        name: "Test",
        code: "TEST",
      });

      category.setLifecycleModel("lifecycle-001");

      expect(category.lifecycleModelId).toBe("lifecycle-001");
    });

    it("should allow setting lifecycle model to null", () => {
      const category = AssetCategory.create({
        name: "Test",
        code: "TEST",
        lifecycleModelId: "lifecycle-001",
      });

      category.setLifecycleModel(null);

      expect(category.lifecycleModelId).toBeNull();
    });

    it("should update timestamp", () => {
      const category = AssetCategory.create({
        name: "Test",
        code: "TEST",
      });
      const before = category.updatedAt;

      category.setLifecycleModel("lifecycle-001");

      expect(category.updatedAt.getTime()).toBeGreaterThanOrEqual(
        before.getTime(),
      );
    });
  });

  describe("canBeDeleted method", () => {
    it("should return true when no asset models and no assets", () => {
      const category = AssetCategory.create({
        name: "Test",
        code: "TEST",
      });

      expect(category.canBeDeleted(false, false)).toBe(true);
    });

    it("should return false when has asset models", () => {
      const category = AssetCategory.create({
        name: "Test",
        code: "TEST",
      });

      expect(category.canBeDeleted(true, false)).toBe(false);
    });

    it("should return false when has assets", () => {
      const category = AssetCategory.create({
        name: "Test",
        code: "TEST",
      });

      expect(category.canBeDeleted(false, true)).toBe(false);
    });

    it("should return false when has both asset models and assets", () => {
      const category = AssetCategory.create({
        name: "Test",
        code: "TEST",
      });

      expect(category.canBeDeleted(true, true)).toBe(false);
    });
  });

  describe("hasLifecycleModel method", () => {
    it("should return true when lifecycle model is set", () => {
      const category = AssetCategory.create({
        name: "Laptop",
        code: "LAPTOP",
        lifecycleModelId: "lifecycle-001",
      });

      expect(category.hasLifecycleModel()).toBe(true);
    });

    it("should return false when lifecycle model is not set", () => {
      const category = AssetCategory.create({
        name: "Laptop",
        code: "LAPTOP",
      });

      expect(category.hasLifecycleModel()).toBe(false);
    });
  });

  describe("setId method", () => {
    it("should set id when not already set", () => {
      const category = AssetCategory.create(validCreateProps);

      category.setId("new-cat-id");

      expect(category.id).toBe("new-cat-id");
    });

    it("should throw error when trying to change existing id", () => {
      const category = AssetCategory.reconstitute(validFullProps);

      expect(() => category.setId("different-id")).toThrow(
        "Cannot change asset category ID after it has been set",
      );
    });
  });

  describe("toObject method", () => {
    it("should return plain object representation", () => {
      const category = AssetCategory.reconstitute(validFullProps);

      const obj = category.toObject();

      expect(obj).toEqual(validFullProps);
      expect(obj).not.toBe(validFullProps); // Should be a copy
    });
  });

  describe("equals method", () => {
    it("should return true for categories with same id", () => {
      const cat1 = AssetCategory.reconstitute(validFullProps);
      const cat2 = AssetCategory.reconstitute({
        ...validFullProps,
        name: "Different Name",
      });

      expect(cat1.equals(cat2)).toBe(true);
    });

    it("should return false for categories with different ids", () => {
      const cat1 = AssetCategory.reconstitute(validFullProps);
      const cat2 = AssetCategory.reconstitute({
        ...validFullProps,
        id: "different-id",
      });

      expect(cat1.equals(cat2)).toBe(false);
    });
  });
});
