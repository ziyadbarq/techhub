/**
 * Asset Factory
 *
 * Type-safe factory for generating Asset test data
 * Uses builder pattern for flexibility
 */

import type { Prisma, PrismaClient } from "@/generated/prisma/server";
import {
  generateAssetTag,
  generateSerialNumber,
  getRelativeDateByYears,
  optionalConnect,
  requireConnect,
} from "../seed-utils.js";

export interface AssetFactoryOptions {
  assetCategoryId: string;
  assetModelId?: string;
  vendorId?: string;
  assetTag?: string;
  serialNumber?: string;
  purchaseDate?: Date;
  purchaseCost?: number;
  currency?: string;
  lifecycleStateId?: string;
  condition?: string;
  currentStockLocationId?: string;
  note?: string;
}

export class AssetFactory {
  private options: AssetFactoryOptions;

  constructor(options: AssetFactoryOptions) {
    this.options = options;
  }

  /**
   * Generate asset data for Prisma create
   */
  build(): Prisma.AssetCreateInput {
    const {
      assetCategoryId,
      assetModelId,
      vendorId,
      assetTag,
      serialNumber,
      purchaseDate,
      purchaseCost,
      currency,
      lifecycleStateId,
      condition,
      currentStockLocationId,
      note,
    } = this.options;

    const data = {
      ...requireConnect(assetCategoryId, "assetCategory"),
      ...optionalConnect(assetModelId, "assetModel"),
      ...optionalConnect(vendorId, "vendor"),
      assetTag: assetTag ?? generateAssetTag("ASSET", Date.now()),
      serialNumber,
      purchaseDate: purchaseDate ?? getRelativeDateByYears(-1),
      purchaseCost,
      currency: currency ?? "SAR",
      ...optionalConnect(lifecycleStateId, "lifecycleState"),
      condition,
      ...optionalConnect(currentStockLocationId, "currentStockLocation"),
      note,
    } satisfies Prisma.AssetCreateInput;

    return data;
  }

  /**
   * Create asset in database
   */
  async create(prisma: PrismaClient) {
    return prisma.asset.create({
      data: this.build(),
    });
  }

  /**
   * Create multiple assets with sequential numbering
   */
  static async createBatch(
    prisma: PrismaClient,
    options: Omit<AssetFactoryOptions, "assetTag" | "serialNumber">,
    count: number,
    categoryCode: string,
  ) {
    const assets = [];
    for (let i = 1; i <= count; i++) {
      const factory = new AssetFactory({
        ...options,
        assetTag: generateAssetTag(categoryCode, i),
        serialNumber: generateSerialNumber(
          categoryCode,
          new Date().getFullYear(),
          i,
        ),
      });
      assets.push(await factory.create(prisma));
    }
    return assets;
  }
}
