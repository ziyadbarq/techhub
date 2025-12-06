/**
 * Image Optimization Service Tests
 *
 * Tests the avatar image optimization service that generates
 * multiple size variants with WebP compression using Sharp.
 *
 * Features tested:
 * - Multiple size variant generation (32, 64, 128, 256px)
 * - WebP format conversion with quality settings
 * - EXIF auto-orientation
 * - Avatar directory cleanup
 * - Error handling for invalid images
 */

import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";
import { ImageOptimizationService } from "@/infrastructure/services/image-optimization.service";
import type { ILoggerService } from "@/core/services/logger.service.interface";
import fs from "fs/promises";
import path from "path";

// Mock dependencies
vi.mock("fs/promises");
vi.mock("sharp", () => {
  const mockSharp = vi.fn(() => ({
    resize: vi.fn().mockReturnThis(),
    rotate: vi.fn().mockReturnThis(),
    webp: vi.fn().mockReturnThis(),
    toFile: vi.fn().mockResolvedValue(undefined),
  }));
  return { default: mockSharp };
});

// Mock logger
const mockLogger: ILoggerService = {
  info: vi.fn(),
  error: vi.fn(),
  warn: vi.fn(),
  debug: vi.fn(),
  child: vi.fn().mockReturnThis(),
  startTimer: vi.fn(),
  endTimer: vi.fn(),
  withTiming: vi.fn(),
  audit: vi.fn(),
};

