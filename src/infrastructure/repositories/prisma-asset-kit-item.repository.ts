/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// TODO: Fix type errors - this is WIP code

/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// TODO: Fix type errors - this is WIP code

import { injectable, inject } from "inversify";
import type { PrismaClient } from "@/generated/prisma";
import { DI_TOKENS } from "@/di/types";
import type { IAssetKitItemRepository } from "@/core/repositories/asset-kit-item.repository.interface";
import { AssetKitItem } from "@/core/domain/entities/asset-kit-item.entity";
import { createRepositoryLogger } from "./repository-logger";

@injectable()
export class PrismaAssetKitItemRepository implements IAssetKitItemRepository {
  private readonly logger = createRepositoryLogger("AssetKitItem");

  constructor(
    @inject(DI_TOKENS.PrismaClient)
    private readonly prisma: PrismaClient,
  ) {}

  async create(item: AssetKitItem): Promise<AssetKitItem> {
    const data = {
      id: item.id,
      asset_kit_id: item.assetKitId,
      asset_category_id: item.assetCategoryId,
      asset_model_id: item.assetModelId,
      quantity: item.quantity,
      is_required: item.isRequired,
      note: item.note,
      created_at: item.createdAt,
      updated_at: item.updatedAt,
    };

    const created = await this.prisma.assetKitItem.create({ data });
    return this.toDomain(created);
  }

  async findById(id: string): Promise<AssetKitItem | null> {
    const item = await this.prisma.assetKitItem.findUnique({
      where: { id },
    });

    return item ? this.toDomain(item) : null;
  }

  async findByKitId(kitId: string): Promise<AssetKitItem[]> {
    const items = await this.prisma.assetKitItem.findMany({
      where: { asset_kit_id: kitId },
      orderBy: { created_at: "asc" },
    });

    return items.map((i) => this.toDomain(i));
  }

  async findByCategoryId(
    categoryId: string,
    options?: { skip?: number; take?: number },
  ): Promise<AssetKitItem[]> {
    const items = await this.prisma.assetKitItem.findMany({
      where: { asset_category_id: categoryId },
      skip: options?.skip,
      take: options?.take,
      orderBy: { created_at: "desc" },
    });

    return items.map((i) => this.toDomain(i));
  }

  async findByModelId(
    modelId: string,
    options?: { skip?: number; take?: number },
  ): Promise<AssetKitItem[]> {
    const items = await this.prisma.assetKitItem.findMany({
      where: { asset_model_id: modelId },
      skip: options?.skip,
      take: options?.take,
      orderBy: { created_at: "desc" },
    });

    return items.map((i) => this.toDomain(i));
  }

  async findRequiredByKitId(kitId: string): Promise<AssetKitItem[]> {
    const items = await this.prisma.assetKitItem.findMany({
      where: {
        asset_kit_id: kitId,
        is_required: true,
      },
      orderBy: { created_at: "asc" },
    });

    return items.map((i) => this.toDomain(i));
  }

  async findOptionalByKitId(kitId: string): Promise<AssetKitItem[]> {
    const items = await this.prisma.assetKitItem.findMany({
      where: {
        asset_kit_id: kitId,
        is_required: false,
      },
      orderBy: { created_at: "asc" },
    });

    return items.map((i) => this.toDomain(i));
  }

  async kitHasCategory(kitId: string, categoryId: string): Promise<boolean> {
    const count = await this.prisma.assetKitItem.count({
      where: {
        asset_kit_id: kitId,
        asset_category_id: categoryId,
      },
    });

    return count > 0;
  }

  async kitHasModel(kitId: string, modelId: string): Promise<boolean> {
    const count = await this.prisma.assetKitItem.count({
      where: {
        asset_kit_id: kitId,
        asset_model_id: modelId,
      },
    });

    return count > 0;
  }

  async getTotalQuantityByKitId(kitId: string): Promise<number> {
    const result = await this.prisma.assetKitItem.aggregate({
      where: { asset_kit_id: kitId },
      _sum: {
        quantity: true,
      },
    });

    return result._sum.quantity ?? 0;
  }

  async update(item: AssetKitItem): Promise<AssetKitItem> {
    const data = {
      quantity: item.quantity,
      is_required: item.isRequired,
      note: item.note,
      updated_at: item.updatedAt,
    };

    const updated = await this.prisma.assetKitItem.update({
      where: { id: item.id },
      data,
    });

    return this.toDomain(updated);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.assetKitItem.delete({
      where: { id },
    });
  }

  async deleteByKitId(kitId: string): Promise<void> {
    await this.prisma.assetKitItem.deleteMany({
      where: { asset_kit_id: kitId },
    });
  }

  async countByKitId(kitId: string): Promise<number> {
    return this.prisma.assetKitItem.count({
      where: { asset_kit_id: kitId },
    });
  }

  async countRequiredByKitId(kitId: string): Promise<number> {
    return this.prisma.assetKitItem.count({
      where: {
        asset_kit_id: kitId,
        is_required: true,
      },
    });
  }

  private toDomain(prismaItem: {
    id: string;
    asset_kit_id: string;
    asset_category_id: string | null;
    asset_model_id: string | null;
    quantity: number;
    is_required: boolean;
    note: string | null;
    created_at: Date;
    updated_at: Date;
  }): AssetKitItem {
    return AssetKitItem.reconstitute({
      id: prismaItem.id,
      assetKitId: prismaItem.asset_kit_id,
      assetCategoryId: prismaItem.asset_category_id,
      assetModelId: prismaItem.asset_model_id,
      quantity: prismaItem.quantity,
      isRequired: prismaItem.is_required,
      note: prismaItem.note,
      createdAt: prismaItem.created_at,
      updatedAt: prismaItem.updated_at,
    });
  }
}
