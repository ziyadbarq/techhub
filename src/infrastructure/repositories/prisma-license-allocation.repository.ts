/**
 * Prisma LicenseAllocation Repository Implementation
 */

import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { ILicenseAllocationRepository } from "@/core/repositories/license-allocation.repository.interface";
import {
  LicenseAllocation,
  AllocationTargetType,
} from "@/core/domain/entities/license-allocation.entity";
import type {
  PrismaClient,
  AllocationTargetTypeEnum,
} from "@/generated/prisma";
import type { ILoggerService } from "@/core/services/logger.service.interface";

@injectable()
export class PrismaLicenseAllocationRepository
  implements ILicenseAllocationRepository
{
  constructor(
    @inject(DI_TOKENS.PrismaClient) private prisma: PrismaClient,
    @inject(DI_TOKENS.ILoggerService) private logger: ILoggerService,
  ) {}

  async create(allocation: LicenseAllocation): Promise<LicenseAllocation> {
    const data = await this.prisma.licenseAllocation.create({
      data: {
        licenseEntitlementId: allocation.licenseEntitlementId,
        targetType: this.toDbTargetType(allocation.targetType),
        targetId: allocation.targetId,
        allocatedQuantity: allocation.allocatedQuantity,
        allocatedAt: allocation.allocatedAt,
        deallocatedAt: allocation.deallocatedAt,
        note: allocation.note,
      },
    });

    this.logger.info("LicenseAllocation created", {
      id: data.id,
      licenseEntitlementId: data.licenseEntitlementId,
      targetType: data.targetType,
      targetId: data.targetId,
    });

    return this.toDomain(data);
  }

  async findById(id: string): Promise<LicenseAllocation | null> {
    const data = await this.prisma.licenseAllocation.findUnique({
      where: { id },
    });

    return data ? this.toDomain(data) : null;
  }

  async findAll(): Promise<LicenseAllocation[]> {
    const data = await this.prisma.licenseAllocation.findMany({
      orderBy: { allocatedAt: "desc" },
    });

    return data.map((item) => this.toDomain(item));
  }

  async findByLicenseEntitlementId(
    licenseEntitlementId: string,
  ): Promise<LicenseAllocation[]> {
    const data = await this.prisma.licenseAllocation.findMany({
      where: { licenseEntitlementId },
      orderBy: { allocatedAt: "desc" },
    });

    return data.map((item) => this.toDomain(item));
  }

  async findActiveByLicenseEntitlementId(
    licenseEntitlementId: string,
  ): Promise<LicenseAllocation[]> {
    const data = await this.prisma.licenseAllocation.findMany({
      where: {
        licenseEntitlementId,
        deallocatedAt: null,
      },
      orderBy: { allocatedAt: "desc" },
    });

    return data.map((item) => this.toDomain(item));
  }

  async findByTarget(
    targetType: AllocationTargetType,
    targetId: string,
  ): Promise<LicenseAllocation[]> {
    const data = await this.prisma.licenseAllocation.findMany({
      where: {
        targetType: this.toDbTargetType(targetType),
        targetId,
      },
      orderBy: { allocatedAt: "desc" },
    });

    return data.map((item) => this.toDomain(item));
  }

  async findActiveByTarget(
    targetType: AllocationTargetType,
    targetId: string,
  ): Promise<LicenseAllocation[]> {
    const data = await this.prisma.licenseAllocation.findMany({
      where: {
        targetType: this.toDbTargetType(targetType),
        targetId,
        deallocatedAt: null,
      },
      orderBy: { allocatedAt: "desc" },
    });

    return data.map((item) => this.toDomain(item));
  }

  async sumAllocatedQuantityByEntitlement(
    licenseEntitlementId: string,
  ): Promise<number> {
    const result = await this.prisma.licenseAllocation.aggregate({
      where: { licenseEntitlementId },
      _sum: {
        allocatedQuantity: true,
      },
    });

    return result._sum.allocatedQuantity ?? 0;
  }

  async sumActiveAllocatedQuantityByEntitlement(
    licenseEntitlementId: string,
  ): Promise<number> {
    const result = await this.prisma.licenseAllocation.aggregate({
      where: {
        licenseEntitlementId,
        deallocatedAt: null,
      },
      _sum: {
        allocatedQuantity: true,
      },
    });

    return result._sum.allocatedQuantity ?? 0;
  }

  async update(allocation: LicenseAllocation): Promise<LicenseAllocation> {
    const data = await this.prisma.licenseAllocation.update({
      where: { id: allocation.id },
      data: {
        allocatedQuantity: allocation.allocatedQuantity,
        deallocatedAt: allocation.deallocatedAt,
        note: allocation.note,
        updatedAt: allocation.updatedAt,
      },
    });

    this.logger.info("LicenseAllocation updated", {
      id: data.id,
    });

    return this.toDomain(data);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.licenseAllocation.delete({
      where: { id },
    });

    this.logger.info("LicenseAllocation deleted", { id });
  }

  async exists(id: string): Promise<boolean> {
    const count = await this.prisma.licenseAllocation.count({
      where: { id },
    });

    return count > 0;
  }

  async countByLicenseEntitlementId(
    licenseEntitlementId: string,
  ): Promise<number> {
    return await this.prisma.licenseAllocation.count({
      where: { licenseEntitlementId },
    });
  }

  async countActiveByLicenseEntitlementId(
    licenseEntitlementId: string,
  ): Promise<number> {
    return await this.prisma.licenseAllocation.count({
      where: {
        licenseEntitlementId,
        deallocatedAt: null,
      },
    });
  }

  // Map domain enum to database enum
  private toDbTargetType(
    targetType: AllocationTargetType,
  ): AllocationTargetTypeEnum {
    switch (targetType) {
      case AllocationTargetType.PERSON:
        return "PERSON" as AllocationTargetTypeEnum;
      case AllocationTargetType.CI:
        return "CI" as AllocationTargetTypeEnum;
      case AllocationTargetType.ASSET:
        return "ASSET" as AllocationTargetTypeEnum;
      default:
        throw new Error(`Unknown target type: ${targetType}`);
    }
  }

  // Map database enum to domain enum
  private toDomainTargetType(
    targetType: AllocationTargetTypeEnum,
  ): AllocationTargetType {
    switch (targetType) {
      case "PERSON":
        return AllocationTargetType.PERSON;
      case "CI":
        return AllocationTargetType.CI;
      case "ASSET":
        return AllocationTargetType.ASSET;
      default:
        throw new Error(`Unknown database target type: ${targetType}`);
    }
  }

  // Map Prisma model to domain entity
  private toDomain(data: {
    id: string;
    licenseEntitlementId: string;
    targetType: AllocationTargetTypeEnum;
    targetId: string;
    allocatedQuantity: number;
    allocatedAt: Date;
    deallocatedAt: Date | null;
    note: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): LicenseAllocation {
    return LicenseAllocation.reconstitute({
      id: data.id,
      licenseEntitlementId: data.licenseEntitlementId,
      targetType: this.toDomainTargetType(data.targetType),
      targetId: data.targetId,
      allocatedQuantity: data.allocatedQuantity,
      allocatedAt: data.allocatedAt,
      deallocatedAt: data.deallocatedAt,
      note: data.note,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    });
  }
}
