/**
 * Prisma LicenseEntitlementAddon Repository Implementation
 *
 * Implements ILicenseEntitlementAddonRepository using Prisma ORM.
 */

import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type {
  PrismaClient,
  LicenseEntitlementAddon as PrismaLicenseEntitlementAddon,
} from "@/generated/prisma/server";
import type {
  ILicenseEntitlementAddonRepository,
  CostAggregation,
} from "@/core/repositories/license-entitlement-addon.repository.interface";
import { LicenseEntitlementAddon } from "@/core/domain/entities/license-entitlement-addon.entity";
import type { ILoggerService } from "@/core/services";

@injectable()
export class PrismaLicenseEntitlementAddonRepository
  implements ILicenseEntitlementAddonRepository
{
  constructor(
    @inject(DI_TOKENS.PrismaClient) private prisma: PrismaClient,
    @inject(DI_TOKENS.ILoggerService) private logger: ILoggerService,
  ) {}

  async create(
    entitlementAddon: LicenseEntitlementAddon,
  ): Promise<LicenseEntitlementAddon> {
    this.logger.debug("Creating license entitlement addon", {
      entitlementId: entitlementAddon.licenseEntitlementId,
      addonId: entitlementAddon.licenseAddonId,
    });

    const data = await this.prisma.licenseEntitlementAddon.create({
      data: {
        licenseEntitlementId: entitlementAddon.licenseEntitlementId,
        licenseAddonId: entitlementAddon.licenseAddonId,
        cost: entitlementAddon.cost,
        currency: entitlementAddon.currency,
        note: entitlementAddon.note,
        createdAt: entitlementAddon.createdAt,
        updatedAt: entitlementAddon.updatedAt,
      },
    });

    return this.toDomain(data);
  }

  async findById(id: string): Promise<LicenseEntitlementAddon | null> {
    this.logger.debug("Finding license entitlement addon by id", { id });

    const data = await this.prisma.licenseEntitlementAddon.findUnique({
      where: { id },
    });

    return data ? this.toDomain(data) : null;
  }

  async findByEntitlementAndAddon(
    licenseEntitlementId: string,
    licenseAddonId: string,
  ): Promise<LicenseEntitlementAddon | null> {
    this.logger.debug(
      "Finding license entitlement addon by entitlement and addon",
      {
        licenseEntitlementId,
        licenseAddonId,
      },
    );

    const data = await this.prisma.licenseEntitlementAddon.findUnique({
      where: {
        licenseEntitlementId_licenseAddonId: {
          licenseEntitlementId,
          licenseAddonId,
        },
      },
    });

    return data ? this.toDomain(data) : null;
  }

  async findByEntitlementId(
    licenseEntitlementId: string,
  ): Promise<LicenseEntitlementAddon[]> {
    this.logger.debug("Finding license entitlement addons by entitlement", {
      licenseEntitlementId,
    });

    const data = await this.prisma.licenseEntitlementAddon.findMany({
      where: { licenseEntitlementId },
      orderBy: { createdAt: "asc" },
    });

    return data.map((item) => this.toDomain(item));
  }

  async findByAddonId(
    licenseAddonId: string,
  ): Promise<LicenseEntitlementAddon[]> {
    this.logger.debug("Finding license entitlement addons by addon", {
      licenseAddonId,
    });

    const data = await this.prisma.licenseEntitlementAddon.findMany({
      where: { licenseAddonId },
      orderBy: { createdAt: "asc" },
    });

    return data.map((item) => this.toDomain(item));
  }

  async findAll(): Promise<LicenseEntitlementAddon[]> {
    this.logger.debug("Finding all license entitlement addons");

    const data = await this.prisma.licenseEntitlementAddon.findMany({
      orderBy: { createdAt: "asc" },
    });

    return data.map((item) => this.toDomain(item));
  }

  async update(
    entitlementAddon: LicenseEntitlementAddon,
  ): Promise<LicenseEntitlementAddon> {
    this.logger.debug("Updating license entitlement addon", {
      id: entitlementAddon.id,
    });

    const data = await this.prisma.licenseEntitlementAddon.update({
      where: { id: entitlementAddon.id },
      data: {
        cost: entitlementAddon.cost,
        currency: entitlementAddon.currency,
        note: entitlementAddon.note,
        updatedAt: new Date(),
      },
    });

    return this.toDomain(data);
  }

  async delete(id: string): Promise<void> {
    this.logger.debug("Deleting license entitlement addon", { id });

    await this.prisma.licenseEntitlementAddon.delete({
      where: { id },
    });
  }

  async deleteByEntitlementId(licenseEntitlementId: string): Promise<void> {
    this.logger.debug(
      "Deleting all license entitlement addons by entitlement",
      {
        licenseEntitlementId,
      },
    );

    await this.prisma.licenseEntitlementAddon.deleteMany({
      where: { licenseEntitlementId },
    });
  }

  async exists(
    licenseEntitlementId: string,
    licenseAddonId: string,
  ): Promise<boolean> {
    const count = await this.prisma.licenseEntitlementAddon.count({
      where: {
        licenseEntitlementId,
        licenseAddonId,
      },
    });

    return count > 0;
  }

  async countByEntitlementId(licenseEntitlementId: string): Promise<number> {
    return this.prisma.licenseEntitlementAddon.count({
      where: { licenseEntitlementId },
    });
  }

  async sumCostByEntitlementId(
    licenseEntitlementId: string,
  ): Promise<CostAggregation[]> {
    this.logger.debug("Summing addon costs by entitlement", {
      licenseEntitlementId,
    });

    // Group by currency and sum costs
    const results = await this.prisma.licenseEntitlementAddon.groupBy({
      by: ["currency"],
      where: {
        licenseEntitlementId,
        cost: { not: null },
        currency: { not: null },
      },
      _sum: {
        cost: true,
      },
    });

    return results
      .filter((r) => r.currency !== null && r._sum.cost !== null)
      .map((r) => ({
        currency: r.currency as string,
        total: Number(r._sum.cost),
      }));
  }

  async sumCostByAddonId(licenseAddonId: string): Promise<CostAggregation[]> {
    this.logger.debug("Summing addon costs by addon", { licenseAddonId });

    // Group by currency and sum costs
    const results = await this.prisma.licenseEntitlementAddon.groupBy({
      by: ["currency"],
      where: {
        licenseAddonId,
        cost: { not: null },
        currency: { not: null },
      },
      _sum: {
        cost: true,
      },
    });

    return results
      .filter((r) => r.currency !== null && r._sum.cost !== null)
      .map((r) => ({
        currency: r.currency as string,
        total: Number(r._sum.cost),
      }));
  }

  /**
   * Maps Prisma model to domain entity
   */
  private toDomain(
    data: PrismaLicenseEntitlementAddon,
  ): LicenseEntitlementAddon {
    return LicenseEntitlementAddon.reconstitute({
      id: data.id,
      licenseEntitlementId: data.licenseEntitlementId,
      licenseAddonId: data.licenseAddonId,
      cost: data.cost?.toNumber() ?? null,
      currency: data.currency,
      note: data.note,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    });
  }
}
