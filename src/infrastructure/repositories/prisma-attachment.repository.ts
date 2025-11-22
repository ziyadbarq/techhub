/**
 * Prisma Attachment Repository Implementation
 *
 * Implements IAttachmentRepository using Prisma ORM.
 */

import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { PrismaClient, TargetObjectTypeEnum } from "@/generated/prisma";
import type { IAttachmentRepository } from "@/core/repositories/attachment.repository.interface";
import { Attachment } from "@/core/domain/entities/attachment.entity";
import type { ILoggerService } from "@/core/services";

@injectable()
export class PrismaAttachmentRepository implements IAttachmentRepository {
  constructor(
    @inject(DI_TOKENS.PrismaClient) private prisma: PrismaClient,
    @inject(DI_TOKENS.ILoggerService) private logger: ILoggerService,
  ) {}

  async create(attachment: Attachment): Promise<Attachment> {
    this.logger.debug("Creating attachment", { id: attachment.id });

    const data = await this.prisma.attachment.create({
      data: {
        id: attachment.id,
        attachmentTypeId: attachment.attachmentTypeId,
        targetType: attachment.targetType,
        targetId: attachment.targetId,
        fileName: attachment.fileName,
        filePath: attachment.filePath,
        mimeType: attachment.mimeType,
        sizeBytes: attachment.sizeBytes,
        uploadedById: attachment.uploadedById,
        uploadedAt: attachment.uploadedAt,
        note: attachment.note,
      },
    });

    return this.toDomain(data);
  }

  async findById(id: string): Promise<Attachment | null> {
    this.logger.debug("Finding attachment by id", { id });

    const data = await this.prisma.attachment.findUnique({
      where: { id },
    });

    return data ? this.toDomain(data) : null;
  }

  async findAll(): Promise<Attachment[]> {
    this.logger.debug("Finding all attachments");

    const data = await this.prisma.attachment.findMany({
      orderBy: { uploadedAt: "desc" },
    });

    return data.map((item) => this.toDomain(item));
  }

  async findByTarget(
    targetType: TargetObjectTypeEnum,
    targetId: string,
  ): Promise<Attachment[]> {
    this.logger.debug("Finding attachments by target", { targetType, targetId });

    const data = await this.prisma.attachment.findMany({
      where: {
        targetType,
        targetId,
      },
      orderBy: { uploadedAt: "desc" },
    });

    return data.map((item) => this.toDomain(item));
  }

  async findByUploader(uploadedById: string): Promise<Attachment[]> {
    this.logger.debug("Finding attachments by uploader", { uploadedById });

    const data = await this.prisma.attachment.findMany({
      where: { uploadedById },
      orderBy: { uploadedAt: "desc" },
    });

    return data.map((item) => this.toDomain(item));
  }

  async findByAttachmentType(attachmentTypeId: string): Promise<Attachment[]> {
    this.logger.debug("Finding attachments by type", { attachmentTypeId });

    const data = await this.prisma.attachment.findMany({
      where: { attachmentTypeId },
      orderBy: { uploadedAt: "desc" },
    });

    return data.map((item) => this.toDomain(item));
  }

  async update(attachment: Attachment): Promise<Attachment> {
    this.logger.debug("Updating attachment", { id: attachment.id });

    const data = await this.prisma.attachment.update({
      where: { id: attachment.id },
      data: {
        attachmentTypeId: attachment.attachmentTypeId,
        fileName: attachment.fileName,
        filePath: attachment.filePath,
        mimeType: attachment.mimeType,
        sizeBytes: attachment.sizeBytes,
        note: attachment.note,
      },
    });

    return this.toDomain(data);
  }

  async delete(id: string): Promise<void> {
    this.logger.debug("Deleting attachment", { id });

    await this.prisma.attachment.delete({
      where: { id },
    });
  }

  async countByTarget(
    targetType: TargetObjectTypeEnum,
    targetId: string,
  ): Promise<number> {
    return await this.prisma.attachment.count({
      where: {
        targetType,
        targetId,
      },
    });
  }

  /**
   * Maps Prisma model to domain entity
   */
  private toDomain(data: {
    id: string;
    attachmentTypeId: string;
    targetType: TargetObjectTypeEnum;
    targetId: string;
    fileName: string;
    filePath: string;
    mimeType: string | null;
    sizeBytes: bigint | null;
    uploadedById: string;
    uploadedAt: Date;
    note: string | null;
  }): Attachment {
    return Attachment.restore({
      id: data.id,
      attachmentTypeId: data.attachmentTypeId,
      targetType: data.targetType,
      targetId: data.targetId,
      fileName: data.fileName,
      filePath: data.filePath,
      mimeType: data.mimeType,
      sizeBytes: data.sizeBytes,
      uploadedById: data.uploadedById,
      uploadedAt: data.uploadedAt,
      note: data.note,
    });
  }
}
