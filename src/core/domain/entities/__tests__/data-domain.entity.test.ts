/**
 * DataDomain Entity - Unit Tests
 *
 * Tests for the DataDomain entity including:
 * - Entity creation and validation
 * - Business methods (activate, deactivate)
 * - Code formatting and validation
 */

import { describe, it, expect } from "vitest";
import { DataDomain } from "../data-domain.entity";
import { ValidationError } from "../../errors/validation.error";

describe("DataDomain Entity", () => {
  describe("create - successful creation", () => {
    it("should create a data domain with valid properties", () => {
      // Act
      const dataDomain = DataDomain.create({
        name: "Customer PII",
        code: "CUST-PII",
        description: "Personal Identifiable Information",
      });

      // Assert
      expect(dataDomain).toBeDefined();
      expect(dataDomain.name).toBe("Customer PII");
      expect(dataDomain.code).toBe("CUST-PII");
      expect(dataDomain.description).toBe("Personal Identifiable Information");
      expect(dataDomain.isActive).toBe(true);
      expect(dataDomain.id).toBeDefined();
      expect(dataDomain.createdAt).toBeInstanceOf(Date);
      expect(dataDomain.updatedAt).toBeInstanceOf(Date);
    });

    it("should auto-uppercase code", () => {
      // Act
      const dataDomain = DataDomain.create({
        name: "Financial Data",
        code: "fin-data",
      });

      // Assert
      expect(dataDomain.code).toBe("FIN-DATA");
    });

    it("should create with isActive=false when specified", () => {
      // Act
      const dataDomain = DataDomain.create({
        name: "Test Domain",
        code: "TEST",
        isActive: false,
      });

      // Assert
      expect(dataDomain.isActive).toBe(false);
    });

    it("should create without description (optional)", () => {
      // Act
      const dataDomain = DataDomain.create({
        name: "Minimal Domain",
        code: "MIN",
      });

      // Assert
      expect(dataDomain.description).toBeNull();
    });

    it("should trim whitespace from name and code", () => {
      // Act
      const dataDomain = DataDomain.create({
        name: "  Trimmed Name  ",
        code: "  TRIM-CODE  ",
      });

      // Assert
      expect(dataDomain.name).toBe("Trimmed Name");
      expect(dataDomain.code).toBe("TRIM-CODE");
    });
  });

  describe("create - validation", () => {
    it("should throw ValidationError for empty name", () => {
      // Act & Assert
      expect(() =>
        DataDomain.create({
          name: "",
          code: "TEST",
        }),
      ).toThrow(ValidationError);
      expect(() =>
        DataDomain.create({
          name: "",
          code: "TEST",
        }),
      ).toThrow("Data domain name is required");
    });

    it("should throw ValidationError for whitespace-only name", () => {
      // Act & Assert
      expect(() =>
        DataDomain.create({
          name: "   ",
          code: "TEST",
        }),
      ).toThrow(ValidationError);
    });

    it("should throw ValidationError for name exceeding 255 characters", () => {
      // Act & Assert
      expect(() =>
        DataDomain.create({
          name: "A".repeat(256),
          code: "TEST",
        }),
      ).toThrow(ValidationError);
      expect(() =>
        DataDomain.create({
          name: "A".repeat(256),
          code: "TEST",
        }),
      ).toThrow("Data domain name must not exceed 255 characters");
    });

    it("should throw ValidationError for empty code", () => {
      // Act & Assert
      expect(() =>
        DataDomain.create({
          name: "Test",
          code: "",
        }),
      ).toThrow(ValidationError);
      expect(() =>
        DataDomain.create({
          name: "Test",
          code: "",
        }),
      ).toThrow("Data domain code is required");
    });

    it("should throw ValidationError for whitespace-only code", () => {
      // Act & Assert
      expect(() =>
        DataDomain.create({
          name: "Test",
          code: "   ",
        }),
      ).toThrow(ValidationError);
    });

    it("should throw ValidationError for code exceeding 50 characters", () => {
      // Act & Assert
      expect(() =>
        DataDomain.create({
          name: "Test",
          code: "A".repeat(51),
        }),
      ).toThrow(ValidationError);
      expect(() =>
        DataDomain.create({
          name: "Test",
          code: "A".repeat(51),
        }),
      ).toThrow("Data domain code must not exceed 50 characters");
    });

    it("should throw ValidationError for code with invalid characters", () => {
      // Act & Assert
      expect(() =>
        DataDomain.create({
          name: "Test",
          code: "INVALID CODE!",
        }),
      ).toThrow(ValidationError);
      expect(() =>
        DataDomain.create({
          name: "Test",
          code: "INVALID CODE!",
        }),
      ).toThrow(
        "Data domain code must contain only alphanumeric characters, hyphens, and underscores",
      );
    });
  });

  describe("business methods", () => {
    it("should activate an inactive data domain", () => {
      // Arrange
      const dataDomain = DataDomain.create({
        name: "Test",
        code: "TEST",
        isActive: false,
      });

      // Act
      dataDomain.activate();

      // Assert
      expect(dataDomain.isActive).toBe(true);
    });

    it("should deactivate an active data domain", () => {
      // Arrange
      const dataDomain = DataDomain.create({
        name: "Test",
        code: "TEST",
      });

      // Act
      dataDomain.deactivate();

      // Assert
      expect(dataDomain.isActive).toBe(false);
    });

    it("should update code and auto-uppercase", () => {
      // Arrange
      const dataDomain = DataDomain.create({
        name: "Test",
        code: "OLD-CODE",
      });

      // Act
      dataDomain.updateCode("new-code");

      // Assert
      expect(dataDomain.code).toBe("NEW-CODE");
    });

    it("should throw ValidationError when updating code with invalid value", () => {
      // Arrange
      const dataDomain = DataDomain.create({
        name: "Test",
        code: "VALID",
      });

      // Act & Assert
      expect(() => dataDomain.updateCode("INVALID!")).toThrow(ValidationError);
    });
  });

  describe("edge cases", () => {
    it("should handle name at max length (255 chars)", () => {
      // Act
      const dataDomain = DataDomain.create({
        name: "A".repeat(255),
        code: "MAX",
      });

      // Assert
      expect(dataDomain.name.length).toBe(255);
    });

    it("should handle code at max length (50 chars)", () => {
      // Act
      const dataDomain = DataDomain.create({
        name: "Test",
        code: "A".repeat(50),
      });

      // Assert
      expect(dataDomain.code.length).toBe(50);
    });

    it("should handle code with hyphens and underscores", () => {
      // Act
      const dataDomain = DataDomain.create({
        name: "Test",
        code: "TEST_CODE-123",
      });

      // Assert
      expect(dataDomain.code).toBe("TEST_CODE-123");
    });

    it("should handle special characters in name", () => {
      // Act
      const dataDomain = DataDomain.create({
        name: "Data Domain (SAMA Compliance) - PII",
        code: "SAMA-PII",
      });

      // Assert
      expect(dataDomain.name).toBe("Data Domain (SAMA Compliance) - PII");
    });
  });
});
