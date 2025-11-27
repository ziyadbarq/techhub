/**
 * Prisma Asset Repository Implementation
 */

import { injectable, inject } from "inversify";
import type {
  PrismaClient,
  Asset as PrismaAsset,
  Prisma,
} from "@/generated/prisma/server";
import { DI_TOKENS } from "@/di/types";
import type {
  IAssetRepository,
  AssetSearchOptions,
} from "@/core/repositories/asset.repository.interface";
import { Asset } from "@/core/domain/entities/asset.entity";
import { createRepositoryLogger } from "./repository-logger";
import { toJsonValue, fromJsonValue } from "./prisma-helpers";

@injectable()
export class PrismaAssetRepository implements IAssetRepository {
  private readonly logger = createRepositoryLogger("AssetRepository");

  constructor(
    @inject(DI_TOKENS.PrismaClient)
    private readonly prisma: PrismaClient,
  ) {}

  async create(asset: Asset): Promise<Asset> {
    const timer = this.logger.startTimer();

    try {
      const created = await this.prisma.asset.create({
        data: {
          assetTag: asset.assetTag,
          assetCategoryId: asset.assetCategoryId,
          assetModelId: asset.assetModelId,
          vendorId: asset.vendorId,
          contractId: asset.contractId,
          lifecycleStateId: asset.lifecycleStateId,
          serialNumber: asset.serialNumber,
          purchaseDate: asset.purchaseDate,
          purchaseCost: asset.purchaseCost || null,
          currency: asset.currency,
          depreciationModel: asset.depreciationModel,
          depreciationStart: asset.depreciationStart,
          depreciationEnd: asset.depreciationEnd,
          warrantyEndDate: asset.warrantyEndDate,
          currentStockLocationId: asset.currentStockLocationId,
          attributes: toJsonValue(asset.attributes),
          note: asset.note,
        },
      });

      this.logger.timed("create", "Asset created", timer(), {
        id: created.id,
      });
      return this.toDomain(created);
    } catch (error) {
      this.logger.error("create", "Failed to create asset", error);
      throw error;
    }
  }

  async findById(id: string): Promise<Asset | null> {
    const asset = await this.prisma.asset.findUnique({
      where: { id },
    });

    return asset ? this.toDomain(asset) : null;
  }

  async findByIds(ids: string[]): Promise<Asset[]> {
    if (ids.length === 0) return [];

    const assets = await this.prisma.asset.findMany({
      where: { id: { in: ids } },
    });

    return assets.map((a) => this.toDomain(a));
  }

  async findByAssetTag(assetTag: string): Promise<Asset | null> {
    const asset = await this.prisma.asset.findUnique({
      where: { assetTag: assetTag.toUpperCase() },
    });

    return asset ? this.toDomain(asset) : null;
  }

  async findBySerialNumber(serialNumber: string): Promise<Asset | null> {
    const asset = await this.prisma.asset.findUnique({
      where: { serialNumber },
    });

    return asset ? this.toDomain(asset) : null;
  }

  async findByAssetTags(assetTags: string[]): Promise<Asset[]> {
    if (assetTags.length === 0) return [];

    const timer = this.logger.startTimer();

    try {
      // Normalize to uppercase for case-insensitive matching
      const normalizedTags = assetTags.map((tag) => tag.toUpperCase());

      const assets = await this.prisma.asset.findMany({
        where: { assetTag: { in: normalizedTags } },
      });

      this.logger.timed("findByAssetTags", "Assets fetched by tags", timer(), {
        requestedCount: assetTags.length,
        foundCount: assets.length,
      });

      return assets.map((a) => this.toDomain(a));
    } catch (error) {
      this.logger.error(
        "findByAssetTags",
        "Failed to fetch assets by tags",
        error,
      );
      throw error;
    }
  }

  async findBySerialNumbers(serialNumbers: string[]): Promise<Asset[]> {
    if (serialNumbers.length === 0) return [];

    const timer = this.logger.startTimer();

    try {
      // Filter out empty/null values
      const validSerials = serialNumbers.filter(
        (s) => s !== null && s !== undefined && s.trim() !== "",
      );

      if (validSerials.length === 0) return [];

      const assets = await this.prisma.asset.findMany({
        where: { serialNumber: { in: validSerials } },
      });

      this.logger.timed(
        "findBySerialNumbers",
        "Assets fetched by serial numbers",
        timer(),
        {
          requestedCount: validSerials.length,
          foundCount: assets.length,
        },
      );

      return assets.map((a) => this.toDomain(a));
    } catch (error) {
      this.logger.error(
        "findBySerialNumbers",
        "Failed to fetch assets by serial numbers",
        error,
      );
      throw error;
    }
  }

  async findByAssetCategory(assetCategoryId: string): Promise<Asset[]> {
    const assets = await this.prisma.asset.findMany({
      where: { assetCategoryId },
      orderBy: { assetTag: "asc" },
    });

    return assets.map((a) => this.toDomain(a));
  }

