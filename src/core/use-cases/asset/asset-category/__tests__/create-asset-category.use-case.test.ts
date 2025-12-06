/**
 * CreateAssetCategoryUseCase - Unit Tests
 *
 * Tests for the CreateAssetCategoryUseCase including:
 * - Successful category creation
 * - Auto-generated code
 * - Business rule validation (uniqueness)
 * - Entity validation (delegated to entity)
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { CreateAssetCategoryUseCase } from "../create-asset-category.use-case";
import type { CreateAssetCategoryProps } from "../create-asset-category.use-case";
import type { IAssetCategoryRepository } from "@/core/repositories/asset-category.repository.interface";
import type { ICodeGeneratorService } from "@/core/services/code-generator.service.interface";
import type { IIdGenerator } from "@/core/services/id-generator.service.interface";
import type { AssetCategory } from "@/core/domain/entities/asset-category.entity";

/**
 * Mock Asset Category Repository
 */
class MockAssetCategoryRepository implements Partial<IAssetCategoryRepository> {
  private categories = new Map<string, AssetCategory>();
  private codes = new Set<string>();
  private names = new Set<string>();
  private idCounter = 1;

  async create(category: AssetCategory): Promise<AssetCategory> {
    if (!category.id) {
      category.setId(`cat-${this.idCounter++}`);
    }
    this.categories.set(category.id, category);
    this.codes.add(category.code);
    this.names.add(category.name.toLowerCase());
    return category;
  }

  async existsByCode(code: string): Promise<boolean> {
    return this.codes.has(code.toUpperCase());
  }

  async existsByName(name: string): Promise<boolean> {
    return this.names.has(name.toLowerCase());
  }

  clear(): void {
    this.categories.clear();
    this.codes.clear();
    this.names.clear();
    this.idCounter = 1;
  }

