/**
 * Image Optimization Service
 * Handles avatar image processing using Sharp library
 */

import { injectable, inject } from "inversify";
import path from "path";
import fs from "fs/promises";
import type {
  IImageOptimizationService,
  AvatarOptimizationResult,
} from "@/core/services/image-optimization.service.interface";
import type { ILoggerService } from "@/core/services/logger.service.interface";
import { DI_TOKENS } from "@/di/types";

/**
 * Avatar size variants to generate
 * Covers common use cases from tiny icons to full profile display
 */
const AVATAR_SIZES = [32, 64, 128, 256] as const;

/**
 * WebP quality setting (0-100)
 * 85 provides good balance between quality and file size
 */
const WEBP_QUALITY = 85;

@injectable()
export class ImageOptimizationService implements IImageOptimizationService {
  constructor(
    @inject(DI_TOKENS.ILoggerService) private logger: ILoggerService,
  ) {}

  /**
   * Optimize avatar image and generate multiple size variants
   */
  async optimizeAvatar(
    buffer: Buffer,
    userId: string,
    originalFileName: string,
  ): Promise<AvatarOptimizationResult> {
    const operationId = `optimize-avatar-${userId}`;
    this.logger.info(`Starting avatar optimization for user ${userId}`, {
      originalFileName,
      bufferSize: buffer.length,
      operationId,
    });

    try {
      // Dynamic import to avoid bundling Sharp in client code
      const sharp = (await import("sharp")).default;

      // Define avatar directory path
      const avatarDir = path.join(
        process.cwd(),
        "public",
        "uploads",
        "avatars",
        userId,
      );

      // Delete old variants before creating new ones
      await this.deleteAvatarVariants(userId);

      // Create user avatar directory
      await fs.mkdir(avatarDir, { recursive: true });
      this.logger.debug(`Created avatar directory: ${avatarDir}`, {
        operationId,
      });

      // Determine original file extension
      const originalExt = path.extname(originalFileName);
      const originalPath = path.join(avatarDir, `original${originalExt}`);

      // Save original file for future reprocessing
      await fs.writeFile(originalPath, buffer);
      this.logger.debug(`Saved original file: ${originalPath}`, {
        operationId,
      });

      // Generate size variants
      const variants: AvatarOptimizationResult["variants"] = {
        original: `/uploads/avatars/${userId}/original${originalExt}`,
        32: "",
        64: "",
        128: "",
        256: "",
      };

      for (const size of AVATAR_SIZES) {
        const outputFileName = `${size}.webp`;
        const outputPath = path.join(avatarDir, outputFileName);

        await sharp(buffer)
          .resize(size, size, {
            fit: "cover", // Crop to square, covering entire area
            position: "center", // Center the crop
          })
          .rotate() // Auto-orient based on EXIF data
          .webp({ quality: WEBP_QUALITY })
          .toFile(outputPath);

        variants[size] = `/uploads/avatars/${userId}/${outputFileName}`;

        this.logger.debug(`Generated ${size}px variant`, {
          path: outputPath,
          operationId,
        });
      }

      // Create metadata file
      const metadata: AvatarOptimizationResult["metadata"] = {
        uploadedAt: new Date().toISOString(),
        originalFileName,
        originalMimeType: "image/webp", // All variants are WebP
        originalSizeBytes: buffer.length,
      };

      const metadataPath = path.join(avatarDir, "metadata.json");
      await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));

      this.logger.info(`Avatar optimization completed for user ${userId}`, {
        variants: Object.keys(variants),
        operationId,
      });

      return { variants, metadata };
    } catch (error) {
      this.logger.error(
        `Avatar optimization failed for user ${userId}`,
        error instanceof Error ? error : undefined,
        { originalFileName, operationId },
      );
      throw new Error(
        `Failed to optimize avatar: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Delete all avatar variants for a user
   */
  async deleteAvatarVariants(userId: string): Promise<void> {
    const avatarDir = path.join(
      process.cwd(),
      "public",
      "uploads",
      "avatars",
      userId,
    );

    try {
      // Check if directory exists
      await fs.access(avatarDir);

      // Directory exists, delete it recursively
      await fs.rm(avatarDir, { recursive: true, force: true });

      this.logger.debug(`Deleted avatar variants for user ${userId}`, {
        path: avatarDir,
      });
    } catch (error) {
      // Directory doesn't exist or couldn't be accessed - this is fine
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
        this.logger.warn(
          `Failed to delete avatar variants for user ${userId}`,
          {
            path: avatarDir,
            error: error instanceof Error ? error.message : String(error),
          },
        );
      }
    }
  }
}
