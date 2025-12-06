/**
 * File Storage Service Implementation
 *
 * Provides secure file system operations using Node.js fs/promises.
 * Includes validation, error handling, and security features.
 *
 * **Security Features:**
 * - Path traversal protection
 * - File size validation (10MB limit)
 * - Content validation (null bytes, UTF-8)
 * - Safe path resolution
 */

import { injectable, inject } from "inversify";
import { promises as fs } from "fs";
import path from "path";
import type { IFileStorageService, IIdGenerator } from "@/core/services";
import { DI_TOKENS } from "@/di/types";

type FileEncoding = "utf-8" | "binary";

/**
 * Maximum file size: 10MB
 */
const MAX_FILE_SIZE = 10 * 1024 * 1024;

@injectable()
export class FileStorageService implements IFileStorageService {
  /**
   * Base directory for uploads relative to project root
   */
  private readonly uploadsDir = "public/uploads";

  /**
   * Project root directory
   */
  private readonly projectRoot: string;

  constructor(
    @inject(DI_TOKENS.IIdGenerator)
    private readonly idGenerator: IIdGenerator,
  ) {
    // Use process.cwd() as project root
    this.projectRoot = process.cwd();
  }

  // ========================================
  // Upload Operations
  // ========================================

  async uploadFile(
    file: Buffer,
    fileName: string,
    _mimeType: string,
  ): Promise<string> {
    // Enforce max size
    if (file.length > MAX_FILE_SIZE) {
      throw new Error(
        `File exceeds maximum size limit (${MAX_FILE_SIZE} bytes)`,
      );
    }

    const now = new Date();
    const year = now.getFullYear().toString();
    const month = (now.getMonth() + 1).toString().padStart(2, "0");

    const ext = path.extname(fileName).toLowerCase();
    if (!ext) {
      throw new Error(`File name must have an extension: ${fileName}`);
    }

    const uniqueName = `${this.idGenerator.generateId()}${ext}`;
    const dirPath = path.join(this.uploadsDir, year, month);
    const storagePath = path.join(dirPath, uniqueName);

    if (!this.validatePath(storagePath)) {
      throw new Error(`Invalid storage path: ${storagePath}`);
    }

    await this.ensureDir(dirPath);
    const fullPath = this.resolveFullPath(storagePath);
    await fs.writeFile(fullPath, file);

    return storagePath;
  }

