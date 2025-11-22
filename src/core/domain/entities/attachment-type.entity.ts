/**
 * AttachmentType Domain Entity
 *
 * Represents a classification for attachments (e.g., "Invoice", "Photo", "Diagram")
 * with validation rules for file types and size limits.
 */

import { v4 as uuid } from "uuid";

export interface CreateAttachmentTypeProps {
  name: string;
  code: string;
  description?: string | null;
  allowedExtensions?: string[];
  maxFileSizeMB?: number;
  isActive?: boolean;
}

export interface AttachmentTypeProps extends CreateAttachmentTypeProps {
  id: string;
  allowedExtensions: string[];
  maxFileSizeMB: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class AttachmentType {
  private readonly props: AttachmentTypeProps;

  private constructor(props: AttachmentTypeProps) {
    this.props = props;
  }

  // Getters
  get id(): string {
    return this.props.id;
  }

  get name(): string {
    return this.props.name;
  }

  set name(value: string) {
    AttachmentType.validateName(value);
    this.props.name = value.trim();
  }

  get code(): string {
    return this.props.code;
  }

  set code(value: string) {
    AttachmentType.validateCode(value);
    this.props.code = value.trim().toUpperCase();
  }

  get description(): string | null {
    return this.props.description ?? null;
  }

  set description(value: string | null) {
    this.props.description = value;
  }

  get allowedExtensions(): string[] {
    return [...this.props.allowedExtensions];
  }

  get maxFileSizeMB(): number {
    return this.props.maxFileSizeMB;
  }

  set maxFileSizeMB(value: number) {
    AttachmentType.validateMaxFileSizeMB(value);
    this.props.maxFileSizeMB = value;
  }

  get isActive(): boolean {
    return this.props.isActive;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  // Business logic methods
  public activate(): void {
    this.props.isActive = true;
  }

  public deactivate(): void {
    this.props.isActive = false;
  }

  public updateAllowedExtensions(extensions: string[]): void {
    AttachmentType.validateAllowedExtensions(extensions);
    this.props.allowedExtensions = extensions.map((ext) =>
      ext.trim().toLowerCase().replace(/^\./, ""),
    );
  }

  public updateCode(code: string): void {
    AttachmentType.validateCode(code);
    this.props.code = code.trim().toUpperCase();
  }

  // Factory method
  public static create(props: CreateAttachmentTypeProps): AttachmentType {
    // Validations
    AttachmentType.validateName(props.name);
    AttachmentType.validateCode(props.code);

    const allowedExtensions = props.allowedExtensions ?? [];
    AttachmentType.validateAllowedExtensions(allowedExtensions);

    const maxFileSizeMB = props.maxFileSizeMB ?? 100;
    AttachmentType.validateMaxFileSizeMB(maxFileSizeMB);

    const now = new Date();
    return new AttachmentType({
      id: uuid(),
      name: props.name.trim(),
      code: props.code.trim().toUpperCase(),
      description: props.description?.trim() || null,
      allowedExtensions: allowedExtensions.map((ext) =>
        ext.trim().toLowerCase().replace(/^\./, ""),
      ),
      maxFileSizeMB,
      isActive: props.isActive ?? true,
      createdAt: now,
      updatedAt: now,
    });
  }

  // Restore from persistence
  public static restore(props: AttachmentTypeProps): AttachmentType {
    return new AttachmentType(props);
  }

  // Validation methods
  private static validateName(name: string): void {
    if (!name || name.trim() === "") {
      throw new Error("Attachment type name is required");
    }
    if (name.length > 255) {
      throw new Error("Attachment type name must not exceed 255 characters");
    }
  }

  private static validateCode(code: string): void {
    if (!code || code.trim() === "") {
      throw new Error("Attachment type code is required");
    }
    if (code.length > 50) {
      throw new Error("Attachment type code must not exceed 50 characters");
    }
    if (!/^[A-Z0-9_-]+$/i.test(code)) {
      throw new Error(
        "Attachment type code must contain only letters, numbers, hyphens, and underscores",
      );
    }
  }

  private static validateAllowedExtensions(extensions: string[]): void {
    if (!Array.isArray(extensions)) {
      throw new Error("Allowed extensions must be an array");
    }

    for (const ext of extensions) {
      if (typeof ext !== "string" || ext.trim() === "") {
        throw new Error("Each extension must be a non-empty string");
      }

      const normalized = ext.trim().toLowerCase().replace(/^\./, "");
      if (!/^[a-z0-9]+$/.test(normalized)) {
        throw new Error(
          `Invalid file extension: ${ext}. Extensions must contain only letters and numbers`,
        );
      }
    }
  }

  private static validateMaxFileSizeMB(size: number): void {
    if (typeof size !== "number" || size <= 0) {
      throw new Error("Max file size must be a positive number");
    }
    if (size > 10000) {
      throw new Error("Max file size must not exceed 10000 MB (10 GB)");
    }
    if (!Number.isInteger(size)) {
      throw new Error("Max file size must be an integer");
    }
  }
}
