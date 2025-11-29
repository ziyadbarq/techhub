import { injectable, inject } from "inversify";
import type { PrismaClient } from "@/generated/prisma/server";
import type { DisposalTypeEnum, DisposalStatusEnum } from "@/generated/prisma";
import { DI_TOKENS } from "@/di/types";
import type { IAssetDisposalRepository } from "@/core/repositories/asset-disposal.repository.interface";
import {
  AssetDisposal,
  type DisposalStatus,
  type DisposalType,
  type SanitizationChecklist,
} from "@/core/domain/entities/asset-disposal.entity";
import { toJsonValue, fromJsonValue } from "./prisma-helpers";

@injectable()
export class PrismaAssetDisposalRepository implements IAssetDisposalRepository {
  constructor(
    @inject(DI_TOKENS.PrismaClient)
    private readonly prisma: PrismaClient,
  ) {}

  async create(disposal: AssetDisposal): Promise<AssetDisposal> {
    const data = {
      id: disposal.id,
      assetId: disposal.assetId,
      disposalType: disposal.disposalType as DisposalTypeEnum,
      reason: disposal.reason,
      initiatedById: disposal.initiatedById,
      approvedById: disposal.approvedById,
      approvedAt: disposal.approvedAt,
      status: disposal.status as DisposalStatusEnum,
      estimatedValue: disposal.estimatedValue,
      actualProceeds: disposal.actualProceeds,
      currency: disposal.currency,
      sanitizationChecklist: toJsonValue(disposal.sanitizationChecklist),
      disposalDate: disposal.disposalDate,
      certificateNumber: disposal.certificateNumber,
      certificateIssuedAt: disposal.certificateIssuedAt,
      disposalVendorId: disposal.disposalVendorId,
      recipientInfo: disposal.recipientInfo,
      note: disposal.note,
      metadata: toJsonValue(disposal.metadata),
      createdAt: disposal.createdAt,
      updatedAt: disposal.updatedAt,
    };

    const created = await this.prisma.assetDisposal.create({ data });
    return this.toDomain(created);
  }

  async findById(id: string): Promise<AssetDisposal | null> {
    const disposal = await this.prisma.assetDisposal.findUnique({
      where: { id },
    });

    return disposal ? this.toDomain(disposal) : null;
  }

  async findAll(options?: {
    skip?: number;
    take?: number;
    orderBy?: "createdAt" | "updatedAt" | "disposalDate";
    order?: "asc" | "desc";
  }): Promise<AssetDisposal[]> {
    const disposals = await this.prisma.assetDisposal.findMany({
      skip: options?.skip,
      take: options?.take,
      orderBy: options?.orderBy
        ? { [options.orderBy]: options.order ?? "desc" }
        : undefined,
    });

    return disposals.map((d) => this.toDomain(d));
  }

  async findByAssetId(assetId: string): Promise<AssetDisposal[]> {
    const disposals = await this.prisma.assetDisposal.findMany({
      where: { assetId: assetId },
      orderBy: { createdAt: "desc" },
    });

    return disposals.map((d) => this.toDomain(d));
  }

  async findByStatus(
    status: DisposalStatus,
    options?: { skip?: number; take?: number },
  ): Promise<AssetDisposal[]> {
    const disposals = await this.prisma.assetDisposal.findMany({
      where: { status },
      skip: options?.skip,
      take: options?.take,
      orderBy: { updatedAt: "desc" },
    });

    return disposals.map((d) => this.toDomain(d));
  }

  async findByType(
    type: DisposalType,
    options?: { skip?: number; take?: number },
  ): Promise<AssetDisposal[]> {
    const disposals = await this.prisma.assetDisposal.findMany({
      where: { disposalType: type as DisposalTypeEnum },
      skip: options?.skip,
      take: options?.take,
      orderBy: { createdAt: "desc" },
    });

    return disposals.map((d) => this.toDomain(d));
  }

  async findByInitiator(
    initiatedById: string,
    options?: { skip?: number; take?: number },
  ): Promise<AssetDisposal[]> {
    const disposals = await this.prisma.assetDisposal.findMany({
      where: { initiatedById: initiatedById },
      skip: options?.skip,
      take: options?.take,
      orderBy: { createdAt: "desc" },
    });

    return disposals.map((d) => this.toDomain(d));
  }

  async findByApprover(
    approvedById: string,
    options?: { skip?: number; take?: number },
  ): Promise<AssetDisposal[]> {
    const disposals = await this.prisma.assetDisposal.findMany({
      where: { approvedById: approvedById },
      skip: options?.skip,
      take: options?.take,
      orderBy: { approvedAt: "desc" },
    });

    return disposals.map((d) => this.toDomain(d));
  }

  async findPendingApproval(options?: {
    skip?: number;
    take?: number;
  }): Promise<AssetDisposal[]> {
    const disposals = await this.prisma.assetDisposal.findMany({
      where: { status: "PENDING_APPROVAL" },
      skip: options?.skip,
      take: options?.take,
      orderBy: { createdAt: "asc" },
    });

    return disposals.map((d) => this.toDomain(d));
  }

