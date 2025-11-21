/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// TODO: Fix type errors - this is WIP code

/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// TODO: Fix type errors - this is WIP code

import { injectable, inject } from "inversify";
import type { PrismaClient } from "@/generated/prisma";
import { DI_TOKENS } from "@/di/types";
import type { IAssetKitCheckoutRepository } from "@/core/repositories/asset-kit-checkout.repository.interface";
import {
  AssetKitCheckout,
  type KitCheckoutStatus,
  type AssigneeType,
} from "@/core/domain/entities/asset-kit-checkout.entity";
import { createRepositoryLogger } from "./repository-logger";

@injectable()
export class PrismaAssetKitCheckoutRepository
  implements IAssetKitCheckoutRepository
{
  private readonly logger = createRepositoryLogger("AssetKitCheckout");

  constructor(
    @inject(DI_TOKENS.PrismaClient)
    private readonly prisma: PrismaClient,
  ) {}

  async create(checkout: AssetKitCheckout): Promise<AssetKitCheckout> {
    const data = {
      id: checkout.id,
      asset_kit_id: checkout.assetKitId,
      assignee_type: checkout.assigneeType,
      assignee_id: checkout.assigneeId,
      checkout_date: checkout.checkoutDate,
      expected_return_date: checkout.expectedReturnDate,
      actual_return_date: checkout.actualReturnDate,
      status: checkout.status,
      checked_out_by_id: checkout.checkedOutById,
      note: checkout.note,
      created_at: checkout.createdAt,
      updated_at: checkout.updatedAt,
    };

    const created = await this.prisma.assetKitCheckout.create({ data });
    return this.toDomain(created);
  }

  async findById(id: string): Promise<AssetKitCheckout | null> {
    const checkout = await this.prisma.assetKitCheckout.findUnique({
      where: { id },
    });

    return checkout ? this.toDomain(checkout) : null;
  }

  async findAll(options?: {
    skip?: number;
    take?: number;
    orderBy?: "checkoutDate" | "expectedReturnDate" | "createdAt";
    order?: "asc" | "desc";
  }): Promise<AssetKitCheckout[]> {
    const orderByMap = {
      checkoutDate: "checkout_date",
      expectedReturnDate: "expected_return_date",
      createdAt: "created_at",
    };

    const checkouts = await this.prisma.assetKitCheckout.findMany({
      skip: options?.skip,
      take: options?.take,
      orderBy: options?.orderBy
        ? { [orderByMap[options.orderBy]]: options.order ?? "desc" }
        : undefined,
    });

    return checkouts.map((c) => this.toDomain(c));
  }

  async findByKitId(
    kitId: string,
    options?: { skip?: number; take?: number },
  ): Promise<AssetKitCheckout[]> {
    const checkouts = await this.prisma.assetKitCheckout.findMany({
      where: { asset_kit_id: kitId },
      skip: options?.skip,
      take: options?.take,
      orderBy: { checkout_date: "desc" },
    });

    return checkouts.map((c) => this.toDomain(c));
  }

  async findByAssignee(
    assigneeType: AssigneeType,
    assigneeId: string,
    options?: { skip?: number; take?: number },
  ): Promise<AssetKitCheckout[]> {
    const checkouts = await this.prisma.assetKitCheckout.findMany({
      where: {
        assignee_type: assigneeType,
        assignee_id: assigneeId,
      },
      skip: options?.skip,
      take: options?.take,
      orderBy: { checkout_date: "desc" },
    });

    return checkouts.map((c) => this.toDomain(c));
  }

  async findByStatus(
    status: KitCheckoutStatus,
    options?: { skip?: number; take?: number },
  ): Promise<AssetKitCheckout[]> {
    const checkouts = await this.prisma.assetKitCheckout.findMany({
      where: { status },
      skip: options?.skip,
      take: options?.take,
      orderBy: { checkout_date: "desc" },
    });

    return checkouts.map((c) => this.toDomain(c));
  }

  async findActive(options?: {
    skip?: number;
    take?: number;
  }): Promise<AssetKitCheckout[]> {
    const checkouts = await this.prisma.assetKitCheckout.findMany({
      where: {
        status: {
          in: ["CHECKED_OUT", "PARTIALLY_RETURNED"],
        },
      },
      skip: options?.skip,
      take: options?.take,
      orderBy: { checkout_date: "desc" },
    });

    return checkouts.map((c) => this.toDomain(c));
  }

  async findOverdue(options?: {
    skip?: number;
    take?: number;
  }): Promise<AssetKitCheckout[]> {
    const now = new Date();

    const checkouts = await this.prisma.assetKitCheckout.findMany({
      where: {
        status: {
          in: ["CHECKED_OUT", "PARTIALLY_RETURNED"],
        },
        expected_return_date: {
          not: null,
          lt: now,
        },
      },
      skip: options?.skip,
      take: options?.take,
      orderBy: { expected_return_date: "asc" },
    });

    return checkouts.map((c) => this.toDomain(c));
  }

  async findByCheckedOutBy(
    checkedOutById: string,
    options?: { skip?: number; take?: number },
  ): Promise<AssetKitCheckout[]> {
    const checkouts = await this.prisma.assetKitCheckout.findMany({
      where: { checked_out_by_id: checkedOutById },
      skip: options?.skip,
      take: options?.take,
      orderBy: { checkout_date: "desc" },
    });

    return checkouts.map((c) => this.toDomain(c));
  }

  async findDueInDateRange(
    startDate: Date,
    endDate: Date,
    options?: { skip?: number; take?: number },
  ): Promise<AssetKitCheckout[]> {
    const checkouts = await this.prisma.assetKitCheckout.findMany({
      where: {
        expected_return_date: {
          not: null,
          gte: startDate,
          lte: endDate,
        },
      },
      skip: options?.skip,
      take: options?.take,
      orderBy: { expected_return_date: "asc" },
    });

    return checkouts.map((c) => this.toDomain(c));
  }

  async findCheckedOutInDateRange(
    startDate: Date,
    endDate: Date,
    options?: { skip?: number; take?: number },
  ): Promise<AssetKitCheckout[]> {
    const checkouts = await this.prisma.assetKitCheckout.findMany({
      where: {
        checkout_date: {
          gte: startDate,
          lte: endDate,
        },
      },
      skip: options?.skip,
      take: options?.take,
      orderBy: { checkout_date: "desc" },
    });

    return checkouts.map((c) => this.toDomain(c));
  }

  async hasActiveCheckout(
    kitId: string,
    assigneeType: AssigneeType,
    assigneeId: string,
  ): Promise<boolean> {
    const count = await this.prisma.assetKitCheckout.count({
      where: {
        asset_kit_id: kitId,
        assignee_type: assigneeType,
        assignee_id: assigneeId,
        status: {
          in: ["CHECKED_OUT", "PARTIALLY_RETURNED"],
        },
      },
    });

    return count > 0;
  }

  async update(checkout: AssetKitCheckout): Promise<AssetKitCheckout> {
    const data = {
      expected_return_date: checkout.expectedReturnDate,
      actual_return_date: checkout.actualReturnDate,
      status: checkout.status,
      note: checkout.note,
      updated_at: checkout.updatedAt,
    };

    const updated = await this.prisma.assetKitCheckout.update({
      where: { id: checkout.id },
      data,
    });

    return this.toDomain(updated);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.assetKitCheckout.delete({
      where: { id },
    });
  }

  async countByStatus(status: KitCheckoutStatus): Promise<number> {
    return this.prisma.assetKitCheckout.count({
      where: { status },
    });
  }

  async countOverdue(): Promise<number> {
    const now = new Date();

    return this.prisma.assetKitCheckout.count({
      where: {
        status: {
          in: ["CHECKED_OUT", "PARTIALLY_RETURNED"],
        },
        expected_return_date: {
          not: null,
          lt: now,
        },
      },
    });
  }

  async countActive(): Promise<number> {
    return this.prisma.assetKitCheckout.count({
      where: {
        status: {
          in: ["CHECKED_OUT", "PARTIALLY_RETURNED"],
        },
      },
    });
  }

  async count(): Promise<number> {
    return this.prisma.assetKitCheckout.count();
  }

  private toDomain(prismaCheckout: {
    id: string;
    asset_kit_id: string;
    assignee_type: string;
    assignee_id: string;
    checkout_date: Date;
    expected_return_date: Date | null;
    actual_return_date: Date | null;
    status: string;
    checked_out_by_id: string;
    note: string | null;
    created_at: Date;
    updated_at: Date;
  }): AssetKitCheckout {
    return AssetKitCheckout.reconstitute({
      id: prismaCheckout.id,
      assetKitId: prismaCheckout.asset_kit_id,
      assigneeType: prismaCheckout.assignee_type as AssigneeType,
      assigneeId: prismaCheckout.assignee_id,
      checkoutDate: prismaCheckout.checkout_date,
      expectedReturnDate: prismaCheckout.expected_return_date,
      actualReturnDate: prismaCheckout.actual_return_date,
      status: prismaCheckout.status as KitCheckoutStatus,
      checkedOutById: prismaCheckout.checked_out_by_id,
      note: prismaCheckout.note,
      createdAt: prismaCheckout.created_at,
      updatedAt: prismaCheckout.updated_at,
    });
  }
}