  async findByAssetModel(assetModelId: string): Promise<Asset[]> {
    const assets = await this.prisma.asset.findMany({
      where: { assetModelId },
      orderBy: { assetTag: "asc" },
    });

    return assets.map((a) => this.toDomain(a));
  }

  async findByVendor(vendorId: string): Promise<Asset[]> {
    const assets = await this.prisma.asset.findMany({
      where: { vendorId },
      orderBy: { assetTag: "asc" },
    });

    return assets.map((a) => this.toDomain(a));
  }

  async findByLifecycleState(lifecycleStateId: string): Promise<Asset[]> {
    const assets = await this.prisma.asset.findMany({
      where: { lifecycleStateId },
      orderBy: { assetTag: "asc" },
    });

    return assets.map((a) => this.toDomain(a));
  }

  async findByStockLocation(stockLocationId: string): Promise<Asset[]> {
    const assets = await this.prisma.asset.findMany({
      where: { currentStockLocationId: stockLocationId },
      orderBy: { assetTag: "asc" },
    });

    return assets.map((a) => this.toDomain(a));
  }

  async findByContract(contractId: string): Promise<Asset[]> {
    const assets = await this.prisma.asset.findMany({
      where: { contractId },
      orderBy: { assetTag: "asc" },
    });

    return assets.map((a) => this.toDomain(a));
  }

  async findWithActiveWarranty(): Promise<Asset[]> {
    const now = new Date();
    const assets = await this.prisma.asset.findMany({
      where: {
        warrantyEndDate: {
          gte: now,
        },
      },
      orderBy: { warrantyEndDate: "asc" },
    });

    return assets.map((a) => this.toDomain(a));
  }

  async findDepreciating(): Promise<Asset[]> {
    const assets = await this.prisma.asset.findMany({
      where: {
        AND: [
          { depreciationModel: { not: null } },
          { depreciationStart: { not: null } },
        ],
      },
      orderBy: { assetTag: "asc" },
    });

    return assets.map((a) => this.toDomain(a));
  }

  async findFullyDepreciated(): Promise<Asset[]> {
    const now = new Date();
    const assets = await this.prisma.asset.findMany({
      where: {
        AND: [
          { depreciationModel: { not: null } },
          { depreciationEnd: { lte: now } },
        ],
      },
      orderBy: { depreciationEnd: "desc" },
    });

    return assets.map((a) => this.toDomain(a));
  }

  async findAll(limit?: number, offset?: number): Promise<Asset[]> {
    const assets = await this.prisma.asset.findMany({
      orderBy: { assetTag: "asc" },
      take: limit,
      skip: offset,
    });

    return assets.map((a) => this.toDomain(a));
  }

  async search(options: AssetSearchOptions): Promise<Asset[]> {
    const where: Prisma.AssetWhereInput = {};

    // Category filter
    if (options.assetCategoryId) {
      where.assetCategoryId = options.assetCategoryId;
    }

    // Model filter
    if (options.assetModelId) {
      where.assetModelId = options.assetModelId;
    }

    // Vendor filter
    if (options.vendorId) {
      where.vendorId = options.vendorId;
    }

    // Lifecycle state filter
    if (options.lifecycleStateId) {
      where.lifecycleStateId = options.lifecycleStateId;
    }

    // Stock location filter
    if (options.currentStockLocationId) {
      where.currentStockLocationId = options.currentStockLocationId;
    }

    // Contract filter
    if (options.contractId) {
      where.contractId = options.contractId;
    }

    // Search term (asset tag, serial number, note)
    if (options.searchTerm && options.searchTerm.trim().length > 0) {
      where.OR = [
        {
          assetTag: {
            contains: options.searchTerm,
            mode: "insensitive",
          },
        },
        {
          serialNumber: {
            contains: options.searchTerm,
            mode: "insensitive",
          },
        },
        {
          note: {
            contains: options.searchTerm,
            mode: "insensitive",
          },
        },
      ];
    }

    // Warranty status filter
    if (options.warrantyStatus) {
      const now = new Date();
      if (options.warrantyStatus === "active") {
        where.warrantyEndDate = { gte: now };
      } else if (options.warrantyStatus === "expired") {
        where.warrantyEndDate = { lt: now };
      } else if (options.warrantyStatus === "none") {
        where.warrantyEndDate = null;
      }
    }

    // Depreciation status filter
    if (options.depreciationStatus) {
      const now = new Date();
      if (options.depreciationStatus === "active") {
        where.AND = [
          { depreciationModel: { not: null } },
          {
            OR: [{ depreciationEnd: { gte: now } }, { depreciationEnd: null }],
          },
        ];
      } else if (options.depreciationStatus === "complete") {
        where.AND = [
          { depreciationModel: { not: null } },
          { depreciationEnd: { lt: now } },
        ];
      } else if (options.depreciationStatus === "none") {
        where.depreciationModel = null;
      }
    }

    const assets = await this.prisma.asset.findMany({
      where,
      orderBy: { assetTag: "asc" },
      take: options.limit,
      skip: options.offset,
    });

    return assets.map((a) => this.toDomain(a));
  }

