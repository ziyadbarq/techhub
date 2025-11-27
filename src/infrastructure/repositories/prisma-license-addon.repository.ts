/**
 * Prisma LicenseAddon Repository Implementation
 *
 * Implements ILicenseAddonRepository using Prisma ORM.
 */

import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { PrismaClient } from "@/generated/prisma/server";
import type { ILicenseAddonRepository } from "@/core/repositories/license-addon.repository.interface";
import { LicenseAddon } from "@/core/domain/entities/license-addon.entity";
import type { ILoggerService } from "@/core/services";

@injectable()
export class PrismaLicenseAddonRepository implements ILicenseAddonRepository {
  constructor(
    @inject(DI_TOKENS.PrismaClient) private prisma: PrismaClient,
    @inject(DI_TOKENS.ILoggerService) private logger: ILoggerService,
  ) {}

  async create(addon: LicenseAddon): Promise<LicenseAddon> {
    this.logger.debug("Creating license addon", { name: addon.name });

    const data = await this.prisma.licenseAddon.create({
      data: {
        name: addon.name,
        code: addon.code,
        licenseProductId: addon.licenseProductId,
        description: addon.description,
        isActive: addon.isActive,
        createdAt: addon.createdAt,
        updatedAt: addon.updatedAt,
      },
    });

    return this.toDomain(data);
  }

  async findById(id: string): Promise<LicenseAddon | null> {
    this.logger.debug("Finding license addon by id", { id });

    const data = await this.prisma.licenseAddon.findUnique({
      where: { id },
    });

    return data ? this.toDomain(data) : null;
  }

  async findByCode(
    licenseProductId: string,
    code: string,
  ): Promise<LicenseAddon | null> {
    this.logger.debug("Finding license addon by code", {
      licenseProductId,
      code,
    });

    const data = await this.prisma.licenseAddon.findUnique({
      where: {
        licenseProductId_code: {
          licenseProductId,
          code,
        },
      },
    });

    return data ? this.toDomain(data) : null;
  }

  async findByLicenseProductId(
    licenseProductId: string,
  ): Promise<LicenseAddon[]> {
    this.logger.debug("Finding license addons by product", {
      licenseProductId,
    });

    const data = await this.prisma.licenseAddon.findMany({
      where: { licenseProductId },
      orderBy: { name: "asc" },
    });

    return data.map((item) => this.toDomain(item));
  }

  async findActiveByLicenseProductId(
    licenseProductId: string,
  ): Promise<LicenseAddon[]> {
    this.logger.debug("Finding active license addons by product", {
      licenseProductId,
    });

    const data = await this.prisma.licenseAddon.findMany({
      where: {
        licenseProductId,
        isActive: true,
      },
      orderBy: { name: "asc" },
    });

    return data.map((item) => this.toDomain(item));
  }

  async findAll(): Promise<LicenseAddon[]> {
    this.logger.debug("Finding all license addons");

    const data = await this.prisma.licenseAddon.findMany({
      orderBy: { name: "asc" },
    });

    return data.map((item) => this.toDomain(item));
  }

  async update(addon: LicenseAddon): Promise<LicenseAddon> {
    this.logger.debug("Updating license addon", { id: addon.id });

    const data = await this.prisma.licenseAddon.update({
      where: { id: addon.id },
      data: {
        name: addon.name,
        description: addon.description,
        isActive: addon.isActive,
        updatedAt: new Date(),
      },
    });

    return this.toDomain(data);
  }

  async delete(id: string): Promise<void> {
    this.logger.debug("Deleting license addon", { id });

    await this.prisma.licenseAddon.delete({
      where: { id },
    });
  }

  async existsByCode(
    licenseProductId: string,
    code: string,
    excludeId?: string,
  ): Promise<boolean> {
    const count = await this.prisma.licenseAddon.count({
      where: {
        licenseProductId,
        code,
        ...(excludeId && { id: { not: excludeId } }),
      },
    });

    return count > 0;
  }

  async countByLicenseProductId(licenseProductId: string): Promise<number> {
    return this.prisma.licenseAddon.count({
      where: { licenseProductId },
    });
  }

  /**
   * Maps Prisma model to domain entity
   */
  private toDomain(data: {
    id: string;
    licenseProductId: string;
    name: string;
    code: string;
    description: string | null;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  }): LicenseAddon {
    return LicenseAddon.reconstitute({
      id: data.id,
      licenseProductId: data.licenseProductId,
      name: data.name,
      code: data.code,
      description: data.description,
      isActive: data.isActive,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    });
  }
}
