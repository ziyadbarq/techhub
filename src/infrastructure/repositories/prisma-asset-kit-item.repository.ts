import { injectable, inject } from "inversify";
import type { PrismaClient } from "@/generated/prisma";
import { DI_TOKENS } from "@/di/types";
import type { IAssetKitItemRepository } from "@/core/repositories/asset-kit-item.repository.interface";
import { AssetKitItem } from "@/core/domain/entities/asset-kit-item.entity";

@injectable()
export class PrismaAssetKitItemRepository implements IAssetKitItemRepository {
  constructor(
    @inject(DI_TOKENS.PrismaClient)
    private readonly prisma: PrismaClient,
  ) {}

  async create(item: AssetKitItem): Promise<AssetKitItem> {
    const data = {
      id: item.id,
      assetKitId: item.assetKitId,
      assetCategoryId: item.assetCategoryId,
      assetModelId: item.assetModelId,
      quantity: item.quantity,
      isRequired: item.isRequired,
      note: item.note,
      createdAt: item.createdAt,
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
      where: { assetKitId: kitId },
      orderBy: { createdAt: "asc" },
    });

    return items.map((i) => this.toDomain(i));
  }

  async findByCategoryId(
    categoryId: string,
    options?: { skip?: number; take?: number },
  ): Promise<AssetKitItem[]> {
    const items = await this.prisma.assetKitItem.findMany({
      where: { assetCategoryId: categoryId },
      skip: options?.skip,
      take: options?.take,
      orderBy: { createdAt: "desc" },
    });

    return items.map((i) => this.toDomain(i));
  }

  async findByModelId(
    modelId: string,
    options?: { skip?: number; take?: number },
  ): Promise<AssetKitItem[]> {
    const items = await this.prisma.assetKitItem.findMany({
      where: { assetModelId: modelId },
      skip: options?.skip,
      take: options?.take,
      orderBy: { createdAt: "desc" },
    });

    return items.map((i) => this.toDomain(i));
  }

  async findRequiredByKitId(kitId: string): Promise<AssetKitItem[]> {
    const items = await this.prisma.assetKitItem.findMany({
      where: {
        assetKitId: kitId,
        isRequired: true,
      },
      orderBy: { createdAt: "asc" },
    });

    return items.map((i) => this.toDomain(i));
  }

  async findOptionalByKitId(kitId: string): Promise<AssetKitItem[]> {
    const items = await this.prisma.assetKitItem.findMany({
      where: {
        assetKitId: kitId,
        isRequired: false,
      },
      orderBy: { createdAt: "asc" },
    });

    return items.map((i) => this.toDomain(i));
  }

  async kitHasCategory(kitId: string, categoryId: string): Promise<boolean> {
    const count = await this.prisma.assetKitItem.count({
      where: {
        assetKitId: kitId,
        assetCategoryId: categoryId,
      },
    });

    return count > 0;
  }

  async kitHasModel(kitId: string, modelId: string): Promise<boolean> {
    const count = await this.prisma.assetKitItem.count({
      where: {
        assetKitId: kitId,
        assetModelId: modelId,
      },
    });

    return count > 0;
  }

  async getTotalQuantityByKitId(kitId: string): Promise<number> {
    const result = await this.prisma.assetKitItem.aggregate({
      where: { assetKitId: kitId },
      _sum: {
        quantity: true,
      },
    });

    return result._sum.quantity ?? 0;
  }

  async update(item: AssetKitItem): Promise<AssetKitItem> {
    const data = {
      quantity: item.quantity,
      isRequired: item.isRequired,
      note: item.note,
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
      where: { assetKitId: kitId },
    });
  }

  async countByKitId(kitId: string): Promise<number> {
    return this.prisma.assetKitItem.count({
      where: { assetKitId: kitId },
    });
  }

  async countRequiredByKitId(kitId: string): Promise<number> {
    return this.prisma.assetKitItem.count({
      where: {
        assetKitId: kitId,
        isRequired: true,
      },
    });
  }

  private toDomain(prismaItem: {
    id: string;
    assetKitId: string;
    assetCategoryId: string | null;
    assetModelId: string | null;
    quantity: number;
    isRequired: boolean;
    note: string | null;
    createdAt: Date;
  }): AssetKitItem {
    return AssetKitItem.reconstitute({
      id: prismaItem.id,
      assetKitId: prismaItem.assetKitId,
      assetCategoryId: prismaItem.assetCategoryId!,
      assetModelId: prismaItem.assetModelId,
      quantity: prismaItem.quantity,
      isRequired: prismaItem.isRequired,
      note: prismaItem.note,
      createdAt: prismaItem.createdAt,
    });
  }
}
