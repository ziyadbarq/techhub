/**
 * Prisma Asset Repository Implementation
 */

import { injectable, inject } from "inversify";
import type {
  PrismaClient,
  Asset as PrismaAsset,
  Prisma,
} from "@/generated/prisma/server";
import type { DepreciationModelEnum } from "@/generated/prisma";
import { DI_TOKENS } from "@/di/types";
import type {
  IAssetRepository,
  AssetSearchOptions,
  PaginatedResult,
  AssetStatistics,
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
          purchaseCostSar: asset.purchaseCostSar || null,
          currency: asset.currency,
          depreciationModel:
            (asset.depreciationModel as DepreciationModelEnum) ?? null,
          depreciationStart: asset.depreciationStart,
          depreciationEnd: asset.depreciationEnd,
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
    const where = this.buildWhereClause(options);
    const orderBy = this.buildOrderBy(options);

    const assets = await this.prisma.asset.findMany({
      where,
      orderBy,
      take: options.limit,
      skip: options.offset,
    });

    return assets.map((a) => this.toDomain(a));
  }

  async searchPaginated(
    options: AssetSearchOptions,
  ): Promise<PaginatedResult<Asset>> {
    const timer = this.logger.startTimer();

    try {
      const where = this.buildWhereClause(options);
      const orderBy = this.buildOrderBy(options);
      const pageSize = options.limit || 20;
      const offset = options.offset || 0;

      const [assets, total] = await Promise.all([
        this.prisma.asset.findMany({
          where,
          orderBy,
          take: pageSize,
          skip: offset,
        }),
        this.prisma.asset.count({ where }),
      ]);

      const page = Math.floor(offset / pageSize) + 1;
      const totalPages = Math.ceil(total / pageSize);

      this.logger.timed("searchPaginated", "Assets searched", timer(), {
        total,
        page,
        pageSize,
      });

      return {
        items: assets.map((a) => this.toDomain(a)),
        total,
        page,
        pageSize,
        totalPages,
      };
    } catch (error) {
      this.logger.error("searchPaginated", "Failed to search assets", error);
      throw error;
    }
  }

  async getStatistics(
    filters?: Omit<
      AssetSearchOptions,
      "limit" | "offset" | "sortBy" | "sortOrder"
    >,
  ): Promise<AssetStatistics> {
    const timer = this.logger.startTimer();

    try {
      const where = filters ? this.buildWhereClause(filters) : {};

      const [total, assigned] = await Promise.all([
        this.prisma.asset.count({ where }),
        this.prisma.assetAssignment.count({
          where: {
            asset: where,
            endDate: null, // Currently assigned (no end date)
          },
        }),
      ]);

      const available = total - assigned;

      this.logger.timed("getStatistics", "Asset statistics fetched", timer(), {
        total,
        assigned,
        available,
      });

      return {
        total,
        assigned,
        available,
      };
    } catch (error) {
      this.logger.error(
        "getStatistics",
        "Failed to get asset statistics",
        error,
      );
      throw error;
    }
  }

  async deleteMany(ids: string[]): Promise<number> {
    if (ids.length === 0) return 0;

    const timer = this.logger.startTimer();

    try {
      // Safety check: Only delete assets without active assignments
      const result = await this.prisma.asset.deleteMany({
        where: {
          id: { in: ids },
          assetAssignments: { none: { endDate: null } },
        },
      });

      this.logger.timed("deleteMany", "Assets bulk deleted", timer(), {
        requested: ids.length,
        deleted: result.count,
      });

      return result.count;
    } catch (error) {
      this.logger.error("deleteMany", "Failed to bulk delete assets", error);
      throw error;
    }
  }

  async updateLifecycleStateMany(
    ids: string[],
    lifecycleStateId: string,
  ): Promise<number> {
    if (ids.length === 0) return 0;

    const timer = this.logger.startTimer();

    try {
      const result = await this.prisma.asset.updateMany({
        where: { id: { in: ids } },
        data: {
          lifecycleStateId,
          updatedAt: new Date(),
        },
      });

      this.logger.timed(
        "updateLifecycleStateMany",
        "Assets lifecycle state updated",
        timer(),
        {
          requested: ids.length,
          updated: result.count,
          lifecycleStateId,
        },
      );

      return result.count;
    } catch (error) {
      this.logger.error(
        "updateLifecycleStateMany",
        "Failed to update lifecycle state",
        error,
      );
      throw error;
    }
  }

  async updateSoftDelete(id: string): Promise<void> {
    await this.prisma.asset.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  /**
   * Build where clause from search options
   */
  private buildWhereClause(
    options: AssetSearchOptions,
  ): Prisma.AssetWhereInput {
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

    return where;
  }

  /**
   * Build orderBy clause from search options
   */
  private buildOrderBy(
    options: AssetSearchOptions,
  ): Prisma.AssetOrderByWithRelationInput {
    const sortBy = options.sortBy || "assetTag";
    const sortOrder = options.sortOrder || "asc";

    return { [sortBy]: sortOrder };
  }

  async count(): Promise<number> {
    return await this.prisma.asset.count();
  }

  async countBySearch(options: AssetSearchOptions): Promise<number> {
    const where = this.buildWhereClause(options);
    return await this.prisma.asset.count({ where });
  }

  async findDepreciationSnapshot(): Promise<
    {
      assetTag: string;
      assetCategoryName: string | null;
      purchaseDate: Date | null;
      depreciationEnd: Date | null;
    }[]
  > {
    const assets = await this.prisma.asset.findMany({
      where: {
        depreciationEnd: {
          not: null,
        },
        deletedAt: null,
      },
      select: {
        assetTag: true,
        purchaseDate: true,
        depreciationEnd: true,
        assetCategory: {
          select: { name: true },
        },
      },
      orderBy: {
        depreciationEnd: "asc",
      },
    });

    return assets.map((asset) => ({
      assetTag: asset.assetTag,
      assetCategoryName: asset.assetCategory?.name ?? null,
      purchaseDate: asset.purchaseDate,
      depreciationEnd: asset.depreciationEnd,
    }));
  }

  async findCategoryValueSummary() {
    const grouped = await this.prisma.asset.groupBy({
      by: ["assetCategoryId"],
      where: { deletedAt: null },
      _count: { _all: true },
      _sum: {
        purchaseCostSar: true,
      },
    });

    const categoryIds = grouped.map((g) => g.assetCategoryId);
    const categories =
      categoryIds.length === 0
        ? []
        : await this.prisma.assetCategory.findMany({
            where: { id: { in: categoryIds } },
            select: { id: true, name: true },
          });
    const categoryNameMap = new Map(
      categories.map((cat) => [cat.id, cat.name]),
    );

    return grouped.map((g) => ({
      categoryId: g.assetCategoryId,
      categoryName: categoryNameMap.get(g.assetCategoryId) ?? null,
      assetCount: g._count._all,
      totalPurchaseCostSar: Number(g._sum.purchaseCostSar ?? 0),
    }));
  }

  async findUnassignedAssetsSnapshot(now = new Date()) {
    const assets = await this.prisma.asset.findMany({
      where: {
        deletedAt: null,
        assetAssignments: {
          none: {
            OR: [{ endDate: null }, { endDate: { gte: now } }],
          },
        },
      },
      select: {
        assetTag: true,
        purchaseDate: true,
        assetCategory: { select: { name: true } },
        currentStockLocation: { select: { name: true } },
      },
      orderBy: {
        purchaseDate: "asc",
      },
    });

    return assets.map((asset) => ({
      assetTag: asset.assetTag,
      assetCategoryName: asset.assetCategory?.name ?? null,
      stockLocationName: asset.currentStockLocation?.name ?? null,
      purchaseDate: asset.purchaseDate,
    }));
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
          purchaseCostSar: asset.purchaseCostSar || null,
          currency: asset.currency,
          depreciationModel:
            (asset.depreciationModel as DepreciationModelEnum) ?? null,
          depreciationStart: asset.depreciationStart,
          depreciationEnd: asset.depreciationEnd,
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
      purchaseCostSar: prismaAsset.purchaseCostSar
        ? Number(prismaAsset.purchaseCostSar)
        : null,
      currency: prismaAsset.currency,
      depreciationModel: prismaAsset.depreciationModel,
      depreciationStart: prismaAsset.depreciationStart,
      depreciationEnd: prismaAsset.depreciationEnd,
      condition: prismaAsset.condition,
      currentStockLocationId: prismaAsset.currentStockLocationId,
      attributes: fromJsonValue(prismaAsset.attributes),
      note: prismaAsset.note,
      createdAt: prismaAsset.createdAt,
      updatedAt: prismaAsset.updatedAt,
    });
  }
}
