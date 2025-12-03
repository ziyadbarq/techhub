/**
 * Local File Storage Service Implementation
 *
 * Implements file upload/download operations for managing uploaded files in the local file system.
 * Uses a date-based directory structure and CUID for unique file naming.
 *
 * Storage Strategy:
 * - Base path: /public/uploads/{year}/{month}/{cuid}.{ext}
 * - Example: /public/uploads/2025/11/clq1234567890abcdef.pdf
 * - Automatic directory creation
 * - Collision-free unique file names
 * - Preserves original file extensions
 *
 * Features:
 * - Structured logging with ILoggerService
 * - Proper error handling and validation
 * - Path security (stays within uploads directory)
 * - Metadata tracking (file name, MIME type)
 */

import { injectable, inject } from "inversify";
import { promises as fs } from "fs";
import path from "path";
import { createId } from "@paralleldrive/cuid2";
import type { IFileStorageService } from "@/core/services/file-storage.service.interface";
import type { ILoggerService } from "@/core/services/logger.service.interface";
import { DI_TOKENS } from "@/di/types";
import { Attachment } from "@/core/domain/entities/attachment.entity";

@injectable()
export class LocalFileStorageService implements IFileStorageService {
  /**
   * Base directory for uploads relative to project root
   */
  private readonly uploadsDir = "public/uploads";

  /**
   * Project root directory
   */
  private readonly projectRoot: string;

  constructor(
    @inject(DI_TOKENS.ILoggerService)
    private readonly logger: ILoggerService,
  ) {
    // Use process.cwd() as project root
    this.projectRoot = process.cwd();

    this.logger.debug("LocalFileStorageService initialized", {
      projectRoot: this.projectRoot,
      uploadsDir: this.uploadsDir,
    });
  }

