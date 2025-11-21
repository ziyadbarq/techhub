/**
 * Prisma LicenseProduct Repository Implementation
 *
 * Implements ILicenseProductRepository using Prisma ORM.
 */

import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { PrismaClient } from "@/generated/prisma";
import type { ILicenseProductRepository } from "@/core/repositories/license-product.repository.interface";
import type {
  LicenseMetricType} from "@/core/domain/entities/license-product.entity";
import {
  LicenseProduct
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
        metricType: licenseProduct.metricType,
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

  async update(licenseProduct: LicenseProduct): Promise<LicenseProduct> {
    this.logger.debug("Updating license product", { id: licenseProduct.id });

    const data = await this.prisma.licenseProduct.update({
      where: { id: licenseProduct.id },
      data: {
        name: licenseProduct.name,
        code: licenseProduct.code,
        vendorId: licenseProduct.vendorId,
        metricType: licenseProduct.metricType,
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
  private toDomain(data: {
    id: string;
    name: string;
    code: string;
    vendorId: string;
    metricType: string;
    description: string | null;
    lifecycleModelId: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): LicenseProduct {
    return LicenseProduct.restore({
      id: data.id,
      name: data.name,
      code: data.code,
      vendorId: data.vendorId,
      metricType: data.metricType as LicenseMetricType,
      description: data.description,
      lifecycleModelId: data.lifecycleModelId,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    });
  }
}
