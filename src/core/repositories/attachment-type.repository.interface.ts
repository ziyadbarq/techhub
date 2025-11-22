/**
 * AttachmentType Repository Interface
 *
 * Defines data access operations for AttachmentType entities.
 */

import type { AttachmentType } from "@/core/domain/entities/attachment-type.entity";

export interface IAttachmentTypeRepository {
  /**
   * Creates a new attachment type
   */
  create(attachmentType: AttachmentType): Promise<AttachmentType>;

  /**
   * Finds an attachment type by ID
   */
  findById(id: string): Promise<AttachmentType | null>;

  /**
   * Finds an attachment type by name
   */
  findByName(name: string): Promise<AttachmentType | null>;

  /**
   * Finds an attachment type by code
   */
  findByCode(code: string): Promise<AttachmentType | null>;

  /**
   * Finds all attachment types
   */
  findAll(): Promise<AttachmentType[]>;

  /**
   * Finds active attachment types
   */
  findActive(): Promise<AttachmentType[]>;

  /**
   * Updates an existing attachment type
   */
  update(attachmentType: AttachmentType): Promise<AttachmentType>;

  /**
   * Deletes an attachment type by ID
   */
  delete(id: string): Promise<void>;

  /**
   * Checks if an attachment type exists by name
   */
  existsByName(name: string, excludeId?: string): Promise<boolean>;

  /**
   * Checks if an attachment type exists by code
   */
  existsByCode(code: string, excludeId?: string): Promise<boolean>;
}
