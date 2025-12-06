/**
 * DisposalDocument Entity
 *
 * Tracks documents attached to disposal workflows (certificates, receipts, photos, etc.).
 */

import type { IIdGenerator } from "@/core/services/id-generator.service.interface";

export type DisposalDocumentType =
  | "CERTIFICATE"
  | "RECEIPT"
  | "INVOICE"
  | "PHOTO"
  | "OTHER";

export interface DisposalDocumentProps {
  id: string;
  disposalId: string;
  documentType: DisposalDocumentType;
  fileName: string;
  filePath: string;
  mimeType: string | null;
  sizeBytes: number | null;
  uploadedById: string;
  uploadedAt: Date;
}

export interface CreateDisposalDocumentProps {
  disposalId: string;
  documentType: DisposalDocumentType;
  fileName: string;
  filePath: string;
  mimeType?: string | null;
  sizeBytes?: number | null;
  uploadedById: string;
}

export class DisposalDocument {
  private constructor(private props: DisposalDocumentProps) {
    this.validate();
  }

  static create(
    props: CreateDisposalDocumentProps,
    idGenerator: IIdGenerator,
  ): DisposalDocument {
    if (!props.disposalId?.trim()) {
      throw new Error("Disposal ID is required");
    }
    if (!props.fileName?.trim()) {
      throw new Error("File name is required");
    }
    if (!props.filePath?.trim()) {
      throw new Error("File path is required");
    }
    if (!props.uploadedById?.trim()) {
      throw new Error("Uploaded by ID is required");
    }

    return new DisposalDocument({
      id: idGenerator.generateId(),
      disposalId: props.disposalId,
      documentType: props.documentType,
      fileName: props.fileName.trim(),
      filePath: props.filePath.trim(),
      mimeType: props.mimeType?.trim() || null,
      sizeBytes: props.sizeBytes ?? null,
      uploadedById: props.uploadedById,
      uploadedAt: new Date(),
    });
  }

  static reconstitute(props: DisposalDocumentProps): DisposalDocument {
    return new DisposalDocument(props);
  }

  private validate(): void {
    if (!this.props.id) {
      throw new Error("Document ID is required");
    }
    if (!this.props.disposalId) {
      throw new Error("Disposal ID is required");
    }
    if (!this.props.fileName) {
      throw new Error("File name is required");
    }
    if (!this.props.filePath) {
      throw new Error("File path is required");
    }
    if (!this.props.uploadedById) {
      throw new Error("Uploaded by ID is required");
    }
  }

  // Getters
  get id(): string {
    return this.props.id;
  }

  get disposalId(): string {
    return this.props.disposalId;
  }

  get documentType(): DisposalDocumentType {
    return this.props.documentType;
  }

  get fileName(): string {
    return this.props.fileName;
  }

  get filePath(): string {
    return this.props.filePath;
  }

  get mimeType(): string | null {
    return this.props.mimeType;
  }

  get sizeBytes(): number | null {
    return this.props.sizeBytes;
  }

  get uploadedById(): string {
    return this.props.uploadedById;
  }

  get uploadedAt(): Date {
    return this.props.uploadedAt;
  }

  toObject(): DisposalDocumentProps {
    return { ...this.props };
  }
}
