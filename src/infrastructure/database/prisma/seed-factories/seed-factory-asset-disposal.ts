/**
 * Asset Disposal Factory
 *
 * Type-safe factory for generating AssetDisposal test data
 */

import type { Prisma, PrismaClient } from "@/generated/prisma";
import { optionalConnect, requireConnect } from "../seed-utils.js";

export interface AssetDisposalFactoryOptions {
  assetId: string;
  disposalType: "DONATION" | "SALE" | "RECYCLING" | "DESTRUCTION" | "OTHER";
  reason?: string;
  initiatedById: string;
  approvedById?: string;
  approvedAt?: Date;
  disposalDate?: Date;
  estimatedValue?: number;
  actualProceeds?: number;
  currency?: string;
  status:
    | "PENDING_APPROVAL"
    | "APPROVED"
    | "REJECTED"
    | "IN_PROGRESS"
    | "COMPLETED"
    | "CANCELLED";
  sanitizationChecklist?: Prisma.InputJsonValue;
  certificateNumber?: string;
  certificateIssuedAt?: Date;
  disposalVendorId?: string;
  recipientInfo?: string;
  note?: string;
}

export class AssetDisposalFactory {
  private options: AssetDisposalFactoryOptions;

  constructor(options: AssetDisposalFactoryOptions) {
    this.options = options;
  }

  build(): Prisma.AssetDisposalCreateInput {
    const data = {
      ...requireConnect(this.options.assetId, "asset"),
      ...requireConnect(this.options.initiatedById, "initiatedBy"),
      ...optionalConnect(this.options.approvedById, "approvedBy"),
      ...optionalConnect(this.options.disposalVendorId, "disposalVendor"),
      disposalType: this.options.disposalType,
      reason: this.options.reason,
      approvedAt: this.options.approvedAt,
      disposalDate: this.options.disposalDate,
      estimatedValue: this.options.estimatedValue,
      actualProceeds: this.options.actualProceeds,
      currency: this.options.currency,
      status: this.options.status,
      sanitizationChecklist: this.options.sanitizationChecklist,
      certificateNumber: this.options.certificateNumber,
      certificateIssuedAt: this.options.certificateIssuedAt,
      recipientInfo: this.options.recipientInfo,
      note: this.options.note,
    } satisfies Prisma.AssetDisposalCreateInput;

    return data;
  }

  async create(prisma: PrismaClient) {
    return prisma.assetDisposal.create({
      data: this.build(),
    });
  }
}
