import { injectable, inject } from "inversify";
import type { PrismaClient } from "@/generated/prisma/server";
import { DI_TOKENS } from "@/di/types";
import type { IAssetKitCheckoutItemRepository } from "@/core/repositories/asset-kit-checkout-item.repository.interface";
import {
  AssetKitCheckoutItem,
  type KitCheckoutItemStatus,
} from "@/core/domain/entities/asset-kit-checkout-item.entity";

@injectable()
export class PrismaAssetKitCheckoutItemRepository
  implements IAssetKitCheckoutItemRepository
{
  constructor(
    @inject(DI_TOKENS.PrismaClient)
    private readonly prisma: PrismaClient,
  ) {}

  async create(item: AssetKitCheckoutItem): Promise<AssetKitCheckoutItem> {
    const data = {
      id: item.id,
      kitCheckoutId: item.kitCheckoutId,
      assetId: item.assetId,
      kitItemId: item.kitItemId,
      checkoutDate: item.checkoutDate,
      returnDate: item.returnDate,
      status: item.status,
      conditionAtCheckout: item.conditionAtCheckout,
      conditionAtReturn: item.conditionAtReturn,
      note: item.note,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };

    const created = await this.prisma.assetKitCheckoutItem.create({ data });
    return this.toDomain(created);
  }

  async findById(id: string): Promise<AssetKitCheckoutItem | null> {
    const item = await this.prisma.assetKitCheckoutItem.findUnique({
      where: { id },
    });

    return item ? this.toDomain(item) : null;
  }

  async findByCheckoutId(checkoutId: string): Promise<AssetKitCheckoutItem[]> {
    const items = await this.prisma.assetKitCheckoutItem.findMany({
      where: { kitCheckoutId: checkoutId },
      orderBy: { checkoutDate: "asc" },
    });

    return items.map((i) => this.toDomain(i));
  }

  async findByAssetId(
    assetId: string,
    options?: { skip?: number; take?: number },
  ): Promise<AssetKitCheckoutItem[]> {
    const items = await this.prisma.assetKitCheckoutItem.findMany({
      where: { assetId: assetId },
      skip: options?.skip,
      take: options?.take,
      orderBy: { checkoutDate: "desc" },
    });

    return items.map((i) => this.toDomain(i));
  }

  async findByStatus(
    status: KitCheckoutItemStatus,
    options?: { skip?: number; take?: number },
  ): Promise<AssetKitCheckoutItem[]> {
    const items = await this.prisma.assetKitCheckoutItem.findMany({
      where: { status },
      skip: options?.skip,
      take: options?.take,
      orderBy: { checkoutDate: "desc" },
    });

    return items.map((i) => this.toDomain(i));
  }

  async findCheckedOut(options?: {
    skip?: number;
    take?: number;
  }): Promise<AssetKitCheckoutItem[]> {
    const items = await this.prisma.assetKitCheckoutItem.findMany({
      where: { status: "CHECKED_OUT" },
      skip: options?.skip,
      take: options?.take,
      orderBy: { checkoutDate: "desc" },
    });

    return items.map((i) => this.toDomain(i));
  }

  async findWithIssues(options?: {
    skip?: number;
    take?: number;
  }): Promise<AssetKitCheckoutItem[]> {
    const items = await this.prisma.assetKitCheckoutItem.findMany({
      where: {
        status: {
          in: ["DAMAGED", "LOST"],
        },
      },
      skip: options?.skip,
      take: options?.take,
      orderBy: { returnDate: "desc" },
    });

    return items.map((i) => this.toDomain(i));
  }

  async findDamaged(options?: {
    skip?: number;
    take?: number;
  }): Promise<AssetKitCheckoutItem[]> {
    const items = await this.prisma.assetKitCheckoutItem.findMany({
      where: { status: "DAMAGED" },
      skip: options?.skip,
      take: options?.take,
      orderBy: { returnDate: "desc" },
    });

    return items.map((i) => this.toDomain(i));
  }

  async findLost(options?: {
    skip?: number;
    take?: number;
  }): Promise<AssetKitCheckoutItem[]> {
    const items = await this.prisma.assetKitCheckoutItem.findMany({
      where: { status: "LOST" },
      skip: options?.skip,
      take: options?.take,
      orderBy: { returnDate: "desc" },
    });

    return items.map((i) => this.toDomain(i));
  }

  async isAssetCheckedOut(assetId: string): Promise<boolean> {
    const count = await this.prisma.assetKitCheckoutItem.count({
      where: {
        assetId: assetId,
        status: "CHECKED_OUT",
      },
    });

    return count > 0;
  }

  async findActiveCheckoutForAsset(
    assetId: string,
  ): Promise<AssetKitCheckoutItem | null> {
    const item = await this.prisma.assetKitCheckoutItem.findFirst({
      where: {
        assetId: assetId,
        status: "CHECKED_OUT",
      },
      orderBy: { checkoutDate: "desc" },
    });

    return item ? this.toDomain(item) : null;
  }

  async countByStatusForCheckout(
    checkoutId: string,
    status: KitCheckoutItemStatus,
  ): Promise<number> {
    return this.prisma.assetKitCheckoutItem.count({
      where: {
        kitCheckoutId: checkoutId,
        status,
      },
    });
  }

  async countCheckedOutForCheckout(checkoutId: string): Promise<number> {
    return this.prisma.assetKitCheckoutItem.count({
      where: {
        kitCheckoutId: checkoutId,
        status: "CHECKED_OUT",
      },
    });
  }

  async countReturnedForCheckout(checkoutId: string): Promise<number> {
    return this.prisma.assetKitCheckoutItem.count({
      where: {
        kitCheckoutId: checkoutId,
        status: "RETURNED",
      },
    });
  }

  async countWithIssuesForCheckout(checkoutId: string): Promise<number> {
    return this.prisma.assetKitCheckoutItem.count({
      where: {
        kitCheckoutId: checkoutId,
        status: {
          in: ["DAMAGED", "LOST"],
        },
      },
    });
  }

  async update(item: AssetKitCheckoutItem): Promise<AssetKitCheckoutItem> {
    const data = {
      returnDate: item.returnDate,
      status: item.status,
      conditionAtReturn: item.conditionAtReturn,
      note: item.note,
      updatedAt: item.updatedAt,
    };

    const updated = await this.prisma.assetKitCheckoutItem.update({
      where: { id: item.id },
      data,
    });

    return this.toDomain(updated);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.assetKitCheckoutItem.delete({
      where: { id },
    });
  }

  async deleteByCheckoutId(checkoutId: string): Promise<void> {
    await this.prisma.assetKitCheckoutItem.deleteMany({
      where: { kitCheckoutId: checkoutId },
    });
  }

  async countByCheckoutId(checkoutId: string): Promise<number> {
    return this.prisma.assetKitCheckoutItem.count({
      where: { kitCheckoutId: checkoutId },
    });
  }

  private toDomain(prismaItem: {
    id: string;
    kitCheckoutId: string;
    assetId: string;
    kitItemId: string;
    checkoutDate: Date;
    returnDate: Date | null;
    status: string;
    conditionAtCheckout: string | null;
    conditionAtReturn: string | null;
    note: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): AssetKitCheckoutItem {
    return AssetKitCheckoutItem.reconstitute({
      id: prismaItem.id,
      kitCheckoutId: prismaItem.kitCheckoutId,
      assetId: prismaItem.assetId,
      kitItemId: prismaItem.kitItemId,
      checkoutDate: prismaItem.checkoutDate,
      returnDate: prismaItem.returnDate,
      status: prismaItem.status as KitCheckoutItemStatus,
      conditionAtCheckout: prismaItem.conditionAtCheckout,
      conditionAtReturn: prismaItem.conditionAtReturn,
      note: prismaItem.note,
      createdAt: prismaItem.createdAt,
      updatedAt: prismaItem.updatedAt,
    });
  }
}
