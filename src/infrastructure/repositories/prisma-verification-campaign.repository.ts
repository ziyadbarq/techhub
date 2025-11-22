/**
 * Prisma VerificationCampaign Repository Implementation
 *
 * Implements IVerificationCampaignRepository using Prisma ORM.
 */

import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { PrismaClient } from "@/generated/prisma";
import type { IVerificationCampaignRepository } from "@/core/repositories/verification-campaign.repository.interface";
import {
  VerificationCampaign,
  TargetObjectTypeEnum,
} from "@/core/domain/entities/verification-campaign.entity";
import type { ILoggerService } from "@/core/services";

@injectable()
export class PrismaVerificationCampaignRepository
  implements IVerificationCampaignRepository
{
  constructor(
    @inject(DI_TOKENS.PrismaClient) private prisma: PrismaClient,
    @inject(DI_TOKENS.ILoggerService) private logger: ILoggerService,
  ) {}

  async create(
    campaign: VerificationCampaign,
  ): Promise<VerificationCampaign> {
    this.logger.debug("Creating verification campaign", { id: campaign.id });

    const data = await this.prisma.verificationCampaign.create({
      data: {
        id: campaign.id,
        name: campaign.name,
        description: campaign.description,
        targetType: campaign.targetType,
        filterDefinition: campaign.filterDefinition as object | null,
        scheduledStart: campaign.scheduledStart,
        scheduledEnd: campaign.scheduledEnd,
        createdById: campaign.createdById,
        createdAt: campaign.createdAt,
        updatedAt: campaign.updatedAt,
      },
    });

    return this.toDomain(data);
  }

  async findById(id: string): Promise<VerificationCampaign | null> {
    this.logger.debug("Finding verification campaign by id", { id });

    const data = await this.prisma.verificationCampaign.findUnique({
      where: { id },
    });

    return data ? this.toDomain(data) : null;
  }

  async findAll(): Promise<VerificationCampaign[]> {
    this.logger.debug("Finding all verification campaigns");

    const data = await this.prisma.verificationCampaign.findMany({
      orderBy: { scheduledStart: "desc" },
    });

    return data.map((item) => this.toDomain(item));
  }

  async findActive(asOfDate?: Date): Promise<VerificationCampaign[]> {
    const checkDate = asOfDate ?? new Date();

    this.logger.debug("Finding active verification campaigns", {
      asOfDate: checkDate,
    });

    const data = await this.prisma.verificationCampaign.findMany({
      where: {
        scheduledStart: { lte: checkDate },
        OR: [{ scheduledEnd: null }, { scheduledEnd: { gte: checkDate } }],
      },
      orderBy: { scheduledStart: "desc" },
    });

    return data.map((item) => this.toDomain(item));
  }

  async findByCreator(createdById: string): Promise<VerificationCampaign[]> {
    this.logger.debug("Finding verification campaigns by creator", {
      createdById,
    });

    const data = await this.prisma.verificationCampaign.findMany({
      where: { createdById },
      orderBy: { scheduledStart: "desc" },
    });

    return data.map((item) => this.toDomain(item));
  }

  async update(
    campaign: VerificationCampaign,
  ): Promise<VerificationCampaign> {
    this.logger.debug("Updating verification campaign", { id: campaign.id });

    const data = await this.prisma.verificationCampaign.update({
      where: { id: campaign.id },
      data: {
        name: campaign.name,
        description: campaign.description,
        filterDefinition: campaign.filterDefinition as object | null,
        scheduledStart: campaign.scheduledStart,
        scheduledEnd: campaign.scheduledEnd,
        updatedAt: new Date(),
      },
    });

    return this.toDomain(data);
  }

  async delete(id: string): Promise<void> {
    this.logger.debug("Deleting verification campaign", { id });

    await this.prisma.verificationCampaign.delete({
      where: { id },
    });
  }

  /**
   * Maps Prisma model to domain entity
   */
  private toDomain(data: {
    id: string;
    name: string;
    description: string | null;
    targetType: string;
    filterDefinition: object | null;
    scheduledStart: Date;
    scheduledEnd: Date | null;
    createdById: string;
    createdAt: Date;
    updatedAt: Date;
  }): VerificationCampaign {
    return VerificationCampaign.restore({
      id: data.id,
      name: data.name,
      description: data.description,
      targetType: data.targetType as TargetObjectTypeEnum,
      filterDefinition: data.filterDefinition as Record<string, unknown> | null,
      scheduledStart: data.scheduledStart,
      scheduledEnd: data.scheduledEnd,
      createdById: data.createdById,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    });
  }
}