  async findCompletedInDateRange(
    startDate: Date,
    endDate: Date,
    options?: { skip?: number; take?: number },
  ): Promise<AssetDisposal[]> {
    const disposals = await this.prisma.assetDisposal.findMany({
      where: {
        status: "COMPLETED",
        disposalDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      skip: options?.skip,
      take: options?.take,
      orderBy: { disposalDate: "desc" },
    });

    return disposals.map((d) => this.toDomain(d));
  }

  async findByVendor(
    vendorId: string,
    options?: { skip?: number; take?: number },
  ): Promise<AssetDisposal[]> {
    const disposals = await this.prisma.assetDisposal.findMany({
      where: { disposalVendorId: vendorId },
      skip: options?.skip,
      take: options?.take,
      orderBy: { createdAt: "desc" },
    });

    return disposals.map((d) => this.toDomain(d));
  }

  async findWithCertificates(options?: {
    skip?: number;
    take?: number;
  }): Promise<AssetDisposal[]> {
    const disposals = await this.prisma.assetDisposal.findMany({
      where: {
        certificateNumber: { not: null },
      },
      skip: options?.skip,
      take: options?.take,
      orderBy: { certificateIssuedAt: "desc" },
    });

    return disposals.map((d) => this.toDomain(d));
  }

  async findByValueRange(
    minValue: number,
    maxValue: number,
    currency?: string,
  ): Promise<AssetDisposal[]> {
    const where: Record<string, unknown> = {
      estimatedValue: {
        gte: minValue,
        lte: maxValue,
      },
    };

    if (currency) {
      where.currency = currency;
    }

    const disposals = await this.prisma.assetDisposal.findMany({
      where,
      orderBy: { estimatedValue: "desc" },
    });

    return disposals.map((d) => this.toDomain(d));
  }

  async update(disposal: AssetDisposal): Promise<AssetDisposal> {
    const data = {
      status: disposal.status,
      approvedById: disposal.approvedById,
      approvedAt: disposal.approvedAt,
      actualProceeds: disposal.actualProceeds,
      sanitizationChecklist: toJsonValue(disposal.sanitizationChecklist),
      disposalDate: disposal.disposalDate,
      certificateNumber: disposal.certificateNumber,
      certificateIssuedAt: disposal.certificateIssuedAt,
      note: disposal.note,
      metadata: toJsonValue(disposal.metadata),
      updatedAt: disposal.updatedAt,
    };

    const updated = await this.prisma.assetDisposal.update({
      where: { id: disposal.id },
      data,
    });

    return this.toDomain(updated);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.assetDisposal.delete({
      where: { id },
    });
  }

  async countByStatus(status: DisposalStatus): Promise<number> {
    return this.prisma.assetDisposal.count({
      where: { status },
    });
  }

  async count(): Promise<number> {
    return this.prisma.assetDisposal.count();
  }

  private toDomain(prismaDisposal: {
    id: string;
    assetId: string;
    disposalType: string;
    reason: string | null;
    initiatedById: string;
    approvedById: string | null;
    approvedAt: Date | null;
    status: string;
    estimatedValue: { toNumber(): number } | null;
    actualProceeds: { toNumber(): number } | null;
    currency: string | null;
    sanitizationChecklist: unknown;
    disposalDate: Date | null;
    certificateNumber: string | null;
    certificateIssuedAt: Date | null;
    disposalVendorId: string | null;
    recipientInfo: string | null;
    note: string | null;
    metadata: unknown;
    createdAt: Date;
    updatedAt: Date;
  }): AssetDisposal {
    return AssetDisposal.reconstitute({
      id: prismaDisposal.id,
      assetId: prismaDisposal.assetId,
      disposalType: prismaDisposal.disposalType as DisposalType,
      reason: prismaDisposal.reason,
      initiatedById: prismaDisposal.initiatedById,
      approvedById: prismaDisposal.approvedById,
      approvedAt: prismaDisposal.approvedAt,
      status: prismaDisposal.status as DisposalStatus,
      estimatedValue: prismaDisposal.estimatedValue?.toNumber() ?? null,
      actualProceeds: prismaDisposal.actualProceeds?.toNumber() ?? null,
      currency: prismaDisposal.currency,
      sanitizationChecklist: fromJsonValue<SanitizationChecklist>(
        prismaDisposal.sanitizationChecklist as Parameters<
          typeof fromJsonValue
        >[0],
      ),
      disposalDate: prismaDisposal.disposalDate,
      certificateNumber: prismaDisposal.certificateNumber,
      certificateIssuedAt: prismaDisposal.certificateIssuedAt,
      disposalVendorId: prismaDisposal.disposalVendorId,
      recipientInfo: prismaDisposal.recipientInfo,
      note: prismaDisposal.note,
      metadata: fromJsonValue<Record<string, unknown>>(
        prismaDisposal.metadata as Parameters<typeof fromJsonValue>[0],
      ),
      createdAt: prismaDisposal.createdAt,
      updatedAt: prismaDisposal.updatedAt,
    });
  }
}
