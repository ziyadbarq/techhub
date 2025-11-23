/**
 * Prisma VerificationItem Repository Implementation
 *
 * Implements IVerificationItemRepository using Prisma ORM.
 */

import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type {
  PrismaClient,
  TargetObjectTypeEnum,
  VerificationStatusEnum,
} from "@/generated/prisma";
import type { IVerificationItemRepository } from "@/core/repositories/verification-item.repository.interface";
import { VerificationItem } from "@/core/domain/entities/verification-item.entity";
import type { VerificationStatusEnum as VerificationStatusEnumEntity } from "@/core/domain/entities/verification-item.entity";
import type { ILoggerService } from "@/core/services";

@injectable()
export class PrismaVerificationItemRepository
  implements IVerificationItemRepository
{
  constructor(
    @inject(DI_TOKENS.PrismaClient) private prisma: PrismaClient,
    @inject(DI_TOKENS.ILoggerService) private logger: ILoggerService,
  ) {}

  async create(verificationItem: VerificationItem): Promise<VerificationItem> {
    this.logger.debug("Creating verification item", {
      id: verificationItem.id,
    });

    const data = await this.prisma.verificationItem.create({
      data: {
        id: verificationItem.id,
        verificationCampaignId: verificationItem.verificationCampaignId,
        targetType: verificationItem.targetType,
        targetId: verificationItem.targetId,
        verifierPersonId: verificationItem.verifierPersonId,
        status: verificationItem.status as VerificationStatusEnum,
        verifiedAt: verificationItem.verifiedAt,
        comment: verificationItem.comment,
        createdAt: verificationItem.createdAt,
        updatedAt: verificationItem.updatedAt,
      },
    });

    return this.toDomain(data);
  }

  async findById(id: string): Promise<VerificationItem | null> {
    this.logger.debug("Finding verification item by id", { id });

    const data = await this.prisma.verificationItem.findUnique({
      where: { id },
    });

    return data ? this.toDomain(data) : null;
  }

  async findAll(): Promise<VerificationItem[]> {
    this.logger.debug("Finding all verification items");

    const data = await this.prisma.verificationItem.findMany({
      orderBy: { createdAt: "desc" },
    });

    return data.map((item) => this.toDomain(item));
  }

  async findByCampaign(campaignId: string): Promise<VerificationItem[]> {
    this.logger.debug("Finding verification items by campaign", {
      campaignId,
    });

    const data = await this.prisma.verificationItem.findMany({
      where: { verificationCampaignId: campaignId },
      orderBy: { createdAt: "asc" },
    });

    return data.map((item) => this.toDomain(item));
  }

  async findByStatus(
    status: VerificationStatusEnumEntity,
  ): Promise<VerificationItem[]> {
    this.logger.debug("Finding verification items by status", { status });

    const data = await this.prisma.verificationItem.findMany({
      where: { status: status as VerificationStatusEnum },
      orderBy: { createdAt: "desc" },
    });

    return data.map((item) => this.toDomain(item));
  }

  async countByStatus(
    campaignId: string,
    status: VerificationStatusEnumEntity,
  ): Promise<number> {
    this.logger.debug("Counting verification items by status", {
      campaignId,
      status,
    });

    return await this.prisma.verificationItem.count({
      where: {
        verificationCampaignId: campaignId,
        status: status as VerificationStatusEnum,
      },
    });
  }

  async update(verificationItem: VerificationItem): Promise<VerificationItem> {
    this.logger.debug("Updating verification item", {
      id: verificationItem.id,
    });

    const data = await this.prisma.verificationItem.update({
      where: { id: verificationItem.id },
      data: {
        verifierPersonId: verificationItem.verifierPersonId,
        status: verificationItem.status as VerificationStatusEnum,
        verifiedAt: verificationItem.verifiedAt,
        comment: verificationItem.comment,
        updatedAt: new Date(),
      },
    });

    return this.toDomain(data);
  }

  async delete(id: string): Promise<void> {
    this.logger.debug("Deleting verification item", { id });

    await this.prisma.verificationItem.delete({
      where: { id },
    });
  }

  /**
   * Maps Prisma model to domain entity
   */
  private toDomain(data: {
    id: string;
    verificationCampaignId: string;
    targetType: string;
    targetId: string;
    verifierPersonId: string | null;
    status: VerificationStatusEnum;
    verifiedAt: Date | null;
    comment: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): VerificationItem {
    return VerificationItem.restore({
      id: data.id,
      verificationCampaignId: data.verificationCampaignId,
      targetType: data.targetType as TargetObjectTypeEnum,
      targetId: data.targetId,
      verifierPersonId: data.verifierPersonId,
      status: data.status as VerificationStatusEnumEntity,
      verifiedAt: data.verifiedAt,
      comment: data.comment,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    });
  }
}
