/**
 * Prisma LicenseProduct Repository Implementation
 *
 * Implements ILicenseProductRepository using Prisma ORM.
 */

import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type {
  $Enums,
  PrismaClient,
  LicenseProduct as PrismaLicenseProduct,
} from "@/generated/prisma/server";
import type { ILicenseProductRepository } from "@/core/repositories/license-product.repository.interface";
import {
  LicenseProduct,
  LicenseMetricType,
} from "@/core/domain/entities/license-product.entity";
import type { ILoggerService } from "@/core/services";

@injectable()
export class PrismaLicenseProductRepository
  implements ILicenseProductRepository
{
  constructor(
    @inject(DI_TOKENS.PrismaClient) private prisma: PrismaClient,
    @inject(DI_TOKENS.ILoggerService) private logger: ILoggerService,
  ) {}

  async create(licenseProduct: LicenseProduct): Promise<LicenseProduct> {
    this.logger.debug("Creating license product", { id: licenseProduct.id });

    const data = await this.prisma.licenseProduct.create({
      data: {
        id: licenseProduct.id,
        name: licenseProduct.name,
        code: licenseProduct.code,
        vendorId: licenseProduct.vendorId,
        metricType: this.toPrismaMetricType(licenseProduct.metricType),
        description: licenseProduct.description,
        lifecycleModelId: licenseProduct.lifecycleModelId,
        createdAt: licenseProduct.createdAt,
        updatedAt: licenseProduct.updatedAt,
      },
    });

    return this.toDomain(data);
  }

  async findById(id: string): Promise<LicenseProduct | null> {
    this.logger.debug("Finding license product by id", { id });

    const data = await this.prisma.licenseProduct.findUnique({
      where: { id },
    });

    return data ? this.toDomain(data) : null;
  }

  async findByName(name: string): Promise<LicenseProduct | null> {
    this.logger.debug("Finding license product by name", { name });

    const data = await this.prisma.licenseProduct.findUnique({
      where: { name },
    });

    return data ? this.toDomain(data) : null;
  }

  async findByCode(code: string): Promise<LicenseProduct | null> {
    this.logger.debug("Finding license product by code", { code });

    const data = await this.prisma.licenseProduct.findUnique({
      where: { code },
    });

    return data ? this.toDomain(data) : null;
  }

  async findAll(): Promise<LicenseProduct[]> {
    this.logger.debug("Finding all license products");

    const data = await this.prisma.licenseProduct.findMany({
      orderBy: { name: "asc" },
    });

    return data.map((item) => this.toDomain(item));
  }

  async findByVendorId(vendorId: string): Promise<LicenseProduct[]> {
    this.logger.debug("Finding license products by vendor", { vendorId });

    const data = await this.prisma.licenseProduct.findMany({
      where: { vendorId },
      orderBy: { name: "asc" },
    });

    return data.map((item) => this.toDomain(item));
  }

  async search(
    query: string,
    options?: {
      skip?: number;
      take?: number;
      vendorId?: string;
    },
  ): Promise<LicenseProduct[]> {
    this.logger.debug("Searching license products", { query, options });

    const data = await this.prisma.licenseProduct.findMany({
      where: {
        ...(options?.vendorId && { vendorId: options.vendorId }),
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { code: { contains: query, mode: "insensitive" } },
          { description: { contains: query, mode: "insensitive" } },
        ],
      },
      skip: options?.skip,
      take: options?.take,
      orderBy: { name: "asc" },
    });

    return data.map((item) => this.toDomain(item));
  }

  async update(licenseProduct: LicenseProduct): Promise<LicenseProduct> {
    this.logger.debug("Updating license product", { id: licenseProduct.id });

    const data = await this.prisma.licenseProduct.update({
      where: { id: licenseProduct.id },
      data: {
        name: licenseProduct.name,
        code: licenseProduct.code,
        vendorId: licenseProduct.vendorId,
        metricType: this.toPrismaMetricType(licenseProduct.metricType),
        description: licenseProduct.description,
        lifecycleModelId: licenseProduct.lifecycleModelId,
        updatedAt: new Date(),
      },
    });

    return this.toDomain(data);
  }

  async delete(id: string): Promise<void> {
    this.logger.debug("Deleting license product", { id });

    await this.prisma.licenseProduct.delete({
      where: { id },
    });
  }

  async existsByName(name: string, excludeId?: string): Promise<boolean> {
    const count = await this.prisma.licenseProduct.count({
      where: {
        name,
        ...(excludeId && { id: { not: excludeId } }),
      },
    });

    return count > 0;
  }

  async existsByCode(code: string, excludeId?: string): Promise<boolean> {
    const count = await this.prisma.licenseProduct.count({
      where: {
        code,
        ...(excludeId && { id: { not: excludeId } }),
      },
    });

    return count > 0;
  }

  /**
   * Maps Prisma model to domain entity
   */
  private toDomain(data: PrismaLicenseProduct): LicenseProduct {
    return LicenseProduct.restore({
      id: data.id,
      name: data.name,
      code: data.code,
      vendorId: data.vendorId,
      metricType: this.toDomainMetricType(data.metricType),
      description: data.description,
      lifecycleModelId: data.lifecycleModelId,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    });
  }

  private toPrismaMetricType(
    metricType: LicenseMetricType,
  ): $Enums.LicenseMetricTypeEnum {
    const mapping: Record<LicenseMetricType, $Enums.LicenseMetricTypeEnum> = {
      [LicenseMetricType.PER_DEVICE]: "PER_DEVICE",
      [LicenseMetricType.PER_USER]: "PER_USER",
      [LicenseMetricType.PER_CORE]: "PER_CORE",
      [LicenseMetricType.PER_VM]: "PER_VM",
      [LicenseMetricType.PER_CLUSTER]: "PER_CLUSTER",
    };

    return mapping[metricType];
  }

  private toDomainMetricType(
    metricType: $Enums.LicenseMetricTypeEnum,
  ): LicenseMetricType {
    const mapping: Record<$Enums.LicenseMetricTypeEnum, LicenseMetricType> = {
      PER_DEVICE: LicenseMetricType.PER_DEVICE,
      PER_USER: LicenseMetricType.PER_USER,
      PER_CORE: LicenseMetricType.PER_CORE,
      PER_VM: LicenseMetricType.PER_VM,
      PER_CLUSTER: LicenseMetricType.PER_CLUSTER,
    };

    return mapping[metricType];
  }
}
