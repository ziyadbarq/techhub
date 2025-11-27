/**
 * Prisma AssetCategory Repository Implementation
 * Handles persistence for asset categories
 */

import { inject, injectable } from "inversify";
import type { PrismaClient } from "@/generated/prisma";
import type { AssetCategory as PrismaAssetCategory } from "@/generated/prisma";

import { DI_TOKENS } from "@/di/types";
import { AssetCategory } from "@/core/domain/entities/asset-category.entity";
import type { IAssetCategoryRepository } from "@/core/repositories/asset-category.repository.interface";
import { createRepositoryLogger } from "./repository-logger";

@injectable()
export class PrismaAssetCategoryRepository implements IAssetCategoryRepository {
  private readonly logger = createRepositoryLogger("AssetCategoryRepository");

  constructor(
    @inject(DI_TOKENS.PrismaClient)
    private readonly prisma: PrismaClient,
  ) {}

  async create(assetCategory: AssetCategory): Promise<AssetCategory> {
    const timer = this.logger.startTimer();

    try {
      const created = await this.prisma.assetCategory.create({
        data: {
          code: assetCategory.code,
          name: assetCategory.name,
          description: assetCategory.description,
          lifecycleModelId: assetCategory.lifecycleModelId,
          isConsumable: assetCategory.isConsumable,
        },
      });

      this.logger.timed("create", "AssetCategory created", timer(), {
        id: created.id,
      });
      return this.toDomain(created);
    } catch (error) {
      this.logger.error("create", "Failed to create asset category", error);
      throw error;
    }
  }

  async findById(id: string): Promise<AssetCategory | null> {
    const assetCategory = await this.prisma.assetCategory.findUnique({
      where: { id },
    });

    return assetCategory ? this.toDomain(assetCategory) : null;
  }

  async findByCode(code: string): Promise<AssetCategory | null> {
    const assetCategory = await this.prisma.assetCategory.findUnique({
      where: { code },
    });

    return assetCategory ? this.toDomain(assetCategory) : null;
  }

  async findByCodes(codes: string[]): Promise<AssetCategory[]> {
    if (codes.length === 0) return [];

    const timer = this.logger.startTimer();

    try {
      // Filter out empty/null values and normalize to uppercase
      const validCodes = codes
        .filter((c) => c !== null && c !== undefined && c.trim() !== "")
        .map((c) => c.toUpperCase().trim());

      if (validCodes.length === 0) return [];

      const assetCategories = await this.prisma.assetCategory.findMany({
        where: { code: { in: validCodes } },
      });

      this.logger.timed(
        "findByCodes",
        "Asset categories fetched by codes",
        timer(),
        {
          requestedCount: validCodes.length,
          foundCount: assetCategories.length,
        },
      );

      return assetCategories.map((ac: PrismaAssetCategory) =>
        this.toDomain(ac),
      );
    } catch (error) {
      this.logger.error(
        "findByCodes",
        "Failed to fetch asset categories by codes",
        error,
      );
      throw error;
    }
  }

  async findByName(name: string): Promise<AssetCategory | null> {
    const assetCategory = await this.prisma.assetCategory.findUnique({
      where: { name },
    });

    return assetCategory ? this.toDomain(assetCategory) : null;
  }

  async findByLifecycleModel(
    lifecycleModelId: string,
  ): Promise<AssetCategory[]> {
    const assetCategories = await this.prisma.assetCategory.findMany({
      where: { lifecycleModelId },
      orderBy: { name: "asc" },
    });

    return assetCategories.map((ac: PrismaAssetCategory) => this.toDomain(ac));
  }

  async findConsumable(): Promise<AssetCategory[]> {
    const assetCategories = await this.prisma.assetCategory.findMany({
      where: { isConsumable: true },
      orderBy: { name: "asc" },
    });

    return assetCategories.map((ac: PrismaAssetCategory) => this.toDomain(ac));
  }

  async findNonConsumable(): Promise<AssetCategory[]> {
    const assetCategories = await this.prisma.assetCategory.findMany({
      where: { isConsumable: false },
      orderBy: { name: "asc" },
    });

    return assetCategories.map((ac: PrismaAssetCategory) => this.toDomain(ac));
  }

