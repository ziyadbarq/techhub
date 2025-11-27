import { injectable, inject } from "inversify";
import type { PrismaClient } from "@/generated/prisma/server";
import { DI_TOKENS } from "@/di/types";
import type { IDisposalDocumentRepository } from "@/core/repositories/disposal-document.repository.interface";
import {
  DisposalDocument,
  type DisposalDocumentType,
} from "@/core/domain/entities/disposal-document.entity";

@injectable()
export class PrismaDisposalDocumentRepository
  implements IDisposalDocumentRepository
{
  constructor(
    @inject(DI_TOKENS.PrismaClient)
    private readonly prisma: PrismaClient,
  ) {}

  async create(document: DisposalDocument): Promise<DisposalDocument> {
    const data = {
      id: document.id,
      disposalId: document.disposalId,
      documentType: document.documentType,
      fileName: document.fileName,
      filePath: document.filePath,
      mimeType: document.mimeType,
      sizeBytes: document.sizeBytes,
      uploadedById: document.uploadedById,
      uploadedAt: document.uploadedAt,
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
      where: { disposalId: disposalId },
      orderBy: { uploadedAt: "asc" },
    });

    return documents.map((d) => this.toDomain(d));
  }

  async findByType(
    type: DisposalDocumentType,
    options?: { skip?: number; take?: number },
  ): Promise<DisposalDocument[]> {
    const documents = await this.prisma.disposalDocument.findMany({
      where: { documentType: type },
      skip: options?.skip,
      take: options?.take,
      orderBy: { uploadedAt: "desc" },
    });

    return documents.map((d) => this.toDomain(d));
  }

  async findByDisposalIdAndType(
    disposalId: string,
    type: DisposalDocumentType,
  ): Promise<DisposalDocument[]> {
    const documents = await this.prisma.disposalDocument.findMany({
      where: {
        disposalId: disposalId,
        documentType: type,
      },
      orderBy: { uploadedAt: "asc" },
    });

    return documents.map((d) => this.toDomain(d));
  }

  async findByUploadedById(
    uploadedById: string,
    options?: { skip?: number; take?: number },
  ): Promise<DisposalDocument[]> {
    const documents = await this.prisma.disposalDocument.findMany({
      where: { uploadedById: uploadedById },
      skip: options?.skip,
      take: options?.take,
      orderBy: { uploadedAt: "desc" },
    });

    return documents.map((d) => this.toDomain(d));
  }

  async findByFileNamePattern(pattern: string): Promise<DisposalDocument[]> {
    const documents = await this.prisma.disposalDocument.findMany({
      where: {
        fileName: {
          contains: pattern,
          mode: "insensitive",
        },
      },
      orderBy: { uploadedAt: "desc" },
    });

    return documents.map((d) => this.toDomain(d));
  }

  async hasDocumentType(
    disposalId: string,
    type: DisposalDocumentType,
  ): Promise<boolean> {
    const count = await this.prisma.disposalDocument.count({
      where: {
        disposalId: disposalId,
        documentType: type,
      },
    });

    return count > 0;
  }

  async getTotalSizeByDisposalId(disposalId: string): Promise<number> {
    const result = await this.prisma.disposalDocument.aggregate({
      where: { disposalId: disposalId },
      _sum: {
        sizeBytes: true,
      },
    });

    return Number(result._sum.sizeBytes ?? 0n);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.disposalDocument.delete({
      where: { id },
    });
  }

  async deleteByDisposalId(disposalId: string): Promise<void> {
    await this.prisma.disposalDocument.deleteMany({
      where: { disposalId: disposalId },
    });
  }

  async countByDisposalId(disposalId: string): Promise<number> {
    return this.prisma.disposalDocument.count({
      where: { disposalId: disposalId },
    });
  }

  async countByType(type: DisposalDocumentType): Promise<number> {
    return this.prisma.disposalDocument.count({
      where: { documentType: type },
    });
  }

  private toDomain(prismaDocument: {
    id: string;
    disposalId: string;
    documentType: string;
    fileName: string;
    filePath: string;
    mimeType: string | null;
    sizeBytes: bigint | null;
    uploadedById: string;
    uploadedAt: Date;
  }): DisposalDocument {
    return DisposalDocument.reconstitute({
      id: prismaDocument.id,
      disposalId: prismaDocument.disposalId,
      documentType: prismaDocument.documentType as DisposalDocumentType,
      fileName: prismaDocument.fileName,
      filePath: prismaDocument.filePath,
      mimeType: prismaDocument.mimeType,
      sizeBytes:
        prismaDocument.sizeBytes !== null
          ? Number(prismaDocument.sizeBytes)
          : null,
      uploadedById: prismaDocument.uploadedById,
      uploadedAt: prismaDocument.uploadedAt,
    });
  }
}
