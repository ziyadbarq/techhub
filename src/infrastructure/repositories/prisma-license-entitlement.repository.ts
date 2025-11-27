/**
 * Prisma LicenseEntitlement Repository Implementation
 */

import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { ILicenseEntitlementRepository } from "@/core/repositories/license-entitlement.repository.interface";
import { LicenseEntitlement } from "@/core/domain/entities/license-entitlement.entity";
import type { PrismaClient, Prisma } from "@/generated/prisma/server";
import type { ILoggerService } from "@/core/services/logger.service.interface";
import { fromJsonValue, toJsonValue } from "./prisma-helpers";

@injectable()
export class PrismaLicenseEntitlementRepository
  implements ILicenseEntitlementRepository
{
  constructor(
    @inject(DI_TOKENS.PrismaClient) private prisma: PrismaClient,
    @inject(DI_TOKENS.ILoggerService) private logger: ILoggerService,
  ) {}

  async create(entitlement: LicenseEntitlement): Promise<LicenseEntitlement> {
    const data = await this.prisma.licenseEntitlement.create({
      data: {
        licenseProductId: entitlement.licenseProductId,
        contractId: entitlement.contractId,
        purchasedQuantity: entitlement.purchasedQuantity,
        effectiveStart: entitlement.effectiveStart,
        effectiveEnd: entitlement.effectiveEnd,
        allowedScope: toJsonValue(entitlement.allowedScope),
        note: entitlement.note,
      },
    });

    this.logger.info("LicenseEntitlement created", {
      id: data.id,
      licenseProductId: data.licenseProductId,
    });

    return this.toDomain(data);
  }

  async findById(id: string): Promise<LicenseEntitlement | null> {
    const data = await this.prisma.licenseEntitlement.findUnique({
      where: { id },
    });

    return data ? this.toDomain(data) : null;
  }

  async findAll(): Promise<LicenseEntitlement[]> {
    const data = await this.prisma.licenseEntitlement.findMany({
      orderBy: { effectiveStart: "desc" },
    });

    return data.map((item) => this.toDomain(item));
  }

  async findByLicenseProductId(
    licenseProductId: string,
  ): Promise<LicenseEntitlement[]> {
    const data = await this.prisma.licenseEntitlement.findMany({
      where: { licenseProductId },
      orderBy: { effectiveStart: "desc" },
    });

    return data.map((item) => this.toDomain(item));
  }

  async findByContractId(contractId: string): Promise<LicenseEntitlement[]> {
    const data = await this.prisma.licenseEntitlement.findMany({
      where: { contractId },
      orderBy: { effectiveStart: "desc" },
    });

    return data.map((item) => this.toDomain(item));
  }

  async findActiveByLicenseProductId(
    licenseProductId: string,
    asOfDate: Date = new Date(),
  ): Promise<LicenseEntitlement[]> {
    const data = await this.prisma.licenseEntitlement.findMany({
      where: {
        licenseProductId,
        effectiveStart: { lte: asOfDate },
        OR: [{ effectiveEnd: null }, { effectiveEnd: { gte: asOfDate } }],
      },
      orderBy: { effectiveStart: "desc" },
    });

    return data.map((item) => this.toDomain(item));
  }

  async findExpired(
    asOfDate: Date = new Date(),
  ): Promise<LicenseEntitlement[]> {
    const data = await this.prisma.licenseEntitlement.findMany({
      where: {
        effectiveEnd: {
          not: null,
          lt: asOfDate,
        },
      },
      orderBy: { effectiveEnd: "desc" },
    });

    return data.map((item) => this.toDomain(item));
  }

  async findExpiringBetween(
    startDate: Date,
    endDate: Date,
  ): Promise<LicenseEntitlement[]> {
    const data = await this.prisma.licenseEntitlement.findMany({
      where: {
        effectiveEnd: {
          not: null,
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { effectiveEnd: "asc" },
    });

    return data.map((item) => this.toDomain(item));
  }

  async update(entitlement: LicenseEntitlement): Promise<LicenseEntitlement> {
    const data = await this.prisma.licenseEntitlement.update({
      where: { id: entitlement.id },
      data: {
        purchasedQuantity: entitlement.purchasedQuantity,
        effectiveStart: entitlement.effectiveStart,
        effectiveEnd: entitlement.effectiveEnd,
        allowedScope: toJsonValue(entitlement.allowedScope),
        note: entitlement.note,
        updatedAt: entitlement.updatedAt,
      },
    });

    this.logger.info("LicenseEntitlement updated", {
      id: data.id,
    });

    return this.toDomain(data);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.licenseEntitlement.delete({
      where: { id },
    });

    this.logger.info("LicenseEntitlement deleted", { id });
  }

  async exists(id: string): Promise<boolean> {
    const count = await this.prisma.licenseEntitlement.count({
      where: { id },
    });

    return count > 0;
  }

  async countByLicenseProductId(licenseProductId: string): Promise<number> {
    return await this.prisma.licenseEntitlement.count({
      where: { licenseProductId },
    });
  }

  // Map Prisma model to domain entity
  private toDomain(data: {
    id: string;
    licenseProductId: string;
    contractId: string | null;
    purchasedQuantity: number;
    effectiveStart: Date;
    effectiveEnd: Date | null;
    allowedScope: Prisma.JsonValue | null;
    note: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): LicenseEntitlement {
    return LicenseEntitlement.reconstitute({
      id: data.id,
      licenseProductId: data.licenseProductId,
      contractId: data.contractId,
      purchasedQuantity: data.purchasedQuantity,
      effectiveStart: data.effectiveStart,
      effectiveEnd: data.effectiveEnd,
      allowedScope: fromJsonValue<Record<string, unknown>>(data.allowedScope),
      note: data.note,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    });
  }
}
