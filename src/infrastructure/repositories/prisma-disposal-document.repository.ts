/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// TODO: Fix type errors - this is WIP code

/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// TODO: Fix type errors - this is WIP code

import { injectable, inject } from "inversify";
import type { PrismaClient } from "@/generated/prisma";
import { DI_TOKENS } from "@/di/types";
import type { IDisposalDocumentRepository } from "@/core/repositories/disposal-document.repository.interface";
import {
  DisposalDocument,
  type DisposalDocumentType,
} from "@/core/domain/entities/disposal-document.entity";
import { createRepositoryLogger } from "./repository-logger";

@injectable()
export class PrismaDisposalDocumentRepository
  implements IDisposalDocumentRepository
{
  private readonly logger = createRepositoryLogger("DisposalDocument");

  constructor(
    @inject(DI_TOKENS.PrismaClient)
    private readonly prisma: PrismaClient,
  ) {}

  async create(document: DisposalDocument): Promise<DisposalDocument> {
    const data = {
      id: document.id,
      disposal_id: document.disposalId,
      document_type: document.documentType,
      file_name: document.fileName,
      file_path: document.filePath,
      mime_type: document.mimeType,
      size_bytes: document.sizeBytes,
      uploaded_by_id: document.uploadedById,
      uploaded_at: document.uploadedAt,
    };

    const created = await this.prisma.disposalDocument.create({ data });
    return this.toDomain(created);
  }

  async findById(id: string): Promise<DisposalDocument | null> {
    const document = await this.prisma.disposalDocument.findUnique({
      where: { id },
    });

    return document ? this.toDomain(document) : null;
  }

  async findByDisposalId(disposalId: string): Promise<DisposalDocument[]> {
    const documents = await this.prisma.disposalDocument.findMany({
      where: { disposal_id: disposalId },
      orderBy: { uploaded_at: "asc" },
    });

    return documents.map((d) => this.toDomain(d));
  }

  async findByType(
    type: DisposalDocumentType,
    options?: { skip?: number; take?: number },
  ): Promise<DisposalDocument[]> {
    const documents = await this.prisma.disposalDocument.findMany({
      where: { document_type: type },
      skip: options?.skip,
      take: options?.take,
      orderBy: { uploaded_at: "desc" },
    });

    return documents.map((d) => this.toDomain(d));
  }

  async findByDisposalIdAndType(
    disposalId: string,
    type: DisposalDocumentType,
  ): Promise<DisposalDocument[]> {
    const documents = await this.prisma.disposalDocument.findMany({
      where: {
        disposal_id: disposalId,
        document_type: type,
      },
      orderBy: { uploaded_at: "asc" },
    });

    return documents.map((d) => this.toDomain(d));
  }

  async findByUploadedById(
    uploadedById: string,
    options?: { skip?: number; take?: number },
  ): Promise<DisposalDocument[]> {
    const documents = await this.prisma.disposalDocument.findMany({
      where: { uploaded_by_id: uploadedById },
      skip: options?.skip,
      take: options?.take,
      orderBy: { uploaded_at: "desc" },
    });

    return documents.map((d) => this.toDomain(d));
  }

  async findByFileNamePattern(pattern: string): Promise<DisposalDocument[]> {
    const documents = await this.prisma.disposalDocument.findMany({
      where: {
        file_name: {
          contains: pattern,
          mode: "insensitive",
        },
      },
      orderBy: { uploaded_at: "desc" },
    });

    return documents.map((d) => this.toDomain(d));
  }

  async hasDocumentType(
    disposalId: string,
    type: DisposalDocumentType,
  ): Promise<boolean> {
    const count = await this.prisma.disposalDocument.count({
      where: {
        disposal_id: disposalId,
        document_type: type,
      },
    });

    return count > 0;
  }

  async getTotalSizeByDisposalId(disposalId: string): Promise<number> {
    const result = await this.prisma.disposalDocument.aggregate({
      where: { disposal_id: disposalId },
      _sum: {
        size_bytes: true,
      },
    });

    return result._sum.size_bytes ?? 0;
  }

  async delete(id: string): Promise<void> {
    await this.prisma.disposalDocument.delete({
      where: { id },
    });
  }

  async deleteByDisposalId(disposalId: string): Promise<void> {
    await this.prisma.disposalDocument.deleteMany({
      where: { disposal_id: disposalId },
    });
  }

  async countByDisposalId(disposalId: string): Promise<number> {
    return this.prisma.disposalDocument.count({
      where: { disposal_id: disposalId },
    });
  }

  async countByType(type: DisposalDocumentType): Promise<number> {
    return this.prisma.disposalDocument.count({
      where: { document_type: type },
    });
  }

  private toDomain(prismaDocument: {
    id: string;
    disposal_id: string;
    document_type: string;
    file_name: string;
    file_path: string;
    mime_type: string | null;
    size_bytes: number | null;
    uploaded_by_id: string;
    uploaded_at: Date;
  }): DisposalDocument {
    return DisposalDocument.reconstitute({
      id: prismaDocument.id,
      disposalId: prismaDocument.disposal_id,
      documentType: prismaDocument.document_type as DisposalDocumentType,
      fileName: prismaDocument.file_name,
      filePath: prismaDocument.file_path,
      mimeType: prismaDocument.mime_type,
      sizeBytes: prismaDocument.size_bytes,
      uploadedById: prismaDocument.uploaded_by_id,
      uploadedAt: prismaDocument.uploaded_at,
    });
  }
}
