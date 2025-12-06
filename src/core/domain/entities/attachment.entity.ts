/**
 * Attachment Domain Entity
 *
 * Represents a file attachment linked to various entities (CI, Asset, Contract, License, etc.)
 * with polymorphic target support for flexible document management.
 */

import type { IIdGenerator } from "@/core/services/id-generator.service.interface";
import type { TargetObjectTypeEnum } from "@/generated/prisma";
import { ValidationError } from "../errors/validation.error";

// Security: Whitelist of allowed MIME types for file uploads
const ALLOWED_MIME_TYPES = [
  // Documents
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation", // .pptx
  "text/plain",
  "text/csv",
  "application/json",
  // Images
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
  "image/svg+xml",
  // Archives (for batch uploads)
  "application/zip",
  "application/x-7z-compressed",
  "application/x-rar-compressed",
  "application/gzip",
] as const;

// Security: Whitelist of allowed file extensions
const ALLOWED_EXTENSIONS = [
  // Documents
  ".pdf",
  ".doc",
  ".docx",
  ".xls",
  ".xlsx",
  ".ppt",
  ".pptx",
  ".txt",
  ".csv",
  ".json",
  // Images
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".webp",
  ".svg",
  // Archives
  ".zip",
  ".7z",
  ".rar",
  ".gz",
] as const;

export interface CreateAttachmentProps {
  attachmentTypeId: string;
  targetType: TargetObjectTypeEnum;
  targetId: string;
  fileName: string;
  filePath: string;
  mimeType?: string | null;
  sizeBytes?: bigint | null;
  uploadedById: string;
  note?: string | null;
}

export interface AttachmentProps extends CreateAttachmentProps {
  id: string;
  uploadedAt: Date;
}

export class Attachment {
  private readonly props: AttachmentProps;

  private constructor(props: AttachmentProps) {
    this.props = props;
  }

  // Getters
  get id(): string {
    return this.props.id;
  }

  get attachmentTypeId(): string {
    return this.props.attachmentTypeId;
  }

  set attachmentTypeId(value: string) {
    this.props.attachmentTypeId = value;
  }

  get targetType(): TargetObjectTypeEnum {
    return this.props.targetType;
  }

  get targetId(): string {
    return this.props.targetId;
  }

  get fileName(): string {
    return this.props.fileName;
  }

  set fileName(value: string) {
    Attachment.validateFileName(value);
    this.props.fileName = value.trim();
  }

  get filePath(): string {
    return this.props.filePath;
  }

  set filePath(value: string) {
    Attachment.validateFilePath(value);
    this.props.filePath = value.trim();
  }

  get mimeType(): string | null {
    return this.props.mimeType ?? null;
  }

  set mimeType(value: string | null) {
    if (value) {
      Attachment.validateMimeType(value);
    }
    this.props.mimeType = value;
  }

  get sizeBytes(): bigint | null {
    return this.props.sizeBytes ?? null;
  }

  set sizeBytes(value: bigint | null) {
    if (value !== null && value !== undefined) {
      Attachment.validateFileSize(value);
    }
    this.props.sizeBytes = value;
  }

  get uploadedById(): string {
    return this.props.uploadedById;
  }

  get uploadedAt(): Date {
    return this.props.uploadedAt;
  }

  get note(): string | null {
    return this.props.note ?? null;
  }

  set note(value: string | null) {
    this.props.note = value;
  }

  // Business logic methods

  /**
   * Get the file extension from the file name
   */
  public getFileExtension(): string {
    const parts = this.props.fileName.split(".");
    if (parts.length > 1) {
      return parts[parts.length - 1].toLowerCase();
    }
    return "";
  }

  /**
   * Check if the file is an image based on MIME type
   */
  public isImage(): boolean {
    if (!this.props.mimeType) {
      return false;
    }
    return this.props.mimeType.startsWith("image/");
  }

  /**
   * Check if the file is a PDF
   */
  public isPDF(): boolean {
    return this.props.mimeType === "application/pdf";
  }

  /**
   * Get file size in kilobytes
   */
  public getFileSizeKB(): number {
    if (!this.props.sizeBytes) {
      return 0;
    }
    return Number(this.props.sizeBytes) / 1024;
  }

  /**
   * Get file size in megabytes
   */
  public getFileSizeMB(): number {
    if (!this.props.sizeBytes) {
      return 0;
    }
    return Number(this.props.sizeBytes) / (1024 * 1024);
  }

  /**
   * Get human-readable file size
   */
  public getFormattedFileSize(): string {
    if (!this.props.sizeBytes) {
      return "0 B";
    }

    const bytes = Number(this.props.sizeBytes);
    const units = ["B", "KB", "MB", "GB", "TB"];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    if (unitIndex === 0) {
      return `${size} ${units[unitIndex]}`;
    }

    const rounded = Number(size.toFixed(1));
    return `${rounded} ${units[unitIndex]}`;
  }

  /**
   * Update target (polymorphic association)
   */
  public updateTarget(
    targetType: TargetObjectTypeEnum,
    targetId: string,
  ): void {
    this.props.targetType = targetType;
    this.props.targetId = targetId;
  }

