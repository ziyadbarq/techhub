/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// TODO: Fix type errors - this is WIP code

/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// TODO: Fix type errors - this is WIP code

import { injectable, inject } from "inversify";
import type { PrismaClient } from "@/generated/prisma";
import { DI_TOKENS } from "@/di/types";
import type { IAssetKitRepository } from "@/core/repositories/asset-kit.repository.interface";
import {
  AssetKit,
  type KitType,
} from "@/core/domain/entities/asset-kit.entity";
import { createRepositoryLogger } from "./repository-logger";
import { toJsonValue, fromJsonValue } from "./prisma-helpers";

@injectable()
export class PrismaAssetKitRepository implements IAssetKitRepository {
  private readonly logger = createRepositoryLogger("AssetKit");

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
      kit_type: kit.kitType,
      is_active: kit.isActive,
      metadata: toJsonValue(kit.metadata),
      created_at: kit.createdAt,
      updated_at: kit.updatedAt,
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
      where: { kit_type: type },
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
      where: { is_active: true },
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
      where: { is_active: false },
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
      kit_type: kit.kitType,
      is_active: kit.isActive,
      metadata: toJsonValue(kit.metadata),
      updated_at: kit.updatedAt,
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
      where: { kit_type: type },
    });
  }

  async countActive(): Promise<number> {
    return this.prisma.assetKit.count({
      where: { is_active: true },
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
    kit_type: string;
    is_active: boolean;
    metadata: unknown;
    created_at: Date;
    updated_at: Date;
  }): AssetKit {
    return AssetKit.reconstitute({
      id: prismaKit.id,
      name: prismaKit.name,
      code: prismaKit.code,
      description: prismaKit.description,
      kitType: prismaKit.kit_type as KitType,
      isActive: prismaKit.is_active,
      metadata: fromJsonValue<Record<string, unknown>>(prismaKit.metadata),
      createdAt: prismaKit.created_at,
      updatedAt: prismaKit.updated_at,
    });
  }
}