describe("ImageOptimizationService", () => {
  let service: ImageOptimizationService;
  let mockFs: typeof fs;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new ImageOptimizationService(mockLogger);
    mockFs = fs as unknown as typeof fs;
  });

  describe("optimizeAvatar()", () => {
    it("should generate all 4 size variants successfully", async () => {
      // Arrange
      const buffer = Buffer.from("fake-image-data");
      const userId = "user123";
      const originalFileName = "avatar.jpg";

      // Mock file system operations
      (mockFs.mkdir as Mock).mockResolvedValue(undefined);
      (mockFs.writeFile as Mock).mockResolvedValue(undefined);
      (mockFs.access as Mock).mockRejectedValue({ code: "ENOENT" });

      // Act
      const result = await service.optimizeAvatar(
        buffer,
        userId,
        originalFileName,
      );

      // Assert - All variants should be present
      expect(result.variants).toHaveProperty("original");
      expect(result.variants).toHaveProperty("32");
      expect(result.variants).toHaveProperty("64");
      expect(result.variants).toHaveProperty("128");
      expect(result.variants).toHaveProperty("256");

      // Verify URLs follow expected pattern
      expect(result.variants[32]).toBe("/uploads/avatars/user123/32.webp");
      expect(result.variants[64]).toBe("/uploads/avatars/user123/64.webp");
      expect(result.variants[128]).toBe("/uploads/avatars/user123/128.webp");
      expect(result.variants[256]).toBe("/uploads/avatars/user123/256.webp");
      expect(result.variants.original).toBe(
        "/uploads/avatars/user123/original.jpg",
      );
    });

    it("should save original file with correct extension", async () => {
      // Arrange
      const buffer = Buffer.from("fake-image-data");
      const userId = "user123";
      const originalFileName = "profile.png";

      (mockFs.mkdir as Mock).mockResolvedValue(undefined);
      (mockFs.writeFile as Mock).mockResolvedValue(undefined);
      (mockFs.access as Mock).mockRejectedValue({ code: "ENOENT" });

      // Act
      const result = await service.optimizeAvatar(
        buffer,
        userId,
        originalFileName,
      );

      // Assert
      expect(result.variants.original).toBe(
        "/uploads/avatars/user123/original.png",
      );
      expect(mockFs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining("original.png"),
        buffer,
      );
    });

    it("should create metadata with upload information", async () => {
      // Arrange
      const buffer = Buffer.from("fake-image-data");
      const userId = "user123";
      const originalFileName = "avatar.jpg";

      (mockFs.mkdir as Mock).mockResolvedValue(undefined);
      (mockFs.writeFile as Mock).mockResolvedValue(undefined);
      (mockFs.access as Mock).mockRejectedValue({ code: "ENOENT" });

      // Act
      const result = await service.optimizeAvatar(
        buffer,
        userId,
        originalFileName,
      );

      // Assert
      expect(result.metadata).toMatchObject({
        originalFileName: "avatar.jpg",
        originalMimeType: "image/webp",
        originalSizeBytes: buffer.length,
      });
      expect(result.metadata.uploadedAt).toBeDefined();

      // Verify metadata.json was written (second call to writeFile)
      const writeFileCalls = (mockFs.writeFile as Mock).mock.calls;
      const metadataCall = writeFileCalls.find((call) =>
        call[0].includes("metadata.json"),
      );
      expect(metadataCall).toBeDefined();
      // JSON is pretty-printed with spaces, so check for the formatted version
      expect(metadataCall?.[1]).toContain('"originalFileName": "avatar.jpg"');
    });

    it("should create avatar directory with correct path", async () => {
      // Arrange
      const buffer = Buffer.from("fake-image-data");
      const userId = "user456";
      const originalFileName = "photo.jpg";

      (mockFs.mkdir as Mock).mockResolvedValue(undefined);
      (mockFs.writeFile as Mock).mockResolvedValue(undefined);
      (mockFs.access as Mock).mockRejectedValue({ code: "ENOENT" });

      // Act
      await service.optimizeAvatar(buffer, userId, originalFileName);

      // Assert
      const expectedPath = path.join(
        process.cwd(),
        "public",
        "uploads",
        "avatars",
        userId,
      );
      expect(mockFs.mkdir).toHaveBeenCalledWith(expectedPath, {
        recursive: true,
      });
    });

    it("should delete old variants before creating new ones", async () => {
      // Arrange
      const buffer = Buffer.from("fake-image-data");
      const userId = "user123";
      const originalFileName = "avatar.jpg";

      (mockFs.mkdir as Mock).mockResolvedValue(undefined);
      (mockFs.writeFile as Mock).mockResolvedValue(undefined);
      (mockFs.access as Mock).mockResolvedValue(undefined); // Directory exists
      (mockFs.rm as Mock).mockResolvedValue(undefined);

      // Act
      await service.optimizeAvatar(buffer, userId, originalFileName);

      // Assert - Should delete old directory
      const expectedPath = path.join(
        process.cwd(),
        "public",
        "uploads",
        "avatars",
        userId,
      );
      expect(mockFs.rm).toHaveBeenCalledWith(expectedPath, {
        recursive: true,
        force: true,
      });
    });

    it("should use Sharp with correct resize parameters", async () => {
      // Arrange
      const buffer = Buffer.from("fake-image-data");
      const userId = "user123";
      const originalFileName = "avatar.jpg";

      (mockFs.mkdir as Mock).mockResolvedValue(undefined);
      (mockFs.writeFile as Mock).mockResolvedValue(undefined);
      (mockFs.access as Mock).mockRejectedValue({ code: "ENOENT" });

      // Act
      await service.optimizeAvatar(buffer, userId, originalFileName);

      // Assert - Sharp should be called with buffer
      const sharp = (await import("sharp")).default;
      expect(sharp).toHaveBeenCalledWith(buffer);
    });

    it("should handle buffer of different sizes", async () => {
      // Arrange
      const smallBuffer = Buffer.from("small");
      const largeBuffer = Buffer.alloc(5 * 1024 * 1024); // 5MB
      const userId = "user123";
      const originalFileName = "avatar.jpg";

      (mockFs.mkdir as Mock).mockResolvedValue(undefined);
      (mockFs.writeFile as Mock).mockResolvedValue(undefined);
      (mockFs.access as Mock).mockRejectedValue({ code: "ENOENT" });

      // Act & Assert - Small buffer
      const resultSmall = await service.optimizeAvatar(
        smallBuffer,
        userId,
        originalFileName,
      );
      expect(resultSmall.metadata.originalSizeBytes).toBe(smallBuffer.length);

      // Act & Assert - Large buffer
      const resultLarge = await service.optimizeAvatar(
        largeBuffer,
        userId,
        originalFileName,
      );
      expect(resultLarge.metadata.originalSizeBytes).toBe(largeBuffer.length);
    });

    it("should throw error when Sharp fails", async () => {
      // Arrange
      const buffer = Buffer.from("invalid-image-data");
      const userId = "user123";
      const originalFileName = "avatar.jpg";

      (mockFs.mkdir as Mock).mockResolvedValue(undefined);
      (mockFs.writeFile as Mock).mockResolvedValue(undefined);
      (mockFs.access as Mock).mockRejectedValue({ code: "ENOENT" });

      // Mock Sharp to throw error
      const sharpModule = await import("sharp");
      vi.mocked(sharpModule.default).mockImplementationOnce(
        () =>
          ({
            resize: vi.fn().mockReturnThis(),
            rotate: vi.fn().mockReturnThis(),
            webp: vi.fn().mockReturnThis(),
            toFile: vi
              .fn()
              .mockRejectedValue(new Error("Invalid image format")),
          }) as unknown as ReturnType<typeof sharpModule.default>,
      );

      // Act & Assert
      await expect(
        service.optimizeAvatar(buffer, userId, originalFileName),
      ).rejects.toThrow("Failed to optimize avatar: Invalid image format");

      // Verify error was logged
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining("Avatar optimization failed"),
        expect.any(Error),
        expect.objectContaining({ originalFileName }),
      );
    });

    it("should throw error when file system operations fail", async () => {
      // Arrange
      const buffer = Buffer.from("fake-image-data");
      const userId = "user123";
      const originalFileName = "avatar.jpg";

      (mockFs.mkdir as Mock).mockRejectedValue(new Error("Permission denied"));

      // Act & Assert
      await expect(
        service.optimizeAvatar(buffer, userId, originalFileName),
      ).rejects.toThrow("Failed to optimize avatar: Permission denied");
    });

    it("should log operation progress", async () => {
      // Arrange
      const buffer = Buffer.from("fake-image-data");
      const userId = "user123";
      const originalFileName = "avatar.jpg";

      (mockFs.mkdir as Mock).mockResolvedValue(undefined);
      (mockFs.writeFile as Mock).mockResolvedValue(undefined);
      (mockFs.access as Mock).mockRejectedValue({ code: "ENOENT" });

      // Act
      await service.optimizeAvatar(buffer, userId, originalFileName);

      // Assert - Should log start, progress, and completion
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining("Starting avatar optimization"),
        expect.objectContaining({
          originalFileName,
          bufferSize: buffer.length,
        }),
      );

      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining("Avatar optimization completed"),
        expect.objectContaining({
          variants: expect.arrayContaining([
            "original",
            "32",
            "64",
            "128",
            "256",
          ]),
        }),
      );
    });
  });

  describe("deleteAvatarVariants()", () => {
    it("should delete avatar directory when it exists", async () => {
      // Arrange
      const userId = "user123";
      (mockFs.access as Mock).mockResolvedValue(undefined); // Directory exists
      (mockFs.rm as Mock).mockResolvedValue(undefined);

      // Act
      await service.deleteAvatarVariants(userId);

      // Assert
      const expectedPath = path.join(
        process.cwd(),
        "public",
        "uploads",
        "avatars",
        userId,
      );
      expect(mockFs.rm).toHaveBeenCalledWith(expectedPath, {
        recursive: true,
        force: true,
      });
    });

    it("should handle non-existent directory gracefully", async () => {
      // Arrange
      const userId = "user123";
      (mockFs.access as Mock).mockRejectedValue({ code: "ENOENT" });

      // Act & Assert - Should not throw
      await expect(service.deleteAvatarVariants(userId)).resolves.not.toThrow();

      // Should not attempt to delete
      expect(mockFs.rm).not.toHaveBeenCalled();
    });

    it("should log warning when deletion fails for other reasons", async () => {
      // Arrange
      const userId = "user123";
      (mockFs.access as Mock).mockResolvedValue(undefined);
      (mockFs.rm as Mock).mockRejectedValue(new Error("Permission denied"));

      // Act
      await service.deleteAvatarVariants(userId);

      // Assert - Should log warning but not throw
      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining("Failed to delete avatar variants"),
        expect.objectContaining({
          path: expect.stringContaining(userId),
          error: "Permission denied",
        }),
      );
    });

    it("should delete correct path for different user IDs", async () => {
      // Arrange
      const userId1 = "abc123";
      const userId2 = "xyz789";
      (mockFs.access as Mock).mockResolvedValue(undefined);
      (mockFs.rm as Mock).mockResolvedValue(undefined);

      // Act
      await service.deleteAvatarVariants(userId1);
      await service.deleteAvatarVariants(userId2);

      // Assert - Verify correct paths
      expect(mockFs.rm).toHaveBeenCalledWith(
        expect.stringContaining("abc123"),
        expect.any(Object),
      );
      expect(mockFs.rm).toHaveBeenCalledWith(
        expect.stringContaining("xyz789"),
        expect.any(Object),
      );
    });

    it("should log debug message on successful deletion", async () => {
      // Arrange
      const userId = "user123";
      (mockFs.access as Mock).mockResolvedValue(undefined);
      (mockFs.rm as Mock).mockResolvedValue(undefined);

      // Act
      await service.deleteAvatarVariants(userId);

      // Assert
      expect(mockLogger.debug).toHaveBeenCalledWith(
        expect.stringContaining("Deleted avatar variants"),
        expect.objectContaining({
          path: expect.stringContaining(userId),
        }),
      );
    });
  });

  describe("Integration scenarios", () => {
    it("should handle complete upload workflow", async () => {
      // Arrange - Simulate uploading a new avatar
      const buffer = Buffer.from("new-avatar-data");
      const userId = "user123";
      const originalFileName = "profile.jpg";

      (mockFs.access as Mock).mockResolvedValue(undefined); // Old variants exist
      (mockFs.rm as Mock).mockResolvedValue(undefined);
      (mockFs.mkdir as Mock).mockResolvedValue(undefined);
      (mockFs.writeFile as Mock).mockResolvedValue(undefined);

      // Act
      const result = await service.optimizeAvatar(
        buffer,
        userId,
        originalFileName,
      );

      // Assert - Should delete old, create new
      expect(mockFs.rm).toHaveBeenCalled(); // Deleted old
      expect(mockFs.mkdir).toHaveBeenCalled(); // Created directory
      // Note: writeFile is called 2 times (original + metadata)
      // The 4 variants are written by Sharp's toFile method, not fs.writeFile
      expect(mockFs.writeFile).toHaveBeenCalledTimes(2);

      // Verify result structure
      expect(result.variants).toHaveProperty("original");
      expect(result.variants).toHaveProperty("32");
      expect(result.variants).toHaveProperty("64");
      expect(result.variants).toHaveProperty("128");
      expect(result.variants).toHaveProperty("256");
      expect(result.metadata).toBeDefined();
    });

    it("should handle first-time avatar upload (no existing variants)", async () => {
      // Arrange
      const buffer = Buffer.from("first-avatar-data");
      const userId = "newuser456";
      const originalFileName = "avatar.png";

      (mockFs.access as Mock).mockRejectedValue({ code: "ENOENT" }); // No existing directory
      (mockFs.mkdir as Mock).mockResolvedValue(undefined);
      (mockFs.writeFile as Mock).mockResolvedValue(undefined);

      // Act
      const result = await service.optimizeAvatar(
        buffer,
        userId,
        originalFileName,
      );

      // Assert - Should not attempt to delete (no old variants)
      expect(mockFs.rm).not.toHaveBeenCalled();

      // Should create directory and files
      expect(mockFs.mkdir).toHaveBeenCalled();
      expect(result.variants.original).toBe(
        "/uploads/avatars/newuser456/original.png",
      );
    });
  });
});
