/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// TODO: Fix type errors - this is WIP code

/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// TODO: Fix type errors - this is WIP code

import { injectable, inject } from "inversify";
import type { PrismaClient } from "@/generated/prisma";
import { DI_TOKENS } from "@/di/types";
import type { IAssetKitCheckoutItemRepository } from "@/core/repositories/asset-kit-checkout-item.repository.interface";
import {
  AssetKitCheckoutItem,
  type KitCheckoutItemStatus,
} from "@/core/domain/entities/asset-kit-checkout-item.entity";
import { createRepositoryLogger } from "./repository-logger";

@injectable()
export class PrismaAssetKitCheckoutItemRepository
  implements IAssetKitCheckoutItemRepository
{
  private readonly logger = createRepositoryLogger("AssetKitCheckoutItem");

  constructor(
    @inject(DI_TOKENS.PrismaClient)
    private readonly prisma: PrismaClient,
  ) {}

  async create(item: AssetKitCheckoutItem): Promise<AssetKitCheckoutItem> {
    const data = {
      id: item.id,
      kit_checkout_id: item.kitCheckoutId,
      asset_id: item.assetId,
      kit_item_id: item.kitItemId,
      checkout_date: item.checkoutDate,
      return_date: item.returnDate,
      status: item.status,
      condition_at_checkout: item.conditionAtCheckout,
      condition_at_return: item.conditionAtReturn,
      note: item.note,
      created_at: item.createdAt,
      updated_at: item.updatedAt,
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
      where: { kit_checkout_id: checkoutId },
      orderBy: { checkout_date: "asc" },
    });

    return items.map((i) => this.toDomain(i));
  }

  async findByAssetId(
    assetId: string,
    options?: { skip?: number; take?: number },
  ): Promise<AssetKitCheckoutItem[]> {
    const items = await this.prisma.assetKitCheckoutItem.findMany({
      where: { asset_id: assetId },
      skip: options?.skip,
      take: options?.take,
      orderBy: { checkout_date: "desc" },
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
      orderBy: { checkout_date: "desc" },
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
      orderBy: { checkout_date: "desc" },
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
      orderBy: { return_date: "desc" },
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
      orderBy: { return_date: "desc" },
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
      orderBy: { return_date: "desc" },
    });

    return items.map((i) => this.toDomain(i));
  }

  async isAssetCheckedOut(assetId: string): Promise<boolean> {
    const count = await this.prisma.assetKitCheckoutItem.count({
      where: {
        asset_id: assetId,
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
        asset_id: assetId,
        status: "CHECKED_OUT",
      },
      orderBy: { checkout_date: "desc" },
    });

    return item ? this.toDomain(item) : null;
  }

  async countByStatusForCheckout(
    checkoutId: string,
    status: KitCheckoutItemStatus,
  ): Promise<number> {
    return this.prisma.assetKitCheckoutItem.count({
      where: {
        kit_checkout_id: checkoutId,
        status,
      },
    });
  }

  async countCheckedOutForCheckout(checkoutId: string): Promise<number> {
    return this.prisma.assetKitCheckoutItem.count({
      where: {
        kit_checkout_id: checkoutId,
        status: "CHECKED_OUT",
      },
    });
  }

  async countReturnedForCheckout(checkoutId: string): Promise<number> {
    return this.prisma.assetKitCheckoutItem.count({
      where: {
        kit_checkout_id: checkoutId,
        status: "RETURNED",
      },
    });
  }

  async countWithIssuesForCheckout(checkoutId: string): Promise<number> {
    return this.prisma.assetKitCheckoutItem.count({
      where: {
        kit_checkout_id: checkoutId,
        status: {
          in: ["DAMAGED", "LOST"],
        },
      },
    });
  }

  async update(item: AssetKitCheckoutItem): Promise<AssetKitCheckoutItem> {
    const data = {
      return_date: item.returnDate,
      status: item.status,
      condition_at_return: item.conditionAtReturn,
      note: item.note,
      updated_at: item.updatedAt,
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
      where: { kit_checkout_id: checkoutId },
    });
  }

  async countByCheckoutId(checkoutId: string): Promise<number> {
    return this.prisma.assetKitCheckoutItem.count({
      where: { kit_checkout_id: checkoutId },
    });
  }

  private toDomain(prismaItem: {
    id: string;
    kit_checkout_id: string;
    asset_id: string;
    kit_item_id: string;
    checkout_date: Date;
    return_date: Date | null;
    status: string;
    condition_at_checkout: string | null;
    condition_at_return: string | null;
    note: string | null;
    created_at: Date;
    updated_at: Date;
  }): AssetKitCheckoutItem {
    return AssetKitCheckoutItem.reconstitute({
      id: prismaItem.id,
      kitCheckoutId: prismaItem.kit_checkout_id,
      assetId: prismaItem.asset_id,
      kitItemId: prismaItem.kit_item_id,
      checkoutDate: prismaItem.checkout_date,
      returnDate: prismaItem.return_date,
      status: prismaItem.status as KitCheckoutItemStatus,
      conditionAtCheckout: prismaItem.condition_at_checkout,
      conditionAtReturn: prismaItem.condition_at_return,
      note: prismaItem.note,
      createdAt: prismaItem.created_at,
      updatedAt: prismaItem.updated_at,
    });
  }
}
