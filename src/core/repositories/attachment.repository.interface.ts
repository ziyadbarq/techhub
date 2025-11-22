/**
 * Attachment Repository Interface
 *
 * Defines data access operations for Attachment entities.
 */

import type { Attachment } from "@/core/domain/entities/attachment.entity";
import type { TargetObjectTypeEnum } from "@/generated/prisma";

export interface IAttachmentRepository {
  /**
   * Creates a new attachment
   */
  create(attachment: Attachment): Promise<Attachment>;

  /**
   * Finds an attachment by ID
   */
  findById(id: string): Promise<Attachment | null>;

  /**
   * Finds all attachments
   */
  findAll(): Promise<Attachment[]>;

  /**
   * Finds attachments by target (polymorphic)
   */
  findByTarget(
    targetType: TargetObjectTypeEnum,
    targetId: string,
  ): Promise<Attachment[]>;

  /**
   * Finds attachments by uploader
   */
  findByUploader(uploadedById: string): Promise<Attachment[]>;

  /**
   * Finds attachments by attachment type
   */
  findByAttachmentType(attachmentTypeId: string): Promise<Attachment[]>;

  /**
   * Updates an existing attachment
   */
  update(attachment: Attachment): Promise<Attachment>;

  /**
   * Deletes an attachment by ID
   */
  delete(id: string): Promise<void>;

  /**
   * Counts attachments for a specific target
   */
  countByTarget(
    targetType: TargetObjectTypeEnum,
    targetId: string,
  ): Promise<number>;
}
