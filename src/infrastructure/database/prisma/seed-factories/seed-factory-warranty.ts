/**
 * Warranty Factory
 *
 * Type-safe factory for generating Warranty test data
 */

import type { Prisma, PrismaClient } from "@/generated/prisma";
import type { WarrantyCoverageType } from "@/generated/prisma/enums";
import {
  generateSequentialCode,
  optionalConnect,
  requireConnect,
} from "../seed-utils.js";

export interface WarrantyFactoryOptions {
  assetId: string;
  vendorId?: string;
  coverageType: WarrantyCoverageType;
  coverageDetails?: string;
  policyReference?: string;
  slaDetails?: Prisma.InputJsonValue;
  startDate: Date;
  endDate: Date;
  cost?: number;
  currency?: string;
  note?: string;
}

export class WarrantyFactory {
  private options: WarrantyFactoryOptions;

  constructor(options: WarrantyFactoryOptions) {
    this.options = options;
  }

  build(): Prisma.WarrantyCreateInput {
    const {
      assetId,
      vendorId,
      coverageType,
      coverageDetails,
      policyReference,
      slaDetails,
      startDate,
      endDate,
      cost,
      currency,
      note,
    } = this.options;

    const data = {
      ...requireConnect(assetId, "asset"),
      ...optionalConnect(vendorId, "vendor"),
      coverageType,
      coverageDetails,
      policyReference,
      slaDetails,
      startDate,
      endDate,
      cost,
      currency,
      note,
    } satisfies Prisma.WarrantyCreateInput;

    return data;
  }

  async create(prisma: PrismaClient) {
    return prisma.warranty.create({
      data: this.build(),
    });
  }

  /**
   * Create warranty with standard duration
   */
  static fromAsset(
    asset: { id: string; purchaseDate: Date | null },
    warrantyMonths: number,
    provider: string,
    type: WarrantyCoverageType,
    sequenceNumber: number,
  ): WarrantyFactory {
    const purchaseDate = asset.purchaseDate ?? new Date();
    const startDate = new Date(purchaseDate);
    const endDate = new Date(purchaseDate);
    endDate.setMonth(endDate.getMonth() + warrantyMonths);

    return new WarrantyFactory({
      assetId: asset.id,
      coverageType: type,
      policyReference: generateSequentialCode(`WTY-${type}`, sequenceNumber),
      startDate,
      endDate,
      coverageDetails: `${warrantyMonths}-month ${type.toLowerCase()} warranty from ${provider}`,
      note:
        type === "EXTENDED"
          ? "Premium support included"
          : "Standard terms apply",
    });
  }
}
