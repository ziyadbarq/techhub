import { injectable, inject } from "inversify";
import type { PrismaClient } from "@/generated/prisma";
import { DI_TOKENS } from "@/di/types";
import type { IAssetKitRepository } from "@/core/repositories/asset-kit.repository.interface";
import {
  AssetKit,
  type KitType,
} from "@/core/domain/entities/asset-kit.entity";
import { toJsonValue, fromJsonValue } from "./prisma-helpers";

@injectable()
export class PrismaAssetKitRepository implements IAssetKitRepository {
  constructor(
    @inject(DI_TOKENS.PrismaClient)
    private readonly prisma: PrismaClient,
  ) {}

  async create(kit: AssetKit): Promise<AssetKit> {
    const data = {
      id: kit.id,
      name: kit.name,
      code: kit.code,
      description: kit.description,
      kitType: kit.kitType,
      isActive: kit.isActive,
      metadata: toJsonValue(kit.metadata),
      createdAt: kit.createdAt,
      updatedAt: kit.updatedAt,
    };

    const created = await this.prisma.assetKit.create({ data });
    return this.toDomain(created);
  }

  async findById(id: string): Promise<AssetKit | null> {
    const kit = await this.prisma.assetKit.findUnique({
      where: { id },
    });

    return kit ? this.toDomain(kit) : null;
  }

  async findByCode(code: string): Promise<AssetKit | null> {
    const kit = await this.prisma.assetKit.findUnique({
      where: { code: code.toUpperCase() },
    });

    return kit ? this.toDomain(kit) : null;
  }

  async codeExists(code: string, excludeId?: string): Promise<boolean> {
    const where: { code: string; id?: { not: string } } = {
      code: code.toUpperCase(),
    };

    if (excludeId) {
      where.id = { not: excludeId };
    }

    const count = await this.prisma.assetKit.count({ where });
    return count > 0;
  }

  async findAll(options?: {
    skip?: number;
    take?: number;
    orderBy?: "name" | "code" | "createdAt";
    order?: "asc" | "desc";
  }): Promise<AssetKit[]> {
    const kits = await this.prisma.assetKit.findMany({
      skip: options?.skip,
      take: options?.take,
      orderBy: options?.orderBy
        ? { [options.orderBy]: options.order ?? "asc" }
        : undefined,
    });

    return kits.map((k) => this.toDomain(k));
  }

  async findByType(
    type: KitType,
    options?: { skip?: number; take?: number },
  ): Promise<AssetKit[]> {
    const kits = await this.prisma.assetKit.findMany({
      where: { kitType: type },
      skip: options?.skip,
      take: options?.take,
      orderBy: { name: "asc" },
    });

    return kits.map((k) => this.toDomain(k));
  }

  async findActive(options?: {
    skip?: number;
    take?: number;
  }): Promise<AssetKit[]> {
    const kits = await this.prisma.assetKit.findMany({
      where: { isActive: true },
      skip: options?.skip,
      take: options?.take,
      orderBy: { name: "asc" },
    });

    return kits.map((k) => this.toDomain(k));
  }

  async findInactive(options?: {
    skip?: number;
    take?: number;
  }): Promise<AssetKit[]> {
    const kits = await this.prisma.assetKit.findMany({
      where: { isActive: false },
      skip: options?.skip,
      take: options?.take,
      orderBy: { name: "asc" },
    });

    return kits.map((k) => this.toDomain(k));
  }

  async search(
    query: string,
    options?: {
      skip?: number;
      take?: number;
    },
  ): Promise<AssetKit[]> {
    const kits = await this.prisma.assetKit.findMany({
      where: {
        OR: [
          {
            name: {
              contains: query,
              mode: "insensitive",
            },
          },
          {
            code: {
              contains: query,
              mode: "insensitive",
            },
          },
        ],
      },
      skip: options?.skip,
      take: options?.take,
      orderBy: { name: "asc" },
    });

    return kits.map((k) => this.toDomain(k));
  }

  async update(kit: AssetKit): Promise<AssetKit> {
    const data = {
      name: kit.name,
      description: kit.description,
      kitType: kit.kitType,
      isActive: kit.isActive,
      metadata: toJsonValue(kit.metadata),
      updatedAt: kit.updatedAt,
    };

    const updated = await this.prisma.assetKit.update({
      where: { id: kit.id },
      data,
    });

    return this.toDomain(updated);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.assetKit.delete({
      where: { id },
    });
  }

  async countByType(type: KitType): Promise<number> {
    return this.prisma.assetKit.count({
      where: { kitType: type },
    });
  }

  async countActive(): Promise<number> {
    return this.prisma.assetKit.count({
      where: { isActive: true },
    });
  }

  async count(): Promise<number> {
    return this.prisma.assetKit.count();
  }

  private toDomain(prismaKit: {
    id: string;
    name: string;
    code: string;
    description: string | null;
    kitType: string;
    isActive: boolean;
    metadata: unknown;
    createdAt: Date;
    updatedAt: Date;
  }): AssetKit {
    return AssetKit.reconstitute({
      id: prismaKit.id,
      name: prismaKit.name,
      code: prismaKit.code,
      description: prismaKit.description,
      kitType: prismaKit.kitType as KitType,
      isActive: prismaKit.isActive,
      metadata: fromJsonValue<Record<string, unknown>>(
        prismaKit.metadata as Parameters<typeof fromJsonValue>[0],
      ),
      createdAt: prismaKit.createdAt,
      updatedAt: prismaKit.updatedAt,
    });
  }
}
