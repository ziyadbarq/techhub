import { injectable, inject } from "inversify";
import type { PrismaClient } from "@/generated/prisma";
import { DI_TOKENS } from "@/di/types";
import type { IAssetKitCheckoutRepository } from "@/core/repositories/asset-kit-checkout.repository.interface";
import {
  AssetKitCheckout,
  type KitCheckoutStatus,
  type AssigneeType,
} from "@/core/domain/entities/asset-kit-checkout.entity";

@injectable()
export class PrismaAssetKitCheckoutRepository
  implements IAssetKitCheckoutRepository
{
  constructor(
    @inject(DI_TOKENS.PrismaClient)
    private readonly prisma: PrismaClient,
  ) {}

  async create(checkout: AssetKitCheckout): Promise<AssetKitCheckout> {
    const data = {
      id: checkout.id,
      assetKitId: checkout.assetKitId,
      assigneeType: checkout.assigneeType,
      assigneeId: checkout.assigneeId,
      checkoutDate: checkout.checkoutDate,
      expectedReturnDate: checkout.expectedReturnDate,
      actualReturnDate: checkout.actualReturnDate,
      status: checkout.status,
      checkedOutById: checkout.checkedOutById,
      note: checkout.note,
      createdAt: checkout.createdAt,
      updatedAt: checkout.updatedAt,
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
      checkoutDate: "checkoutDate",
      expectedReturnDate: "expectedReturnDate",
      createdAt: "createdAt",
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
      where: { assetKitId: kitId },
      skip: options?.skip,
      take: options?.take,
      orderBy: { checkoutDate: "desc" },
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
        assigneeType: assigneeType,
        assigneeId: assigneeId,
      },
      skip: options?.skip,
      take: options?.take,
      orderBy: { checkoutDate: "desc" },
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
      orderBy: { checkoutDate: "desc" },
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
      orderBy: { checkoutDate: "desc" },
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
        expectedReturnDate: {
          not: null,
          lt: now,
        },
      },
      skip: options?.skip,
      take: options?.take,
      orderBy: { expectedReturnDate: "asc" },
    });

    return checkouts.map((c) => this.toDomain(c));
  }

  async findByCheckedOutBy(
    checkedOutById: string,
    options?: { skip?: number; take?: number },
  ): Promise<AssetKitCheckout[]> {
    const checkouts = await this.prisma.assetKitCheckout.findMany({
      where: { checkedOutById: checkedOutById },
      skip: options?.skip,
      take: options?.take,
      orderBy: { checkoutDate: "desc" },
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
        expectedReturnDate: {
          not: null,
          gte: startDate,
          lte: endDate,
        },
      },
      skip: options?.skip,
      take: options?.take,
      orderBy: { expectedReturnDate: "asc" },
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
        checkoutDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      skip: options?.skip,
      take: options?.take,
      orderBy: { checkoutDate: "desc" },
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
        assetKitId: kitId,
        assigneeType: assigneeType,
        assigneeId: assigneeId,
        status: {
          in: ["CHECKED_OUT", "PARTIALLY_RETURNED"],
        },
      },
    });

    return count > 0;
  }

  async update(checkout: AssetKitCheckout): Promise<AssetKitCheckout> {
    const data = {
      expectedReturnDate: checkout.expectedReturnDate,
      actualReturnDate: checkout.actualReturnDate,
      status: checkout.status,
      note: checkout.note,
      updatedAt: checkout.updatedAt,
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
        expectedReturnDate: {
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
    assetKitId: string;
    assigneeType: string;
    assigneeId: string;
    checkoutDate: Date;
    expectedReturnDate: Date | null;
    actualReturnDate: Date | null;
    status: string;
    checkedOutById: string;
    note: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): AssetKitCheckout {
    return AssetKitCheckout.reconstitute({
      id: prismaCheckout.id,
      assetKitId: prismaCheckout.assetKitId,
      assigneeType: prismaCheckout.assigneeType as AssigneeType,
      assigneeId: prismaCheckout.assigneeId,
      checkoutDate: prismaCheckout.checkoutDate,
      expectedReturnDate: prismaCheckout.expectedReturnDate,
      actualReturnDate: prismaCheckout.actualReturnDate,
      status: prismaCheckout.status as KitCheckoutStatus,
      checkedOutById: prismaCheckout.checkedOutById,
      note: prismaCheckout.note,
      createdAt: prismaCheckout.createdAt,
      updatedAt: prismaCheckout.updatedAt,
    });
  }
}