  /**
   * Uploads a file to the storage system.
   *
   * Creates year/month directory structure and saves the file with a unique CUID-based name.
   * Preserves the original file extension.
   *
   * @param file - File content as Buffer
   * @param fileName - Original file name (used to extract extension)
   * @param mimeType - MIME type of the file
   * @returns Promise that resolves with the storage path relative to /public
   * @throws {Error} If directory creation fails or file write fails
   */
  async uploadFile(
    file: Buffer,
    fileName: string,
    mimeType: string,
  ): Promise<string> {
    try {
      // Generate date-based directory structure
      const now = new Date();
      const year = now.getFullYear().toString();
      const month = (now.getMonth() + 1).toString().padStart(2, "0");

      // Extract file extension from original file name
      const ext = path.extname(fileName).toLowerCase();
      if (!ext) {
        throw new Error(`File name must have an extension: ${fileName}`);
      }

      // Generate unique file name using CUID
      const uniqueId = createId();
      const uniqueFileName = `${uniqueId}${ext}`;

      // Build directory path: uploads/{year}/{month}
      const dirPath = path.join(this.uploadsDir, year, month);
      const fullDirPath = path.join(this.projectRoot, dirPath);

      // Build file path: uploads/{year}/{month}/{cuid}.{ext}
      const filePath = path.join(dirPath, uniqueFileName);
      const fullFilePath = path.join(this.projectRoot, filePath);

      // Security: Validate file content matches declared MIME type
      // This prevents malicious files disguised with fake extensions
      this.logger.debug("Validating file content", {
        fileName,
        mimeType,
        fileSize: file.length,
      });
      await Attachment.validateFileContent(file, mimeType);

      // Create directory if it doesn't exist
      await fs.mkdir(fullDirPath, { recursive: true });

      // Write file to disk (only after validation passes)
      await fs.writeFile(fullFilePath, file);

      this.logger.info("File uploaded successfully", {
        originalFileName: fileName,
        storagePath: filePath,
        mimeType,
        sizeBytes: file.length,
        year,
        month,
      });

      // Return path relative to /public
      return filePath;
    } catch (error) {
      this.logger.error(
        "Failed to upload file",
        error instanceof Error ? error : new Error(String(error)),
        {
          fileName,
          mimeType,
        },
      );

      throw new Error(
        `Failed to upload file: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Deletes a file from the storage system.
   *
   * @param storagePath - Storage path relative to /public
   * @throws {Error} If file doesn't exist or deletion fails
   */
  async deleteFile(storagePath: string): Promise<void> {
    try {
      // Validate path (must be within uploads directory)
      if (!this.isValidUploadPath(storagePath)) {
        throw new Error(`Invalid storage path: ${storagePath}`);
      }

      const fullPath = path.join(this.projectRoot, storagePath);

      // Check if file exists
      const exists = await this.fileExists(storagePath);
      if (!exists) {
        throw new Error(`File does not exist: ${storagePath}`);
      }

      // Delete file
      await fs.unlink(fullPath);

      this.logger.info("File deleted successfully", {
        storagePath,
      });
    } catch (error) {
      this.logger.error(
        "Failed to delete file",
        error instanceof Error ? error : new Error(String(error)),
        { storagePath },
      );

      throw new Error(
        `Failed to delete file: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Gets the public URL for accessing a file.
   *
   * Returns a URL path relative to the domain root.
   *
   * @param storagePath - Storage path relative to /public
   * @returns Public URL path (e.g., '/uploads/2025/11/clq1234567890abcdef.pdf')
   */
  getFileUrl(storagePath: string): string {
    // Validate path
    if (!this.isValidUploadPath(storagePath)) {
      this.logger.warn("Invalid storage path for URL generation", {
        storagePath,
      });
      throw new Error(`Invalid storage path: ${storagePath}`);
    }

    // Convert 'public/uploads/...' to '/uploads/...'
    // or 'uploads/...' to '/uploads/...'
    const normalizedPath = storagePath.replace(/^public\//, "");

    // Ensure path starts with /
    const url = normalizedPath.startsWith("/")
      ? normalizedPath
      : `/${normalizedPath}`;

    this.logger.debug("Generated file URL", {
      storagePath,
      url,
    });

    return url;
  }

  /**
   * Checks if a file exists in the storage system.
   *
   * @param storagePath - Storage path relative to /public
   * @returns Promise that resolves with true if file exists
   */
  async fileExists(storagePath: string): Promise<boolean> {
    try {
      // Validate path
      if (!this.isValidUploadPath(storagePath)) {
        return false;
      }

      const fullPath = path.join(this.projectRoot, storagePath);
      await fs.access(fullPath);
      return true;
    } catch {
      return false;
    }
  }

  async writeFile(filePath: string, content: string | Buffer): Promise<void> {
    const fullPath = this.resolveSafePath(filePath);
    await fs.mkdir(path.dirname(fullPath), { recursive: true });
    await fs.writeFile(fullPath, content);
  }

  async readFile(filePath: string, encoding?: "utf-8"): Promise<string>;
  async readFile(filePath: string, encoding: "binary"): Promise<Buffer>;
  async readFile(
    filePath: string,
    encoding: "utf-8" | "binary" = "utf-8",
  ): Promise<string | Buffer> {
    const fullPath = this.resolveSafePath(filePath);
    if (encoding === "binary") {
      return await fs.readFile(fullPath);
    }
    return await fs.readFile(fullPath, "utf-8");
  }

  // ========================================
  // Private Helper Methods
  // ========================================

  /**
   * Validates that a storage path is within the uploads directory.
   *
   * Security check to prevent path traversal attacks.
   *
   * @param storagePath - Storage path to validate
   * @returns True if path is valid and safe
   */
  private isValidUploadPath(storagePath: string): boolean {
    try {
      // Check for empty path
      if (!storagePath || storagePath.trim().length === 0) {
        return false;
      }

      // Normalize the path
      const normalizedPath = storagePath.replace(/^public\//, "");

      // Must start with 'uploads/'
      if (!normalizedPath.startsWith("uploads/")) {
        return false;
      }

      // Resolve full path
      const fullPath = path.join(this.projectRoot, normalizedPath);
      const uploadsFullPath = path.join(this.projectRoot, this.uploadsDir);

      // Ensure the resolved path is within uploads directory
      const normalizedFullPath = path.normalize(fullPath);
      const normalizedUploadsPath = path.normalize(uploadsFullPath);

      if (!normalizedFullPath.startsWith(normalizedUploadsPath)) {
        return false;
      }

      // Check for path traversal patterns
      if (storagePath.includes("..")) {
        return false;
      }

      // Check for invalid characters (null bytes, control characters)
      // eslint-disable-next-line no-control-regex
      const invalidChars = /[\x00-\x1F]/;
      if (invalidChars.test(storagePath)) {
        return false;
      }

      return true;
    } catch {
      return false;
    }
  }

  private resolveSafePath(filePath: string): string {
    if (!filePath || path.isAbsolute(filePath)) {
      throw new Error(`Invalid file path: ${filePath}`);
    }

    const normalizedPath = path.normalize(filePath);
    const fullPath = path.join(this.projectRoot, normalizedPath);
    const normalizedRoot = path.normalize(this.projectRoot);

    if (!fullPath.startsWith(normalizedRoot) || normalizedPath.includes("..")) {
      throw new Error(`Invalid file path: ${filePath}`);
    }

    return fullPath;
  }
}
