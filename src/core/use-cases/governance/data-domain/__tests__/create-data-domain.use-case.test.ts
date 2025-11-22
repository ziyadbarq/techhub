/**
 * CreateDataDomainUseCase - Unit Tests
 *
 * Tests for the CreateDataDomainUseCase including:
 * - Successful data domain creation
 * - Validation errors
 * - Repository integration
 * - Duplicate code prevention
 */

import { describe, it, expect, beforeEach } from "vitest";
import { CreateDataDomainUseCase } from "../create-data-domain.use-case";
import type { IDataDomainRepository } from "@/core/repositories/data-domain.repository.interface";
import type { DataDomain } from "@/core/domain/entities/data-domain.entity";
import { ValidationError } from "@/core/domain/errors/validation.error";

/**
 * Mock DataDomain Repository
 */
class MockDataDomainRepository implements Partial<IDataDomainRepository> {
  private dataDomains = new Map<string, DataDomain>();
  private codes = new Set<string>();

  async create(dataDomain: DataDomain): Promise<DataDomain> {
    this.dataDomains.set(dataDomain.id, dataDomain);
    this.codes.add(dataDomain.code);
    return dataDomain;
  }

  async findById(id: string): Promise<DataDomain | null> {
    return this.dataDomains.get(id) || null;
  }

  async findByCode(code: string): Promise<DataDomain | null> {
    const found = Array.from(this.dataDomains.values()).find(
      (dd) => dd.code === code.toUpperCase(),
    );
    return found || null;
  }

  async existsByCode(code: string): Promise<boolean> {
    return this.codes.has(code.toUpperCase());
  }

  clear(): void {
    this.dataDomains.clear();
    this.codes.clear();
  }
}

describe("CreateDataDomainUseCase", () => {
  let useCase: CreateDataDomainUseCase;
  let mockRepository: MockDataDomainRepository;

  beforeEach(() => {
    mockRepository = new MockDataDomainRepository();
    useCase = new CreateDataDomainUseCase(
      mockRepository as unknown as IDataDomainRepository,
    );
    mockRepository.clear();
  });

  describe("execute - successful creation", () => {
    it("should create a data domain with valid data", async () => {
      // Arrange
      const props = {
        name: "Customer PII",
        code: "CUST-PII",
        description: "Customer Personal Identifiable Information",
      };

      // Act
      const result = await useCase.execute(props);

      // Assert
      expect(result).toBeDefined();
      expect(result.name).toBe("Customer PII");
      expect(result.code).toBe("CUST-PII");
      expect(result.description).toBe(
        "Customer Personal Identifiable Information",
      );
      expect(result.isActive).toBe(true);
      expect(result.id).toBeDefined();
    });

    it("should create data domain without description", async () => {
      // Arrange
      const props = {
        name: "Financial Data",
        code: "FIN-DATA",
      };

      // Act
      const result = await useCase.execute(props);

      // Assert
      expect(result.name).toBe("Financial Data");
      expect(result.code).toBe("FIN-DATA");
      expect(result.description).toBeNull();
    });

    it("should create data domain with isActive=false", async () => {
      // Arrange
      const props = {
        name: "Inactive Domain",
        code: "INACTIVE",
        isActive: false,
      };

      // Act
      const result = await useCase.execute(props);

      // Assert
      expect(result.isActive).toBe(false);
    });

    it("should auto-uppercase code", async () => {
      // Arrange
      const props = {
        name: "Test Domain",
        code: "test-code",
      };

      // Act
      const result = await useCase.execute(props);

      // Assert
      expect(result.code).toBe("TEST-CODE");
    });

    it("should persist data domain to repository", async () => {
      // Arrange
      const props = {
        name: "Persistent Domain",
        code: "PERSIST",
        description: "Should be saved",
      };

      // Act
      const created = await useCase.execute(props);

      // Assert - Verify domain exists in repository
      const found = await mockRepository.findById(created.id);
      expect(found).not.toBeNull();
      expect(found!.id).toBe(created.id);
      expect(found!.name).toBe("Persistent Domain");
    });
  });

  describe("execute - validation", () => {
    it("should throw ValidationError for empty name", async () => {
      // Arrange
      const props = {
        name: "",
        code: "TEST",
      };

      // Act & Assert
      await expect(useCase.execute(props)).rejects.toThrow(ValidationError);
    });

    it("should throw ValidationError for empty code", async () => {
      // Arrange
      const props = {
        name: "Test Domain",
        code: "",
      };

      // Act & Assert
      await expect(useCase.execute(props)).rejects.toThrow(ValidationError);
    });

    it("should throw ValidationError for name exceeding 255 characters", async () => {
      // Arrange
      const props = {
        name: "A".repeat(256),
        code: "TEST",
      };

      // Act & Assert
      await expect(useCase.execute(props)).rejects.toThrow(ValidationError);
    });

    it("should throw ValidationError for code with invalid characters", async () => {
      // Arrange
      const props = {
        name: "Test Domain",
        code: "INVALID CODE!",
      };

      // Act & Assert
      await expect(useCase.execute(props)).rejects.toThrow(ValidationError);
    });
  });

  describe("execute - duplicate prevention", () => {
    it("should throw error for duplicate code", async () => {
      // Arrange
      const props1 = {
        name: "Domain 1",
        code: "DUP-CODE",
      };
      const props2 = {
        name: "Domain 2",
        code: "DUP-CODE",
      };

      // Act
      await useCase.execute(props1);

      // Assert
      await expect(useCase.execute(props2)).rejects.toThrow(
        "Data domain with code DUP-CODE already exists",
      );
    });

    it("should be case-insensitive for duplicate checking", async () => {
      // Arrange
      const props1 = {
        name: "Domain 1",
        code: "TEST-CODE",
      };
      const props2 = {
        name: "Domain 2",
        code: "test-code",
      };

      // Act
      await useCase.execute(props1);

      // Assert
      await expect(useCase.execute(props2)).rejects.toThrow();
    });
  });

  describe("edge cases", () => {
    it("should handle name at max length (255 chars)", async () => {
      // Arrange
      const props = {
        name: "A".repeat(255),
        code: "MAX",
      };

      // Act
      const result = await useCase.execute(props);

      // Assert
      expect(result.name.length).toBe(255);
    });

    it("should handle code at max length (50 chars)", async () => {
      // Arrange
      const props = {
        name: "Test",
        code: "A".repeat(50),
      };

      // Act
      const result = await useCase.execute(props);

      // Assert
      expect(result.code.length).toBe(50);
    });

    it("should trim whitespace from name and code", async () => {
      // Arrange
      const props = {
        name: "  Trimmed Name  ",
        code: "  TRIM  ",
      };

      // Act
      const result = await useCase.execute(props);

      // Assert
      expect(result.name).toBe("Trimmed Name");
      expect(result.code).toBe("TRIM");
    });

    it("should handle code with hyphens and underscores", async () => {
      // Arrange
      const props = {
        name: "Test",
        code: "TEST_CODE-123",
      };

      // Act
      const result = await useCase.execute(props);

      // Assert
      expect(result.code).toBe("TEST_CODE-123");
    });

    it("should handle special characters in name", async () => {
      // Arrange
      const props = {
        name: "Domain (SAMA Compliance) - PII",
        code: "SAMA-PII",
      };

      // Act
      const result = await useCase.execute(props);

      // Assert
      expect(result.name).toBe("Domain (SAMA Compliance) - PII");
    });
  });
});
