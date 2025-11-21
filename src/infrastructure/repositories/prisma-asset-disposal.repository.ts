/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// TODO: Fix type errors - this is WIP code

import { injectable, inject } from "inversify";
import type { PrismaClient } from "@/generated/prisma";
import { DI_TOKENS } from "@/di/types";
import type { IAssetDisposalRepository } from "@/core/repositories/asset-disposal.repository.interface";
import {
  AssetDisposal,
  type DisposalStatus,
  type DisposalType,
  type SanitizationChecklist,
} from "@/core/domain/entities/asset-disposal.entity";
import { createRepositoryLogger } from "./repository-logger";
import { toJsonValue, fromJsonValue } from "./prisma-helpers";

@injectable()
export class PrismaAssetDisposalRepository implements IAssetDisposalRepository {
  private readonly logger = createRepositoryLogger("AssetDisposal");

  constructor(
    @inject(DI_TOKENS.PrismaClient)
    private readonly prisma: PrismaClient,
  ) {}

  async create(disposal: AssetDisposal): Promise<AssetDisposal> {
    this.logger.logOperation("create", { disposalId: disposal.id });

    const data = {
      id: disposal.id,
      asset_id: disposal.assetId,
      disposal_type: disposal.disposalType,
      reason: disposal.reason,
      initiated_by_id: disposal.initiatedById,
      approved_by_id: disposal.approvedById,
      approved_at: disposal.approvedAt,
      status: disposal.status,
      estimated_value: disposal.estimatedValue,
      actual_proceeds: disposal.actualProceeds,
      currency: disposal.currency,
      sanitization_checklist: toJsonValue(disposal.sanitizationChecklist),
      disposal_date: disposal.disposalDate,
      certificate_number: disposal.certificateNumber,
      certificate_issued_at: disposal.certificateIssuedAt,
      disposal_vendor_id: disposal.disposalVendorId,
      recipient_info: disposal.recipientInfo,
      note: disposal.note,
      metadata: toJsonValue(disposal.metadata),
      created_at: disposal.createdAt,
      updated_at: disposal.updatedAt,
    };

    const created = await this.prisma.assetDisposal.create({ data });
    return this.toDomain(created);
  }

  async findById(id: string): Promise<AssetDisposal | null> {
    this.logger.logOperation("findById", { id });

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
    this.logger.logOperation("findAll", options);

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
    this.logger.logOperation("findByAssetId", { assetId });

    const disposals = await this.prisma.assetDisposal.findMany({
      where: { asset_id: assetId },
      orderBy: { created_at: "desc" },
    });

    return disposals.map((d) => this.toDomain(d));
  }

  async findByStatus(
    status: DisposalStatus,
    options?: { skip?: number; take?: number },
  ): Promise<AssetDisposal[]> {
    this.logger.logOperation("findByStatus", { status, ...options });

    const disposals = await this.prisma.assetDisposal.findMany({
      where: { status },
      skip: options?.skip,
      take: options?.take,
      orderBy: { updated_at: "desc" },
    });

    return disposals.map((d) => this.toDomain(d));
  }

  async findByType(
    type: DisposalType,
    options?: { skip?: number; take?: number },
  ): Promise<AssetDisposal[]> {
    this.logger.logOperation("findByType", { type, ...options });

    const disposals = await this.prisma.assetDisposal.findMany({
      where: { disposal_type: type },
      skip: options?.skip,
      take: options?.take,
      orderBy: { created_at: "desc" },
    });

    return disposals.map((d) => this.toDomain(d));
  }

  async findByInitiator(
    initiatedById: string,
    options?: { skip?: number; take?: number },
  ): Promise<AssetDisposal[]> {
    this.logger.logOperation("findByInitiator", { initiatedById, ...options });

    const disposals = await this.prisma.assetDisposal.findMany({
      where: { initiated_by_id: initiatedById },
      skip: options?.skip,
      take: options?.take,
      orderBy: { created_at: "desc" },
    });

    return disposals.map((d) => this.toDomain(d));
  }

  async findByApprover(
    approvedById: string,
    options?: { skip?: number; take?: number },
  ): Promise<AssetDisposal[]> {
    this.logger.logOperation("findByApprover", { approvedById, ...options });

    const disposals = await this.prisma.assetDisposal.findMany({
      where: { approved_by_id: approvedById },
      skip: options?.skip,
      take: options?.take,
      orderBy: { approved_at: "desc" },
    });

    return disposals.map((d) => this.toDomain(d));
  }

  async findPendingApproval(options?: {
    skip?: number;
    take?: number;
  }): Promise<AssetDisposal[]> {
    this.logger.logOperation("findPendingApproval", options);

    const disposals = await this.prisma.assetDisposal.findMany({
      where: { status: "PENDING_APPROVAL" },
      skip: options?.skip,
      take: options?.take,
      orderBy: { created_at: "asc" },
    });

    return disposals.map((d) => this.toDomain(d));
  }