  async count(): Promise<number> {
    return await this.prisma.asset.count();
  }

  async countBySearch(options: AssetSearchOptions): Promise<number> {
    const where: Prisma.AssetWhereInput = {};

    if (options.assetCategoryId) {
      where.assetCategoryId = options.assetCategoryId;
    }

    if (options.assetModelId) {
      where.assetModelId = options.assetModelId;
    }

    if (options.vendorId) {
      where.vendorId = options.vendorId;
    }

    if (options.lifecycleStateId) {
      where.lifecycleStateId = options.lifecycleStateId;
    }

    if (options.currentStockLocationId) {
      where.currentStockLocationId = options.currentStockLocationId;
    }

    if (options.contractId) {
      where.contractId = options.contractId;
    }

    if (options.searchTerm && options.searchTerm.trim().length > 0) {
      where.OR = [
        { assetTag: { contains: options.searchTerm, mode: "insensitive" } },
        {
          serialNumber: { contains: options.searchTerm, mode: "insensitive" },
        },
        { note: { contains: options.searchTerm, mode: "insensitive" } },
      ];
    }

    return await this.prisma.asset.count({ where });
  }

  async update(asset: Asset): Promise<Asset> {
    const timer = this.logger.startTimer();

    try {
      const updated = await this.prisma.asset.update({
        where: { id: asset.id },
        data: {
          assetTag: asset.assetTag,
          assetModelId: asset.assetModelId,
          vendorId: asset.vendorId,
          contractId: asset.contractId,
          lifecycleStateId: asset.lifecycleStateId,
          serialNumber: asset.serialNumber,
          purchaseDate: asset.purchaseDate,
          purchaseCost: asset.purchaseCost || null,
          currency: asset.currency,
          depreciationModel: asset.depreciationModel,
          depreciationStart: asset.depreciationStart,
          depreciationEnd: asset.depreciationEnd,
          warrantyEndDate: asset.warrantyEndDate,
          currentStockLocationId: asset.currentStockLocationId,
          attributes: toJsonValue(asset.attributes),
          note: asset.note,
          updatedAt: asset.updatedAt,
        },
      });

      this.logger.timed("update", "Asset updated", timer(), {
        id: updated.id,
      });
      return this.toDomain(updated);
    } catch (error) {
      this.logger.error("update", "Failed to update asset", error);
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    const timer = this.logger.startTimer();

    try {
      await this.prisma.asset.delete({
        where: { id },
      });

      this.logger.timed("delete", "Asset deleted", timer(), { id });
    } catch (error) {
      this.logger.error("delete", "Failed to delete asset", error);
      throw error;
    }
  }

  async existsByAssetTag(
    assetTag: string,
    excludeId?: string,
  ): Promise<boolean> {
    const count = await this.prisma.asset.count({
      where: {
        assetTag: assetTag.toUpperCase(),
        ...(excludeId && { id: { not: excludeId } }),
      },
    });

    return count > 0;
  }

  async existsBySerialNumber(
    serialNumber: string,
    excludeId?: string,
  ): Promise<boolean> {
    const count = await this.prisma.asset.count({
      where: {
        serialNumber,
        ...(excludeId && { id: { not: excludeId } }),
      },
    });

    return count > 0;
  }

  async hasAssignments(id: string): Promise<boolean> {
    const count = await this.prisma.assetAssignment.count({
      where: { assetId: id },
    });

    return count > 0;
  }

  async hasStockMovements(id: string): Promise<boolean> {
    const count = await this.prisma.stockMovement.count({
      where: { assetId: id },
    });

    return count > 0;
  }

  /**
   * Convert Prisma model to domain entity
   */
  private toDomain(prismaAsset: PrismaAsset): Asset {
    return Asset.reconstitute({
      id: prismaAsset.id,
      assetTag: prismaAsset.assetTag,
      assetCategoryId: prismaAsset.assetCategoryId,
      assetModelId: prismaAsset.assetModelId,
      vendorId: prismaAsset.vendorId,
      contractId: prismaAsset.contractId,
      lifecycleStateId: prismaAsset.lifecycleStateId,
      serialNumber: prismaAsset.serialNumber,
      purchaseDate: prismaAsset.purchaseDate,
      purchaseCost: prismaAsset.purchaseCost
        ? Number(prismaAsset.purchaseCost)
        : null,
      currency: prismaAsset.currency,
      depreciationModel: prismaAsset.depreciationModel,
      depreciationStart: prismaAsset.depreciationStart,
      depreciationEnd: prismaAsset.depreciationEnd,
      warrantyEndDate: prismaAsset.warrantyEndDate,
      condition: prismaAsset.condition,
      currentStockLocationId: prismaAsset.currentStockLocationId,
      attributes: fromJsonValue(prismaAsset.attributes),
      note: prismaAsset.note,
      createdAt: prismaAsset.createdAt,
      updatedAt: prismaAsset.updatedAt,
    });
  }
}
