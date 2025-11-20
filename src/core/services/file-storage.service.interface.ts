/**
 * File Storage Service Interface
 *
 * Provides secure file system operations with validation and error handling.
 * Supports both text and binary files.
 */

/**
 * File encoding types
 */
export type FileEncoding = "utf-8" | "binary";

/**
 * Service interface for managing files on the file system.
 *
 * This service is responsible for:
 * - Reading and writing files (text and binary)
 * - Directory management
 * - File validation and security
 * - File metadata operations
 *
 * **Security Features:**
 * - Path traversal protection
 * - File size validation
 * - Content validation (UTF-8, null bytes)
 * - Safe path resolution
 */
export interface IFileStorageService {
  // ========================================
  // Core File Operations
  // ========================================

  /**
   * Writes content to a file.
   *
   * Creates parent directories if they don't exist.
   * Validates file size and content before writing.
   *
   * @param filePath - Relative path from project root
   * @param content - Content to write (string or Buffer for binary)
   * @throws {Error} If path is invalid, content exceeds size limit, or write fails
   * @returns Promise that resolves when file is written
   *
   * @example
   * ```typescript
   * // Write text file
   * await fileStorage.writeFile('.ai-debug/prompt.txt', 'Hello World');
   *
   * // Write binary file
   * const imageBuffer = await fetchImage();
   * await fileStorage.writeFile('uploads/logo.png', imageBuffer);
   * ```
   */
  writeFile(filePath: string, content: string | Buffer): Promise<void>;

  /**
   * Reads content from a file.
   *
   * @param filePath - Relative path from project root
   * @param encoding - File encoding ('utf-8' for text, 'binary' for Buffer). Default: 'utf-8'
   * @throws {Error} If file doesn't exist or read fails
   * @returns Promise that resolves with the file content
   *
   * @example
   * ```typescript
   * // Read text file
   * const text = await fileStorage.readFile('.ai-debug/prompt.txt');
   *
   * // Read binary file
   * const buffer = await fileStorage.readFile('uploads/logo.png', 'binary');
   * ```
   */
  readFile(filePath: string, encoding?: "utf-8"): Promise<string>;
  readFile(filePath: string, encoding: "binary"): Promise<Buffer>;
  readFile(filePath: string, encoding?: FileEncoding): Promise<string | Buffer>;

  /**
   * Deletes a file.
   *
   * @param filePath - Relative path from project root
   * @throws {Error} If file doesn't exist or deletion fails
   * @returns Promise that resolves when file is deleted
   *
   * @example
   * ```typescript
   * await fileStorage.deleteFile('.ai-debug/old-trace.json');
   * ```
   */
  deleteFile(filePath: string): Promise<void>;

  // ========================================
  // Directory Operations
  // ========================================

  /**
   * Ensures a directory exists, creating it if necessary.
   *
   * Creates all parent directories recursively.
   *
   * @param dirPath - Relative directory path from project root
   * @throws {Error} If directory creation fails
   * @returns Promise that resolves when directory exists
   *
   * @example
   * ```typescript
   * await fileStorage.ensureDir('.ai-debug/prompts');
   * ```
   */
  ensureDir(dirPath: string): Promise<void>;

  // ========================================
  // Utility Operations
  // ========================================

  /**
   * Checks if a file or directory exists.
   *
   * @param filePath - Relative path from project root
   * @returns Promise that resolves with true if path exists
   *
   * @example
   * ```typescript
   * if (await fileStorage.fileExists('.ai-debug/session.json')) {
   *   const session = await fileStorage.readFile('.ai-debug/session.json');
   * }
   * ```
   */
  fileExists(filePath: string): Promise<boolean>;

  /**
   * Gets the size of a file in bytes.
   *
   * @param filePath - Relative path from project root
   * @throws {Error} If file doesn't exist
   * @returns Promise that resolves with file size in bytes
   *
   * @example
   * ```typescript
   * const size = await fileStorage.getFileSize('.ai-debug/trace.json');
   * console.log(`File size: ${size} bytes`);
   * ```
   */
  getFileSize(filePath: string): Promise<number>;

  // ========================================
  // Validation Operations
  // ========================================

  /**
   * Validates a file path for security and correctness.
   *
   * Checks for:
   * - Path traversal attempts (../)
   * - Invalid characters
   * - Absolute paths (should be relative)
   * - Empty paths
   *
   * @param filePath - Path to validate
   * @returns True if path is valid and safe
   *
   * @example
   * ```typescript
   * if (!fileStorage.validatePath('../../../etc/passwd')) {
   *   throw new Error('Invalid path: path traversal detected');
   * }
   * ```
   */
  validatePath(filePath: string): boolean;

  /**
   * Validates text content for safety.
   *
   * Checks for:
   * - Null bytes (\x00)
   * - Invalid UTF-8 sequences
   * - Size limits (10MB default)
   *
   * @param content - Content to validate
   * @returns True if content is valid
   *
   * @example
   * ```typescript
   * if (!fileStorage.validateContent(userInput)) {
   *   throw new Error('Invalid content: contains null bytes');
   * }
   * ```
   */
  validateContent(content: string): boolean;
}