  async findCompletedInDateRange(
    startDate: Date,
    endDate: Date,
    options?: { skip?: number; take?: number },
  ): Promise<AssetDisposal[]> {
    this.logger.logOperation("findCompletedInDateRange", {
      startDate,
      endDate,
      ...options,
    });

    const disposals = await this.prisma.assetDisposal.findMany({
      where: {
        status: "COMPLETED",
        disposal_date: {
          gte: startDate,
          lte: endDate,
        },
      },
      skip: options?.skip,
      take: options?.take,
      orderBy: { disposal_date: "desc" },
    });

    return disposals.map((d) => this.toDomain(d));
  }

  async findByVendor(
    vendorId: string,
    options?: { skip?: number; take?: number },
  ): Promise<AssetDisposal[]> {
    this.logger.logOperation("findByVendor", { vendorId, ...options });

    const disposals = await this.prisma.assetDisposal.findMany({
      where: { disposal_vendor_id: vendorId },
      skip: options?.skip,
      take: options?.take,
      orderBy: { created_at: "desc" },
    });

    return disposals.map((d) => this.toDomain(d));
  }

  async findWithCertificates(options?: {
    skip?: number;
    take?: number;
  }): Promise<AssetDisposal[]> {
    this.logger.logOperation("findWithCertificates", options);

    const disposals = await this.prisma.assetDisposal.findMany({
      where: {
        certificate_number: { not: null },
      },
      skip: options?.skip,
      take: options?.take,
      orderBy: { certificate_issued_at: "desc" },
    });

    return disposals.map((d) => this.toDomain(d));
  }

  async findByValueRange(
    minValue: number,
    maxValue: number,
    currency?: string,
  ): Promise<AssetDisposal[]> {
    this.logger.logOperation("findByValueRange", {
      minValue,
      maxValue,
      currency,
    });

    const where: Record<string, unknown> = {
      estimated_value: {
        gte: minValue,
        lte: maxValue,
      },
    };

    if (currency) {
      where.currency = currency;
    }

    const disposals = await this.prisma.assetDisposal.findMany({
      where,
      orderBy: { estimated_value: "desc" },
    });

    return disposals.map((d) => this.toDomain(d));
  }

  async update(disposal: AssetDisposal): Promise<AssetDisposal> {
    this.logger.logOperation("update", { disposalId: disposal.id });

    const data = {
      status: disposal.status,
      approved_by_id: disposal.approvedById,
      approved_at: disposal.approvedAt,
      actual_proceeds: disposal.actualProceeds,
      sanitization_checklist: toJsonValue(disposal.sanitizationChecklist),
      disposal_date: disposal.disposalDate,
      certificate_number: disposal.certificateNumber,
      certificate_issued_at: disposal.certificateIssuedAt,
      note: disposal.note,
      metadata: toJsonValue(disposal.metadata),
      updated_at: disposal.updatedAt,
    };

    const updated = await this.prisma.assetDisposal.update({
      where: { id: disposal.id },
      data,
    });

    return this.toDomain(updated);
  }

  async delete(id: string): Promise<void> {
    this.logger.logOperation("delete", { id });

    await this.prisma.assetDisposal.delete({
      where: { id },
    });
  }

  async countByStatus(status: DisposalStatus): Promise<number> {
    this.logger.logOperation("countByStatus", { status });

    return this.prisma.assetDisposal.count({
      where: { status },
    });
  }

  async count(): Promise<number> {
    this.logger.logOperation("count", {});

    return this.prisma.assetDisposal.count();
  }

  private toDomain(prismaDisposal: {
    id: string;
    asset_id: string;
    disposal_type: string;
    reason: string | null;
    initiated_by_id: string;
    approved_by_id: string | null;
    approved_at: Date | null;
    status: string;
    estimated_value: number | null;
    actual_proceeds: number | null;
    currency: string | null;
    sanitization_checklist: unknown;
    disposal_date: Date | null;
    certificate_number: string | null;
    certificate_issued_at: Date | null;
    disposal_vendor_id: string | null;
    recipient_info: string | null;
    note: string | null;
    metadata: unknown;
    created_at: Date;
    updated_at: Date;
  }): AssetDisposal {
    return AssetDisposal.reconstitute({
      id: prismaDisposal.id,
      assetId: prismaDisposal.asset_id,
      disposalType: prismaDisposal.disposal_type as DisposalType,
      reason: prismaDisposal.reason,
      initiatedById: prismaDisposal.initiated_by_id,
      approvedById: prismaDisposal.approved_by_id,
      approvedAt: prismaDisposal.approved_at,
      status: prismaDisposal.status as DisposalStatus,
      estimatedValue: prismaDisposal.estimated_value,
      actualProceeds: prismaDisposal.actual_proceeds,
      currency: prismaDisposal.currency,
      sanitizationChecklist: fromJsonValue<SanitizationChecklist>(
        prismaDisposal.sanitization_checklist,
      ),
      disposalDate: prismaDisposal.disposal_date,
      certificateNumber: prismaDisposal.certificate_number,
      certificateIssuedAt: prismaDisposal.certificate_issued_at,
      disposalVendorId: prismaDisposal.disposal_vendor_id,
      recipientInfo: prismaDisposal.recipient_info,
      note: prismaDisposal.note,
      metadata: fromJsonValue<Record<string, unknown>>(prismaDisposal.metadata),
      createdAt: prismaDisposal.created_at,
      updatedAt: prismaDisposal.updated_at,
    });
  }
}