  getFileUrl(storagePath: string): string {
    const normalizedPath = storagePath.replace(/^public\//, "");
    return normalizedPath.startsWith("/")
      ? normalizedPath
      : `/${normalizedPath}`;
  }

  // ========================================
  // Core File Operations
  // ========================================

  async writeFile(filePath: string, content: string | Buffer): Promise<void> {
    // Validate path
    if (!this.validatePath(filePath)) {
      throw new Error(`Invalid file path: ${filePath}`);
    }

    // Validate content if it's a string
    if (typeof content === "string") {
      if (!this.validateContent(content)) {
        throw new Error(
          `Invalid file content: exceeds size limit or contains invalid characters`,
        );
      }
    } else {
      // Validate buffer size
      if (content.length > MAX_FILE_SIZE) {
        throw new Error(
          `File exceeds maximum size limit (${MAX_FILE_SIZE} bytes)`,
        );
      }
    }

    const fullPath = this.resolveFullPath(filePath);

    try {
      // Ensure parent directory exists
      await this.ensureDir(path.dirname(filePath));

      // Write file
      if (typeof content === "string") {
        await fs.writeFile(fullPath, content, "utf-8");
      } else {
        await fs.writeFile(fullPath, content);
      }
    } catch (error) {
      throw new Error(
        `Failed to write file: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  async readFile(filePath: string, encoding?: "utf-8"): Promise<string>;
  async readFile(filePath: string, encoding: "binary"): Promise<Buffer>;
  async readFile(
    filePath: string,
    encoding?: FileEncoding,
  ): Promise<string | Buffer>;
  async readFile(
    filePath: string,
    encoding: FileEncoding = "utf-8",
  ): Promise<string | Buffer> {
    // Validate path
    if (!this.validatePath(filePath)) {
      throw new Error(`Invalid file path: ${filePath}`);
    }

    const fullPath = this.resolveFullPath(filePath);

    // Check if file exists
    if (!(await this.fileExists(filePath))) {
      throw new Error(`File does not exist: ${filePath}`);
    }

    try {
      if (encoding === "binary") {
        return await fs.readFile(fullPath);
      } else {
        return await fs.readFile(fullPath, "utf-8");
      }
    } catch (error) {
      throw new Error(
        `Failed to read file: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  async deleteFile(filePath: string): Promise<void> {
    // Validate path
    if (!this.validatePath(filePath)) {
      throw new Error(`Invalid file path: ${filePath}`);
    }

    const fullPath = this.resolveFullPath(filePath);

    // Check if file exists
    if (!(await this.fileExists(filePath))) {
      throw new Error(`File does not exist: ${filePath}`);
    }

    try {
      await fs.unlink(fullPath);
    } catch (error) {
      throw new Error(
        `Failed to delete file: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  // ========================================
  // Directory Operations
  // ========================================

  async ensureDir(dirPath: string): Promise<void> {
    // Validate path
    if (!this.validatePath(dirPath)) {
      throw new Error(`Invalid directory path: ${dirPath}`);
    }

    const fullPath = this.resolveFullPath(dirPath);

    try {
      await fs.mkdir(fullPath, { recursive: true });
    } catch (error) {
      throw new Error(
        `Failed to create directory: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  // ========================================
  // Utility Operations
  // ========================================

  async fileExists(filePath: string): Promise<boolean> {
    const fullPath = this.resolveFullPath(filePath);
    try {
      await fs.access(fullPath);
      return true;
    } catch {
      return false;
    }
  }

  async getFileSize(filePath: string): Promise<number> {
    // Validate path
    if (!this.validatePath(filePath)) {
      throw new Error(`Invalid file path: ${filePath}`);
    }

    const fullPath = this.resolveFullPath(filePath);

    // Check if file exists
    if (!(await this.fileExists(filePath))) {
      throw new Error(`File does not exist: ${filePath}`);
    }

    try {
      const stats = await fs.stat(fullPath);
      return stats.size;
    } catch (error) {
      throw new Error(
        `Failed to get file size: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  // ========================================
  // Validation Operations
  // ========================================

  validatePath(filePath: string): boolean {
    try {
      // Check for empty path
      if (!filePath || filePath.trim().length === 0) {
        return false;
      }

      // Check for absolute paths (should be relative)
      if (path.isAbsolute(filePath)) {
        return false;
      }

      // Resolve path and ensure it stays within project root
      const fullPath = this.resolveFullPath(filePath);
      const normalizedRoot = path.normalize(this.projectRoot);
      const normalizedPath = path.normalize(fullPath);

      // Ensure the resolved path starts with the project root
      if (!normalizedPath.startsWith(normalizedRoot)) {
        return false;
      }

      // Check for path traversal patterns
      if (filePath.includes("..")) {
        // Allow .. only if it doesn't escape the root after resolution
        const relative = path.relative(normalizedRoot, normalizedPath);
        if (relative.startsWith("..") || path.isAbsolute(relative)) {
          return false;
        }
      }

      // Check for invalid characters (null bytes, control characters)
      // eslint-disable-next-line no-control-regex
      const invalidChars = /[\x00-\x1F]/;
      if (invalidChars.test(filePath)) {
        return false;
      }

      return true;
    } catch {
      return false;
    }
  }

  validateContent(content: string): boolean {
    try {
      // Check for empty content
      if (!content || content.length === 0) {
        return false;
      }

      // Check file size
      const sizeInBytes = Buffer.byteLength(content, "utf-8");
      if (sizeInBytes > MAX_FILE_SIZE) {
        return false;
      }

      // Check for null bytes or invalid control characters
      // Allow: newline (\n), carriage return (\r), tab (\t)
      // eslint-disable-next-line no-control-regex
      const invalidChars = /[\x00-\x08\x0B\x0C\x0E-\x1F]/;
      if (invalidChars.test(content)) {
        return false;
      }

      return true;
    } catch {
      return false;
    }
  }

  // ========================================
  // Private Helper Methods
  // ========================================

  /**
   * Resolves a relative path to an absolute path within the project root.
   *
   * @param filePath - Relative file path
   * @returns Absolute file path
   */
  private resolveFullPath(filePath: string): string {
    return path.join(this.projectRoot, filePath);
  }
}
