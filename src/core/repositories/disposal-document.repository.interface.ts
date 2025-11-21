import type { DisposalDocument } from "@/core/domain/entities/disposal-document.entity";
import type { DisposalDocumentType } from "@/core/domain/entities/disposal-document.entity";

export interface IDisposalDocumentRepository {
  /**
   * Create a new disposal document
   */
  create(document: DisposalDocument): Promise<DisposalDocument>;

  /**
   * Find document by ID
   */
  findById(id: string): Promise<DisposalDocument | null>;

  /**
   * Find all documents for a disposal
   */
  findByDisposalId(disposalId: string): Promise<DisposalDocument[]>;

  /**
   * Find documents by type
   */
  findByType(
    type: DisposalDocumentType,
    options?: { skip?: number; take?: number },
  ): Promise<DisposalDocument[]>;

  /**
   * Find documents by type for a specific disposal
   */
  findByDisposalIdAndType(
    disposalId: string,
    type: DisposalDocumentType,
  ): Promise<DisposalDocument[]>;

  /**
   * Find documents uploaded by a person
   */
  findByUploadedById(
    uploadedById: string,
    options?: { skip?: number; take?: number },
  ): Promise<DisposalDocument[]>;

  /**
   * Find documents by file name pattern
   */
  findByFileNamePattern(pattern: string): Promise<DisposalDocument[]>;

  /**
   * Check if disposal has documents of a specific type
   */
  hasDocumentType(
    disposalId: string,
    type: DisposalDocumentType,
  ): Promise<boolean>;

  /**
   * Get total size of documents for a disposal (in bytes)
   */
  getTotalSizeByDisposalId(disposalId: string): Promise<number>;

  /**
   * Delete a document
   */
  delete(id: string): Promise<void>;

  /**
   * Delete all documents for a disposal
   */
  deleteByDisposalId(disposalId: string): Promise<void>;

  /**
   * Count documents for a disposal
   */
  countByDisposalId(disposalId: string): Promise<number>;

  /**
   * Count documents by type
   */
  countByType(type: DisposalDocumentType): Promise<number>;
}
