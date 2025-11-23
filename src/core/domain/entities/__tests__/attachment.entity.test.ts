/**
 * Attachment Entity - Unit Tests
 *
 * Tests for the Attachment entity including:
 * - Entity creation and validation
 * - Business methods (isImage, isPDF, getFormattedFileSize)
 * - Polymorphic target validation
 */

import { describe, it, expect } from "vitest";
import { Attachment } from "../attachment.entity";
import { TargetObjectTypeEnum } from "@/generated/prisma";
import { ValidationError } from "../../errors/validation.error";

describe("Attachment Entity", () => {
  describe("create - successful creation", () => {
    it("should create an attachment with valid properties", () => {
      // Act
      const attachment = Attachment.create({
        targetType: TargetObjectTypeEnum.ASSET,
        targetId: "asset-123",
        fileName: "document.pdf",
        filePath: "uploads/2025/01/abc123.pdf",
        mimeType: "application/pdf",
        sizeBytes: BigInt(1024 * 100), // 100 KB
        attachmentTypeId: "type-1",
        uploadedById: "user-1",
      });

      // Assert
      expect(attachment).toBeDefined();
      expect(attachment.targetType).toBe(TargetObjectTypeEnum.ASSET);
      expect(attachment.targetId).toBe("asset-123");
      expect(attachment.fileName).toBe("document.pdf");
      expect(attachment.filePath).toBe("uploads/2025/01/abc123.pdf");
      expect(attachment.mimeType).toBe("application/pdf");
      expect(attachment.sizeBytes).toBe(BigInt(1024 * 100));
      expect(attachment.attachmentTypeId).toBe("type-1");
      expect(attachment.uploadedById).toBe("user-1");
      expect(attachment.id).toBeDefined();
      expect(attachment.uploadedAt).toBeInstanceOf(Date);
    });

    it("should create attachment without optional mimeType", () => {
      // Act
      const attachment = Attachment.create({
        targetType: TargetObjectTypeEnum.CI,
        targetId: "ci-123",
        fileName: "config.txt",
        filePath: "uploads/config.txt",
        sizeBytes: BigInt(512),
        attachmentTypeId: "type-2",
        uploadedById: "user-1",
      });

      // Assert
      expect(attachment.mimeType).toBeNull();
    });

    it("should support all target types", () => {
      // Arrange
      const targetTypes = [
        TargetObjectTypeEnum.ASSET,
        TargetObjectTypeEnum.CI,
        TargetObjectTypeEnum.CONTRACT,
        TargetObjectTypeEnum.LICENSE_ENTITLEMENT,
        TargetObjectTypeEnum.PERSON,
        TargetObjectTypeEnum.WARRANTY,
      ];

      // Act & Assert
      targetTypes.forEach((targetType) => {
        const attachment = Attachment.create({
          targetType,
          targetId: "target-123",
          fileName: "file.pdf",
          filePath: "uploads/file.pdf",
          sizeBytes: BigInt(1024),
          attachmentTypeId: "type-1",
          uploadedById: "user-1",
        });
        expect(attachment.targetType).toBe(targetType);
      });
    });
  });

  describe("create - validation", () => {
    it("should throw ValidationError for empty fileName", () => {
      // Act & Assert
      expect(() =>
        Attachment.create({
          targetType: TargetObjectTypeEnum.ASSET,
          targetId: "asset-123",
          fileName: "",
          filePath: "uploads/file.pdf",
          sizeBytes: BigInt(1024),
          attachmentTypeId: "type-1",
          uploadedById: "user-1",
        }),
      ).toThrow(ValidationError);
      expect(() =>
        Attachment.create({
          targetType: TargetObjectTypeEnum.ASSET,
          targetId: "asset-123",
          fileName: "",
          filePath: "uploads/file.pdf",
          sizeBytes: BigInt(1024),
          attachmentTypeId: "type-1",
          uploadedById: "user-1",
        }),
      ).toThrow("File name is required");
    });

    it("should throw ValidationError for fileName exceeding 255 characters", () => {
      // Act & Assert
      expect(() =>
        Attachment.create({
          targetType: TargetObjectTypeEnum.ASSET,
          targetId: "asset-123",
          fileName: "A".repeat(256) + ".pdf",
          filePath: "uploads/file.pdf",
          sizeBytes: BigInt(1024),
          attachmentTypeId: "type-1",
          uploadedById: "user-1",
        }),
      ).toThrow(ValidationError);
    });

    it("should throw ValidationError for empty filePath", () => {
      // Act & Assert
      expect(() =>
        Attachment.create({
          targetType: TargetObjectTypeEnum.ASSET,
          targetId: "asset-123",
          fileName: "file.pdf",
          filePath: "",
          sizeBytes: BigInt(1024),
          attachmentTypeId: "type-1",
          uploadedById: "user-1",
        }),
      ).toThrow(ValidationError);
      expect(() =>
        Attachment.create({
          targetType: TargetObjectTypeEnum.ASSET,
          targetId: "asset-123",
          fileName: "file.pdf",
          filePath: "",
          sizeBytes: BigInt(1024),
          attachmentTypeId: "type-1",
          uploadedById: "user-1",
        }),
      ).toThrow("File path is required");
    });

    it("should throw ValidationError for negative file size", () => {
      // Act & Assert
      expect(() =>
        Attachment.create({
          targetType: TargetObjectTypeEnum.ASSET,
          targetId: "asset-123",
          fileName: "file.pdf",
          filePath: "uploads/file.pdf",
          sizeBytes: BigInt(-100),
          attachmentTypeId: "type-1",
          uploadedById: "user-1",
        }),
      ).toThrow(ValidationError);
      expect(() =>
        Attachment.create({
          targetType: TargetObjectTypeEnum.ASSET,
          targetId: "asset-123",
          fileName: "file.pdf",
          filePath: "uploads/file.pdf",
          sizeBytes: BigInt(-100),
          attachmentTypeId: "type-1",
          uploadedById: "user-1",
        }),
      ).toThrow("File size cannot be negative");
    });
  });

  describe("business methods - file type detection", () => {
    it("should detect image files", () => {
      // Arrange
      const imageTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];

      // Act & Assert
      imageTypes.forEach((mimeType) => {
        const attachment = Attachment.create({
          targetType: TargetObjectTypeEnum.ASSET,
          targetId: "asset-123",
          fileName: "photo.jpg",
          filePath: "uploads/photo.jpg",
          mimeType,
          sizeBytes: BigInt(1024),
          attachmentTypeId: "type-1",
          uploadedById: "user-1",
        });
        expect(attachment.isImage()).toBe(true);
        expect(attachment.isPDF()).toBe(false);
      });
    });

    it("should detect PDF files", () => {
      // Arrange
      const attachment = Attachment.create({
        targetType: TargetObjectTypeEnum.CONTRACT,
        targetId: "contract-123",
        fileName: "contract.pdf",
        filePath: "uploads/contract.pdf",
        mimeType: "application/pdf",
        sizeBytes: BigInt(1024 * 500),
        attachmentTypeId: "type-1",
        uploadedById: "user-1",
      });

      // Act & Assert
      expect(attachment.isPDF()).toBe(true);
      expect(attachment.isImage()).toBe(false);
    });

    it("should return false for unknown file types", () => {
      // Arrange
      const attachment = Attachment.create({
        targetType: TargetObjectTypeEnum.ASSET,
        targetId: "asset-123",
        fileName: "data.json",
        filePath: "uploads/data.json",
        mimeType: "application/json",
        sizeBytes: BigInt(512),
        attachmentTypeId: "type-1",
        uploadedById: "user-1",
      });

      // Act & Assert
      expect(attachment.isImage()).toBe(false);
      expect(attachment.isPDF()).toBe(false);
    });

    it("should handle missing mimeType", () => {
      // Arrange
      const attachment = Attachment.create({
        targetType: TargetObjectTypeEnum.ASSET,
        targetId: "asset-123",
        fileName: "file.txt",
        filePath: "uploads/file.txt",
        sizeBytes: BigInt(100),
        attachmentTypeId: "type-1",
        uploadedById: "user-1",
      });

      // Act & Assert
      expect(attachment.isImage()).toBe(false);
      expect(attachment.isPDF()).toBe(false);
    });
  });

  describe("business methods - file extension", () => {
    it("should extract file extension", () => {
      // Arrange
      const testCases = [
        { fileName: "document.pdf", expected: "pdf" },
        { fileName: "photo.JPG", expected: "jpg" },
        { fileName: "archive.tar.gz", expected: "gz" },
        { fileName: "no-extension", expected: "" },
      ];

      // Act & Assert
      testCases.forEach(({ fileName, expected }) => {
        const attachment = Attachment.create({
          targetType: TargetObjectTypeEnum.ASSET,
          targetId: "asset-123",
          fileName,
          filePath: "uploads/" + fileName,
          sizeBytes: BigInt(1024),
          attachmentTypeId: "type-1",
          uploadedById: "user-1",
        });
        expect(attachment.getFileExtension()).toBe(expected);
      });
    });
  });

  describe("business methods - file size formatting", () => {
    it("should format bytes correctly", () => {
      // Arrange
      const attachment = Attachment.create({
        targetType: TargetObjectTypeEnum.ASSET,
        targetId: "asset-123",
        fileName: "tiny.txt",
        filePath: "uploads/tiny.txt",
        sizeBytes: BigInt(512),
        attachmentTypeId: "type-1",
        uploadedById: "user-1",
      });

      // Act & Assert
      expect(attachment.getFormattedFileSize()).toBe("512 B");
    });

    it("should format kilobytes correctly", () => {
      // Arrange
      const attachment = Attachment.create({
        targetType: TargetObjectTypeEnum.ASSET,
        targetId: "asset-123",
        fileName: "small.txt",
        filePath: "uploads/small.txt",
        sizeBytes: BigInt(1024 * 5.5), // 5.5 KB
        attachmentTypeId: "type-1",
        uploadedById: "user-1",
      });

      // Act & Assert
      expect(attachment.getFormattedFileSize()).toBe("5.5 KB");
    });

    it("should format megabytes correctly", () => {
      // Arrange
      const attachment = Attachment.create({
        targetType: TargetObjectTypeEnum.CONTRACT,
        targetId: "contract-123",
        fileName: "contract.pdf",
        filePath: "uploads/contract.pdf",
        sizeBytes: (1024n * 1024n * 23n) / 10n, // ~2.3 MB
        attachmentTypeId: "type-1",
        uploadedById: "user-1",
      });

      // Act & Assert
      expect(attachment.getFormattedFileSize()).toBe("2.3 MB");
    });

    it("should format gigabytes correctly", () => {
      // Arrange
      const attachment = Attachment.create({
        targetType: TargetObjectTypeEnum.ASSET,
        targetId: "asset-123",
        fileName: "large-file.zip",
        filePath: "uploads/large-file.zip",
        sizeBytes: (1024n * 1024n * 1024n * 15n) / 10n, // 1.5 GB
        attachmentTypeId: "type-1",
        uploadedById: "user-1",
      });

      // Act & Assert
      expect(attachment.getFormattedFileSize()).toBe("1.5 GB");
    });
  });

  describe("business methods - getFileSizeMB", () => {
    it("should return file size in megabytes", () => {
      // Arrange
      const attachment = Attachment.create({
        targetType: TargetObjectTypeEnum.ASSET,
        targetId: "asset-123",
        fileName: "file.zip",
        filePath: "uploads/file.zip",
        sizeBytes: BigInt(1024 * 1024 * 5), // 5 MB
        attachmentTypeId: "type-1",
        uploadedById: "user-1",
      });

      // Act & Assert
      expect(attachment.getFileSizeMB()).toBe(5);
    });

    it("should handle fractional megabytes", () => {
      // Arrange
      const attachment = Attachment.create({
        targetType: TargetObjectTypeEnum.ASSET,
        targetId: "asset-123",
        fileName: "file.pdf",
        filePath: "uploads/file.pdf",
        sizeBytes: BigInt(1024 * 1024 * 2 + 1024 * 512), // 2.5 MB
        attachmentTypeId: "type-1",
        uploadedById: "user-1",
      });

      // Act & Assert
      expect(attachment.getFileSizeMB()).toBeCloseTo(2.5, 1);
    });
  });
});