  // Helper to pre-populate data for tests
  addExistingCategory(code: string, name: string): void {
    this.codes.add(code.toUpperCase());
    this.names.add(name.toLowerCase());
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

// Mock ID generator for tests
const mockIdGenerator: IIdGenerator = {
  generateId: vi.fn(() => "test-cuid-clx7abc123"),
};

describe("CreateAssetCategoryUseCase", () => {
  let useCase: CreateAssetCategoryUseCase;
  let mockRepository: MockAssetCategoryRepository;
  let mockCodeGenerator: MockCodeGeneratorService;

  beforeEach(() => {
    mockRepository = new MockAssetCategoryRepository();
    mockCodeGenerator = new MockCodeGeneratorService();
    useCase = new CreateAssetCategoryUseCase(
      mockRepository as unknown as IAssetCategoryRepository,
      mockCodeGenerator as unknown as ICodeGeneratorService,
      mockIdGenerator,
    );
  });

  describe("execute - successful creation", () => {
    it("should create a category with valid data", async () => {
      const props: CreateAssetCategoryProps = {
        name: "Laptop",
        code: "LAPTOP",
        description: "Portable computers",
      };

      const result = await useCase.execute(props);

      expect(result).toBeDefined();
      expect(result.name).toBe("Laptop");
      expect(result.code).toBe("LAPTOP");
      expect(result.description).toBe("Portable computers");
      expect(result.id).toBeDefined();
    });

    it("should create a category with minimal data", async () => {
      const props: CreateAssetCategoryProps = {
        name: "Monitor",
        code: "MON",
      };

      const result = await useCase.execute(props);

      expect(result.name).toBe("Monitor");
      expect(result.code).toBe("MON");
      expect(result.description).toBeNull();
    });

    it("should create a category with lifecycle model", async () => {
      const props: CreateAssetCategoryProps = {
        name: "Server",
        code: "SRV",
        lifecycleModelId: "lifecycle-001",
      };

      const result = await useCase.execute(props);

      expect(result.lifecycleModelId).toBe("lifecycle-001");
    });
  });

  describe("execute - auto-generated code", () => {
    it("should auto-generate code when not provided", async () => {
      const props: CreateAssetCategoryProps = {
        name: "Auto Generated",
      };

      const result = await useCase.execute(props);

      expect(result.code).toBe("CAT-000001");
    });

    it("should auto-generate code when empty string provided", async () => {
      const props: CreateAssetCategoryProps = {
        name: "Empty Code",
        code: "",
      };

      const result = await useCase.execute(props);

      expect(result.code).toMatch(/^CAT-\d{6}$/);
    });

    it("should generate sequential codes", async () => {
      await useCase.execute({ name: "First" });
      await useCase.execute({ name: "Second" });
      const third = await useCase.execute({ name: "Third" });

      expect(third.code).toBe("CAT-000003");
    });

    it("should use provided code instead of auto-generating", async () => {
      const props: CreateAssetCategoryProps = {
        name: "Custom Code",
        code: "CUSTOM",
      };

      const result = await useCase.execute(props);

      expect(result.code).toBe("CUSTOM");
    });
  });

  describe("execute - business rule validation", () => {
    it("should reject duplicate code", async () => {
      mockRepository.addExistingCategory("LAPTOP", "Existing Laptop");

      const props: CreateAssetCategoryProps = {
        name: "New Laptop",
        code: "LAPTOP", // Duplicate code
      };

      await expect(useCase.execute(props)).rejects.toThrow(/already exists/);
    });

    it("should be case-insensitive for code uniqueness", async () => {
      mockRepository.addExistingCategory("LAPTOP", "Laptop");

      const props: CreateAssetCategoryProps = {
        name: "New Category",
        code: "laptop", // Lowercase duplicate
      };

      await expect(useCase.execute(props)).rejects.toThrow(/already exists/);
    });

    it("should reject duplicate name", async () => {
      mockRepository.addExistingCategory("LAP", "Laptop");

      const props: CreateAssetCategoryProps = {
        name: "Laptop", // Duplicate name
        code: "LAPTOP2",
      };

      await expect(useCase.execute(props)).rejects.toThrow(/already exists/);
    });

    it("should be case-insensitive for name uniqueness", async () => {
      mockRepository.addExistingCategory("LAP", "Laptop");

      const props: CreateAssetCategoryProps = {
        name: "LAPTOP", // Uppercase duplicate
        code: "LAP2",
      };

      await expect(useCase.execute(props)).rejects.toThrow(/already exists/);
    });

    it("should check code before name for duplicates", async () => {
      mockRepository.addExistingCategory("LAPTOP", "Laptop");

      const props: CreateAssetCategoryProps = {
        name: "Laptop", // Both duplicate
        code: "LAPTOP",
      };

      // Should mention code error first
      await expect(useCase.execute(props)).rejects.toThrow(
        /code.*already exists/,
      );
    });
  });

  describe("execute - entity validation", () => {
    it("should reject name that is too short", async () => {
      const props: CreateAssetCategoryProps = {
        name: "A", // Only 1 character
        code: "TEST",
      };

      await expect(useCase.execute(props)).rejects.toThrow(
        /at least 2 characters/,
      );
    });

    it("should reject name that is too long", async () => {
      const props: CreateAssetCategoryProps = {
        name: "A".repeat(201), // 201 characters
        code: "TEST",
      };

      await expect(useCase.execute(props)).rejects.toThrow(
        /cannot exceed 200 characters/,
      );
    });

    it("should reject code with invalid characters", async () => {
      const props: CreateAssetCategoryProps = {
        name: "Test Category",
        code: "TEST@CODE", // @ is not allowed
      };

      await expect(useCase.execute(props)).rejects.toThrow(
        /can only contain letters, numbers, hyphens, and underscores/,
      );
    });

    it("should reject code that is too short", async () => {
      const props: CreateAssetCategoryProps = {
        name: "Test Category",
        code: "A", // Only 1 character
      };

      await expect(useCase.execute(props)).rejects.toThrow(
        /at least 2 characters/,
      );
    });
  });

  describe("edge cases", () => {
    it("should normalize code to uppercase", async () => {
      const props: CreateAssetCategoryProps = {
        name: "Test",
        code: "lowercase",
      };

      const result = await useCase.execute(props);

      expect(result.code).toBe("LOWERCASE");
    });

    it("should trim whitespace from name", async () => {
      const props: CreateAssetCategoryProps = {
        name: "  Trimmed Name  ",
        code: "TRIM",
      };

      const result = await useCase.execute(props);

      expect(result.name).toBe("Trimmed Name");
    });

    it("should trim whitespace from description", async () => {
      const props: CreateAssetCategoryProps = {
        name: "Test",
        code: "TEST",
        description: "  Description with spaces  ",
      };

      const result = await useCase.execute(props);

      expect(result.description).toBe("Description with spaces");
    });
  });
});
