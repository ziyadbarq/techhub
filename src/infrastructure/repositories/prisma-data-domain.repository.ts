/**
 * Prisma DataDomain Repository Implementation
 *
 * Implements IDataDomainRepository using Prisma ORM.
 */

import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { PrismaClient } from "@/generated/prisma";
import type { IDataDomainRepository } from "@/core/repositories/data-domain.repository.interface";
import { DataDomain } from "@/core/domain/entities/data-domain.entity";
import type { ILoggerService } from "@/core/services";

@injectable()
export class PrismaDataDomainRepository implements IDataDomainRepository {
  constructor(
    @inject(DI_TOKENS.PrismaClient) private prisma: PrismaClient,
    @inject(DI_TOKENS.ILoggerService) private logger: ILoggerService,
  ) {}

  async create(dataDomain: DataDomain): Promise<DataDomain> {
    this.logger.debug("Creating data domain", { id: dataDomain.id });

    const data = await this.prisma.dataDomain.create({
      data: {
        id: dataDomain.id,
        name: dataDomain.name,
        code: dataDomain.code,
        description: dataDomain.description,
        isActive: dataDomain.isActive,
        createdAt: dataDomain.createdAt,
        updatedAt: dataDomain.updatedAt,
      },
    });

    return this.toDomain(data);
  }

  async findById(id: string): Promise<DataDomain | null> {
    this.logger.debug("Finding data domain by id", { id });

    const data = await this.prisma.dataDomain.findUnique({
      where: { id },
    });

    return data ? this.toDomain(data) : null;
  }

  async findByName(name: string): Promise<DataDomain | null> {
    this.logger.debug("Finding data domain by name", { name });

    const data = await this.prisma.dataDomain.findUnique({
      where: { name },
    });

    return data ? this.toDomain(data) : null;
  }

  async findByCode(code: string): Promise<DataDomain | null> {
    this.logger.debug("Finding data domain by code", { code });

    const data = await this.prisma.dataDomain.findUnique({
      where: { code },
    });

    return data ? this.toDomain(data) : null;
  }

  async findAll(): Promise<DataDomain[]> {
    this.logger.debug("Finding all data domains");

    const data = await this.prisma.dataDomain.findMany({
      orderBy: { name: "asc" },
    });

    return data.map((item) => this.toDomain(item));
  }

  async findActive(): Promise<DataDomain[]> {
    this.logger.debug("Finding active data domains");

    const data = await this.prisma.dataDomain.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    });

    return data.map((item) => this.toDomain(item));
  }

  async update(dataDomain: DataDomain): Promise<DataDomain> {
    this.logger.debug("Updating data domain", { id: dataDomain.id });

    const data = await this.prisma.dataDomain.update({
      where: { id: dataDomain.id },
      data: {
        name: dataDomain.name,
        code: dataDomain.code,
        description: dataDomain.description,
        isActive: dataDomain.isActive,
        updatedAt: new Date(),
      },
    });

    return this.toDomain(data);
  }

  async delete(id: string): Promise<void> {
    this.logger.debug("Deleting data domain", { id });

    await this.prisma.dataDomain.delete({
      where: { id },
    });
  }

  async existsByName(name: string, excludeId?: string): Promise<boolean> {
    const count = await this.prisma.dataDomain.count({
      where: {
        name,
        ...(excludeId && { id: { not: excludeId } }),
      },
    });

    return count > 0;
  }

  async existsByCode(code: string, excludeId?: string): Promise<boolean> {
    const count = await this.prisma.dataDomain.count({
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
    description: string | null;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  }): DataDomain {
    return DataDomain.restore({
      id: data.id,
      name: data.name,
      code: data.code,
      description: data.description,
      isActive: data.isActive,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    });
  }
}