  // Factory method
  public static create(
    props: CreateAttachmentProps,
    idGenerator: IIdGenerator,
  ): Attachment {
    // Validations
    Attachment.validateFileName(props.fileName);
    Attachment.validateFileExtension(props.fileName);
    Attachment.validateFilePath(props.filePath);
    if (props.sizeBytes !== null && props.sizeBytes !== undefined) {
      Attachment.validateFileSize(props.sizeBytes);
    }
    if (props.mimeType) {
      Attachment.validateMimeType(props.mimeType);
    }

    return new Attachment({
      id: idGenerator.generateId(),
      attachmentTypeId: props.attachmentTypeId,
      targetType: props.targetType,
      targetId: props.targetId,
      fileName: props.fileName.trim(),
      filePath: props.filePath.trim(),
      mimeType: props.mimeType ?? null,
      sizeBytes: props.sizeBytes ?? null,
      uploadedById: props.uploadedById,
      uploadedAt: new Date(),
      note: props.note?.trim() || null,
    });
  }

  // Restore from persistence
  public static restore(props: AttachmentProps): Attachment {
    return new Attachment(props);
  }

  // Validation methods
  private static validateFileName(fileName: string): void {
    if (!fileName || fileName.trim() === "") {
      throw new ValidationError("File name is required");
    }
    if (fileName.trim().length > 255) {
      throw new ValidationError("File name must not exceed 255 characters");
    }
  }

  private static validateFilePath(filePath: string): void {
    if (!filePath || filePath.trim() === "") {
      throw new ValidationError("File path is required");
    }
  }

  private static validateFileSize(sizeBytes: bigint): void {
    if (sizeBytes < BigInt(0)) {
      throw new ValidationError("File size cannot be negative");
    }
    // Optional: Add max file size validation (raise to 5GB for flexibility)
    const maxSize = BigInt(5) * BigInt(1024) * BigInt(1024) * BigInt(1024); // 5GB
    if (sizeBytes > maxSize) {
      throw new ValidationError("File size must not exceed 5GB");
    }
  }

  private static validateMimeType(mimeType: string): void {
    if (!mimeType || mimeType.trim() === "") {
      throw new ValidationError("MIME type cannot be empty");
    }
    // Basic MIME type validation (format: type/subtype)
    if (!/^[a-zA-Z0-9]+\/[a-zA-Z0-9+.-]+$/.test(mimeType)) {
      throw new ValidationError("Invalid MIME type format");
    }
    // Security: Check against whitelist
    if (!ALLOWED_MIME_TYPES.includes(mimeType as never)) {
      throw new ValidationError(
        `File type not allowed. Allowed types: PDF, Word, Excel, PowerPoint, images (PNG, JPG, GIF, WebP, SVG), text/JSON files, and archives (ZIP, 7Z, RAR, GZ)`,
      );
    }
  }

  private static validateFileExtension(fileName: string): void {
    const lastDotIndex = fileName.lastIndexOf(".");
    if (lastDotIndex === -1) {
      // Allow files without an extension (legacy or system-generated names)
      return;
    }
    const extension = fileName.substring(lastDotIndex).toLowerCase();
    // Security: Check against whitelist
    if (!ALLOWED_EXTENSIONS.includes(extension as never)) {
      throw new ValidationError(
        `File extension not allowed. Allowed extensions: ${ALLOWED_EXTENSIONS.join(", ")}`,
      );
    }
  }

  /**
   * Validate file content matches declared MIME type using magic number detection
   * This prevents attackers from uploading malicious files with fake extensions
   *
   * @param fileBuffer - The file buffer to validate
   * @param declaredMimeType - The MIME type claimed by the client
   * @throws ValidationError if content doesn't match declared type
   */
  public static async validateFileContent(
    fileBuffer: Buffer,
    declaredMimeType: string,
  ): Promise<void> {
    try {
      // Dynamic import to avoid bundling file-type in client
      const { fileTypeFromBuffer } = await import("file-type");
      const detectedType = await fileTypeFromBuffer(fileBuffer);

      // Some file types (like .txt, .csv) don't have magic numbers
      // Allow them to pass if they're in the whitelist
      const textBasedTypes = ["text/plain", "text/csv", "application/json"];
      if (textBasedTypes.includes(declaredMimeType)) {
        return; // Skip magic number check for text files
      }

      if (!detectedType) {
        throw new ValidationError(
          "Could not detect file type. File may be corrupted or unsupported.",
        );
      }

      // Check if detected MIME type matches declared type
      if (detectedType.mime !== declaredMimeType) {
        throw new ValidationError(
          `File content (${detectedType.mime}) does not match declared type (${declaredMimeType}). ` +
            `This may indicate a disguised executable or malicious file.`,
        );
      }
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      // If file-type library fails, log and allow through (fail open for rare cases)
      // In production, you may want to fail closed instead
      console.warn("File type detection failed:", error);
    }
  }
}
