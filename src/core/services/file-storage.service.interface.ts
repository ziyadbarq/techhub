/**
 * File Storage Service Interface
 *
 * Provides file upload/download operations for managing uploaded files.
 * Supports file uploads with automatic organization by date and unique file naming.
 *
 * Storage Strategy:
 * - Base path: /public/uploads/{year}/{month}/{cuid}.{ext}
 * - Example: /public/uploads/2025/11/clq1234567890abcdef.pdf
 * - Uses CUID for collision-free unique file names
 * - Automatically creates year/month directory structure
 */

/**
 * Service interface for managing uploaded files.
 *
 * This service is responsible for:
 * - Uploading files with unique names and organized storage
 * - Deleting files from storage
 * - Generating public URLs for file access
 * - Checking file existence
 *
 * **Storage Features:**
 * - Date-based organization (year/month folders)
 * - Collision-free unique file names using CUID
 * - Preserves original file extensions
 * - Returns relative paths for database storage
 * - Generates public URLs for file access
 */
export interface IFileStorageService {
  /**
   * Uploads a file to the storage system.
   *
   * Creates year/month directory structure and saves the file with a unique CUID-based name.
   * Preserves the original file extension.
   *
   * @param file - File content as Buffer
   * @param fileName - Original file name (used to extract extension)
   * @param mimeType - MIME type of the file (e.g., 'application/pdf', 'image/png')
   * @returns Promise that resolves with the storage path relative to /public
   *          (e.g., 'uploads/2025/11/clq1234567890abcdef.pdf')
   * @throws {Error} If directory creation fails or file write fails
   *
   * @example
   * ```typescript
   * // Upload a PDF file
   * const fileBuffer = await request.formData().get('file');
   * const storagePath = await fileStorage.uploadFile(
   *   fileBuffer,
   *   'invoice.pdf',
   *   'application/pdf'
   * );
   * // storagePath: 'uploads/2025/11/clq1234567890abcdef.pdf'
   * ```
   */
  uploadFile(file: Buffer, fileName: string, mimeType: string): Promise<string>;

  /**
   * Deletes a file from the storage system.
   *
   * @param storagePath - Storage path relative to /public (e.g., 'uploads/2025/11/clq1234567890abcdef.pdf')
   * @throws {Error} If file doesn't exist or deletion fails
   * @returns Promise that resolves when file is deleted
   *
   * @example
   * ```typescript
   * await fileStorage.deleteFile('uploads/2025/11/clq1234567890abcdef.pdf');
   * ```
   */
  deleteFile(storagePath: string): Promise<void>;

  /**
   * Gets the public URL for accessing a file.
   *
   * Returns a URL path relative to the domain root.
   *
   * @param storagePath - Storage path relative to /public (e.g., 'uploads/2025/11/clq1234567890abcdef.pdf')
   * @returns Public URL path (e.g., '/uploads/2025/11/clq1234567890abcdef.pdf')
   *
   * @example
   * ```typescript
   * const url = fileStorage.getFileUrl('uploads/2025/11/clq1234567890abcdef.pdf');
   * // url: '/uploads/2025/11/clq1234567890abcdef.pdf'
   * // Use in HTML: <a href={url} download>Download</a>
   * ```
   */
  getFileUrl(storagePath: string): string;

  /**
   * Checks if a file exists in the storage system.
   *
   * @param storagePath - Storage path relative to /public (e.g., 'uploads/2025/11/clq1234567890abcdef.pdf')
   * @returns Promise that resolves with true if file exists
   *
   * @example
   * ```typescript
   * const exists = await fileStorage.fileExists('uploads/2025/11/clq1234567890abcdef.pdf');
   * if (!exists) {
   *   throw new Error('File not found');
   * }
   * ```
   */
  fileExists(storagePath: string): Promise<boolean>;

  /**
   * Writes a file to storage at an arbitrary path.
   *
   * @param filePath - Relative file path
   * @param content - File contents as string or Buffer
   */
  writeFile(filePath: string, content: string | Buffer): Promise<void>;

  /**
   * Reads a file from storage.
   *
   * @param filePath - Relative file path
   * @param encoding - Optional encoding ('utf-8' for text, 'binary' for Buffer)
   */
  readFile(filePath: string, encoding?: "utf-8"): Promise<string>;
  readFile(filePath: string, encoding: "binary"): Promise<Buffer>;
}