  async findAll(options?: {
    skip?: number;
    take?: number;
    orderBy?: "name" | "code" | "createdAt";
    order?: "asc" | "desc";
  }): Promise<AssetCategory[]> {
    const orderBy = options?.orderBy || "name";
    const order = options?.order || "asc";

    const assetCategories = await this.prisma.assetCategory.findMany({
      skip: options?.skip,
      take: options?.take,
      orderBy: { [orderBy]: order },
    });

    return assetCategories.map((ac: PrismaAssetCategory) => this.toDomain(ac));
  }

  async search(
    query: string,
    options?: {
      skip?: number;
      take?: number;
      isConsumable?: boolean;
    },
  ): Promise<AssetCategory[]> {
    const assetCategories = await this.prisma.assetCategory.findMany({
      where: {
        AND: [
          {
            OR: [
              { name: { contains: query, mode: "insensitive" } },
              { code: { contains: query, mode: "insensitive" } },
              { description: { contains: query, mode: "insensitive" } },
            ],
          },
          options?.isConsumable !== undefined
            ? { isConsumable: options.isConsumable }
            : {},
        ],
      },
      skip: options?.skip,
      take: options?.take,
      orderBy: { name: "asc" },
    });

    return assetCategories.map((ac: PrismaAssetCategory) => this.toDomain(ac));
  }

  async count(): Promise<number> {
    return this.prisma.assetCategory.count();
  }

  async countAssetModels(id: string): Promise<number> {
    return this.prisma.assetModel.count({
      where: { assetCategoryId: id },
    });
  }

  async countAssets(id: string): Promise<number> {
    return this.prisma.asset.count({
      where: { assetCategoryId: id },
    });
  }

  async update(assetCategory: AssetCategory): Promise<AssetCategory> {
    const timer = this.logger.startTimer();

    try {
      const updated = await this.prisma.assetCategory.update({
        where: { id: assetCategory.id },
        data: {
          code: assetCategory.code,
          name: assetCategory.name,
          description: assetCategory.description,
          lifecycleModelId: assetCategory.lifecycleModelId,
          isConsumable: assetCategory.isConsumable,
        },
      });

      this.logger.timed("update", "AssetCategory updated", timer(), {
        id: updated.id,
      });
      return this.toDomain(updated);
    } catch (error) {
      this.logger.error("update", "Failed to update asset category", error);
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    const timer = this.logger.startTimer();

    try {
      await this.prisma.assetCategory.delete({
        where: { id },
      });

      this.logger.timed("delete", "AssetCategory deleted", timer(), { id });
    } catch (error) {
      this.logger.error("delete", "Failed to delete asset category", error);
      throw error;
    }
  }

  async hasAssetModels(id: string): Promise<boolean> {
    const count = await this.countAssetModels(id);
    return count > 0;
  }

  async hasAssets(id: string): Promise<boolean> {
    const count = await this.countAssets(id);
    return count > 0;
  }

  async existsByCode(code: string, excludeId?: string): Promise<boolean> {
    const assetCategory = await this.prisma.assetCategory.findFirst({
      where: {
        code,
        id: excludeId ? { not: excludeId } : undefined,
      },
    });

    return assetCategory !== null;
  }

  async existsByName(name: string, excludeId?: string): Promise<boolean> {
    const assetCategory = await this.prisma.assetCategory.findFirst({
      where: {
        name,
        id: excludeId ? { not: excludeId } : undefined,
      },
    });

    return assetCategory !== null;
  }

  private toDomain(prismaAssetCategory: PrismaAssetCategory): AssetCategory {
    return AssetCategory.reconstitute({
      id: prismaAssetCategory.id,
      code: prismaAssetCategory.code,
      name: prismaAssetCategory.name,
      description: prismaAssetCategory.description,
      lifecycleModelId: prismaAssetCategory.lifecycleModelId,
      isConsumable: prismaAssetCategory.isConsumable,
      createdAt: prismaAssetCategory.createdAt,
      updatedAt: prismaAssetCategory.updatedAt,
    });
  }
}
