/**
 * Prisma AssetModel Repository Implementation
 */

import { inject, injectable } from "inversify";
import type { PrismaClient } from "@/generated/prisma";
import type { AssetModel as PrismaAssetModel } from "@/generated/prisma";

import { DI_TOKENS } from "@/di/types";
import { AssetModel } from "@/core/domain/entities/asset-model.entity";
import type { IAssetModelRepository } from "@/core/repositories/asset-model.repository.interface";
import { createRepositoryLogger } from "./repository-logger";
import { toJsonValue, fromJsonValue } from "./prisma-helpers";

@injectable()
export class PrismaAssetModelRepository implements IAssetModelRepository {
  private readonly logger = createRepositoryLogger("AssetModelRepository");

  constructor(
    @inject(DI_TOKENS.PrismaClient)
    private readonly prisma: PrismaClient,
  ) {}

  async create(assetModel: AssetModel): Promise<AssetModel> {
    const timer = this.logger.startTimer();

    try {
      const created = await this.prisma.assetModel.create({
        data: {
          code: assetModel.code,
          name: assetModel.name,
          description: assetModel.description,
          assetCategoryId: assetModel.assetCategoryId,
          vendorId: assetModel.vendorId,
          defaultWarrantyMonths: assetModel.defaultWarrantyMonths,
          defaultAttributes: toJsonValue(assetModel.defaultAttributes),
        },
      });

      this.logger.timed("create", "AssetModel created", timer(), {
        id: created.id,
      });
      return this.toDomain(created);
    } catch (error) {
      this.logger.error("create", "Failed to create asset model", error);
      throw error;
    }
  }

  async findById(id: string): Promise<AssetModel | null> {
    const assetModel = await this.prisma.assetModel.findUnique({
      where: { id },
    });

    return assetModel ? this.toDomain(assetModel) : null;
  }

  async findByCode(code: string): Promise<AssetModel | null> {
    const assetModel = await this.prisma.assetModel.findUnique({
      where: { code },
    });

    return assetModel ? this.toDomain(assetModel) : null;
  }

  async findByAssetCategory(assetCategoryId: string): Promise<AssetModel[]> {
    const assetModels = await this.prisma.assetModel.findMany({
      where: { assetCategoryId },
      orderBy: { name: "asc" },
    });

    return assetModels.map((am: PrismaAssetModel) => this.toDomain(am));
  }

  async findByVendor(vendorId: string): Promise<AssetModel[]> {
    const assetModels = await this.prisma.assetModel.findMany({
      where: { vendorId },
      orderBy: { name: "asc" },
    });

    return assetModels.map((am: PrismaAssetModel) => this.toDomain(am));
  }

  async findAll(options?: {
    skip?: number;
    take?: number;
    orderBy?: "name" | "code" | "createdAt";
    order?: "asc" | "desc";
  }): Promise<AssetModel[]> {
    const orderBy = options?.orderBy || "name";
    const order = options?.order || "asc";

    const assetModels = await this.prisma.assetModel.findMany({
      skip: options?.skip,
      take: options?.take,
      orderBy: { [orderBy]: order },
    });

    return assetModels.map((am: PrismaAssetModel) => this.toDomain(am));
  }

  async search(
    query: string,
    options?: {
      skip?: number;
      take?: number;
      assetCategoryId?: string;
      vendorId?: string;
    },
  ): Promise<AssetModel[]> {
    const assetModels = await this.prisma.assetModel.findMany({
      where: {
        AND: [
          {
            OR: [
              { name: { contains: query, mode: "insensitive" } },
              { code: { contains: query, mode: "insensitive" } },
              { description: { contains: query, mode: "insensitive" } },
            ],
          },
          options?.assetCategoryId
            ? { assetCategoryId: options.assetCategoryId }
            : {},
          options?.vendorId ? { vendorId: options.vendorId } : {},
        ],
      },
      skip: options?.skip,
      take: options?.take,
      orderBy: { name: "asc" },
    });

    return assetModels.map((am: PrismaAssetModel) => this.toDomain(am));
  }

  async count(): Promise<number> {
    return this.prisma.assetModel.count();
  }

  async countAssets(id: string): Promise<number> {
    return this.prisma.asset.count({
      where: { assetModelId: id },
    });
  }

  async update(assetModel: AssetModel): Promise<AssetModel> {
    const timer = this.logger.startTimer();

    try {
      const updated = await this.prisma.assetModel.update({
        where: { id: assetModel.id },
        data: {
          code: assetModel.code,
          name: assetModel.name,
          description: assetModel.description,
          assetCategoryId: assetModel.assetCategoryId,
          vendorId: assetModel.vendorId,
          defaultWarrantyMonths: assetModel.defaultWarrantyMonths,
          defaultAttributes: toJsonValue(assetModel.defaultAttributes),
        },
      });

      this.logger.timed("update", "AssetModel updated", timer(), {
        id: updated.id,
      });
      return this.toDomain(updated);
    } catch (error) {
      this.logger.error("update", "Failed to update asset model", error);
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    const timer = this.logger.startTimer();

    try {
      await this.prisma.assetModel.delete({
        where: { id },
      });

      this.logger.timed("delete", "AssetModel deleted", timer(), { id });
    } catch (error) {
      this.logger.error("delete", "Failed to delete asset model", error);
      throw error;
    }
  }

  async hasAssets(id: string): Promise<boolean> {
    const count = await this.countAssets(id);
    return count > 0;
  }

  async existsByCode(code: string, excludeId?: string): Promise<boolean> {
    const assetModel = await this.prisma.assetModel.findFirst({
      where: {
        code,
        id: excludeId ? { not: excludeId } : undefined,
      },
    });

    return assetModel !== null;
  }

  private toDomain(prismaAssetModel: PrismaAssetModel): AssetModel {
    return AssetModel.reconstitute({
      id: prismaAssetModel.id,
      assetCategoryId: prismaAssetModel.assetCategoryId,
      vendorId: prismaAssetModel.vendorId,
      code: prismaAssetModel.code,
      name: prismaAssetModel.name,
      description: prismaAssetModel.description,
      defaultWarrantyMonths: prismaAssetModel.defaultWarrantyMonths,
      defaultAttributes: fromJsonValue(prismaAssetModel.defaultAttributes),
      createdAt: prismaAssetModel.createdAt,
      updatedAt: prismaAssetModel.updatedAt,
    });
  }
}
