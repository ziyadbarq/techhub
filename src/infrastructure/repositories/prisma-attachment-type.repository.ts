/**
 * Prisma AttachmentType Repository Implementation
 *
 * Implements IAttachmentTypeRepository using Prisma ORM.
 *
 * NOTE: This implementation assumes the schema has been updated to include:
 * - allowedExtensions String[] (array of strings)
 * - maxFileSizeMB Int (integer)
 */

import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { PrismaClient } from "@/generated/prisma/server";
import type { IAttachmentTypeRepository } from "@/core/repositories/attachment-type.repository.interface";
import { AttachmentType } from "@/core/domain/entities/attachment-type.entity";
import type { ILoggerService } from "@/core/services";

@injectable()
export class PrismaAttachmentTypeRepository
  implements IAttachmentTypeRepository
{
  constructor(
    @inject(DI_TOKENS.PrismaClient) private prisma: PrismaClient,
    @inject(DI_TOKENS.ILoggerService) private logger: ILoggerService,
  ) {}

  async create(attachmentType: AttachmentType): Promise<AttachmentType> {
    this.logger.debug("Creating attachment type", { id: attachmentType.id });

    const data = await this.prisma.attachmentType.create({
      data: {
        id: attachmentType.id,
        name: attachmentType.name,
        code: attachmentType.code,
        description: attachmentType.description,
        allowedExtensions: attachmentType.allowedExtensions,
        maxFileSizeMB: attachmentType.maxFileSizeMB,
        isActive: attachmentType.isActive,
        createdAt: attachmentType.createdAt,
        updatedAt: attachmentType.updatedAt,
      },
    });

    return this.toDomain(data);
  }

  async findById(id: string): Promise<AttachmentType | null> {
    this.logger.debug("Finding attachment type by id", { id });

    const data = await this.prisma.attachmentType.findUnique({
      where: { id },
    });

    return data ? this.toDomain(data) : null;
  }

  async findByName(name: string): Promise<AttachmentType | null> {
    this.logger.debug("Finding attachment type by name", { name });

    const data = await this.prisma.attachmentType.findUnique({
      where: { name },
    });

    return data ? this.toDomain(data) : null;
  }

  async findByCode(code: string): Promise<AttachmentType | null> {
    this.logger.debug("Finding attachment type by code", { code });

    const data = await this.prisma.attachmentType.findUnique({
      where: { code },
    });

    return data ? this.toDomain(data) : null;
  }

  async findAll(): Promise<AttachmentType[]> {
    this.logger.debug("Finding all attachment types");

    const data = await this.prisma.attachmentType.findMany({
      orderBy: { name: "asc" },
    });

    return data.map((item) => this.toDomain(item));
  }

  async findActive(): Promise<AttachmentType[]> {
    this.logger.debug("Finding active attachment types");

    const data = await this.prisma.attachmentType.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    });

    return data.map((item) => this.toDomain(item));
  }

  async update(attachmentType: AttachmentType): Promise<AttachmentType> {
    this.logger.debug("Updating attachment type", { id: attachmentType.id });

    const data = await this.prisma.attachmentType.update({
      where: { id: attachmentType.id },
      data: {
        name: attachmentType.name,
        code: attachmentType.code,
        description: attachmentType.description,
        allowedExtensions: attachmentType.allowedExtensions,
        maxFileSizeMB: attachmentType.maxFileSizeMB,
        isActive: attachmentType.isActive,
        updatedAt: new Date(),
      },
    });

    return this.toDomain(data);
  }

  async delete(id: string): Promise<void> {
    this.logger.debug("Deleting attachment type", { id });

    await this.prisma.attachmentType.delete({
      where: { id },
    });
  }

  async existsByName(name: string, excludeId?: string): Promise<boolean> {
    const count = await this.prisma.attachmentType.count({
      where: {
        name,
        ...(excludeId && { id: { not: excludeId } }),
      },
    });

    return count > 0;
  }

  async existsByCode(code: string, excludeId?: string): Promise<boolean> {
    const count = await this.prisma.attachmentType.count({
      where: {
        code,
        ...(excludeId && { id: { not: excludeId } }),
      },
    });

    return count > 0;
  }

  /**
   * Maps Prisma model to domain entity
   */
  private toDomain(data: {
    id: string;
    name: string;
    code: string;
    description: string | null;
    allowedExtensions: string[];
    maxFileSizeMB: number;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  }): AttachmentType {
    return AttachmentType.restore({
      id: data.id,
      name: data.name,
      code: data.code,
      description: data.description,
      allowedExtensions: data.allowedExtensions,
      maxFileSizeMB: data.maxFileSizeMB,
      isActive: data.isActive,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    });
  }
}
