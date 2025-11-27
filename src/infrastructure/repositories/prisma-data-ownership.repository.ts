/**
 * Prisma DataOwnership Repository Implementation
 *
 * Implements IDataOwnershipRepository using Prisma ORM.
 */

import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { PrismaClient } from "@/generated/prisma/server";
import type { IDataOwnershipRepository } from "@/core/repositories/data-ownership.repository.interface";
import { DataOwnership } from "@/core/domain/entities/data-ownership.entity";
import type { ILoggerService } from "@/core/services";

@injectable()
export class PrismaDataOwnershipRepository implements IDataOwnershipRepository {
  constructor(
    @inject(DI_TOKENS.PrismaClient) private prisma: PrismaClient,
    @inject(DI_TOKENS.ILoggerService) private logger: ILoggerService,
  ) {}

  async create(dataOwnership: DataOwnership): Promise<DataOwnership> {
    this.logger.debug("Creating data ownership", { id: dataOwnership.id });

    const data = await this.prisma.dataOwnership.create({
      data: {
        id: dataOwnership.id,
        dataDomainId: dataOwnership.dataDomainId,
        ciClassId: dataOwnership.ciClassId,
        assetCategoryId: dataOwnership.assetCategoryId,
        ownerPersonId: dataOwnership.ownerPersonId,
        ownerOrgUnitId: dataOwnership.ownerOrgUnitId,
        note: dataOwnership.note,
        createdAt: dataOwnership.createdAt,
        updatedAt: dataOwnership.updatedAt,
      },
    });

    return this.toDomain(data);
  }

  async findById(id: string): Promise<DataOwnership | null> {
    this.logger.debug("Finding data ownership by id", { id });

    const data = await this.prisma.dataOwnership.findUnique({
      where: { id },
    });

    return data ? this.toDomain(data) : null;
  }

  async findAll(): Promise<DataOwnership[]> {
    this.logger.debug("Finding all data ownerships");

    const data = await this.prisma.dataOwnership.findMany({
      orderBy: { createdAt: "desc" },
    });

    return data.map((item) => this.toDomain(item));
  }

  async findByDataDomain(dataDomainId: string): Promise<DataOwnership[]> {
    this.logger.debug("Finding data ownerships by data domain", {
      dataDomainId,
    });

    const data = await this.prisma.dataOwnership.findMany({
      where: { dataDomainId },
      orderBy: { createdAt: "desc" },
    });

    return data.map((item) => this.toDomain(item));
  }

  async findByCIClass(ciClassId: string): Promise<DataOwnership[]> {
    this.logger.debug("Finding data ownerships by CI class", { ciClassId });

    const data = await this.prisma.dataOwnership.findMany({
      where: { ciClassId },
      orderBy: { createdAt: "desc" },
    });

    return data.map((item) => this.toDomain(item));
  }

  async findByAssetCategory(assetCategoryId: string): Promise<DataOwnership[]> {
    this.logger.debug("Finding data ownerships by asset category", {
      assetCategoryId,
    });

    const data = await this.prisma.dataOwnership.findMany({
      where: { assetCategoryId },
      orderBy: { createdAt: "desc" },
    });

    return data.map((item) => this.toDomain(item));
  }

  async findByOwnerPerson(ownerPersonId: string): Promise<DataOwnership[]> {
    this.logger.debug("Finding data ownerships by owner person", {
      ownerPersonId,
    });

    const data = await this.prisma.dataOwnership.findMany({
      where: { ownerPersonId },
      orderBy: { createdAt: "desc" },
    });

    return data.map((item) => this.toDomain(item));
  }

  async findByOwnerOrgUnit(ownerOrgUnitId: string): Promise<DataOwnership[]> {
    this.logger.debug("Finding data ownerships by owner org unit", {
      ownerOrgUnitId,
    });

    const data = await this.prisma.dataOwnership.findMany({
      where: { ownerOrgUnitId },
      orderBy: { createdAt: "desc" },
    });

    return data.map((item) => this.toDomain(item));
  }

  async update(dataOwnership: DataOwnership): Promise<DataOwnership> {
    this.logger.debug("Updating data ownership", { id: dataOwnership.id });

    const data = await this.prisma.dataOwnership.update({
      where: { id: dataOwnership.id },
      data: {
        dataDomainId: dataOwnership.dataDomainId,
        ciClassId: dataOwnership.ciClassId,
        assetCategoryId: dataOwnership.assetCategoryId,
        ownerPersonId: dataOwnership.ownerPersonId,
        ownerOrgUnitId: dataOwnership.ownerOrgUnitId,
        note: dataOwnership.note,
        updatedAt: new Date(),
      },
    });

    return this.toDomain(data);
  }

  async delete(id: string): Promise<void> {
    this.logger.debug("Deleting data ownership", { id });

    await this.prisma.dataOwnership.delete({
      where: { id },
    });
  }

  async existsByDataDomainAndTarget(
    dataDomainId: string,
    ciClassId?: string | null,
    assetCategoryId?: string | null,
    excludeId?: string,
  ): Promise<boolean> {
    const count = await this.prisma.dataOwnership.count({
      where: {
        dataDomainId,
        ...(ciClassId && { ciClassId }),
        ...(assetCategoryId && { assetCategoryId }),
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
    dataDomainId: string;
    ciClassId: string | null;
    assetCategoryId: string | null;
    ownerPersonId: string | null;
    ownerOrgUnitId: string | null;
    note: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): DataOwnership {
    return DataOwnership.restore({
      id: data.id,
      dataDomainId: data.dataDomainId,
      ciClassId: data.ciClassId,
      assetCategoryId: data.assetCategoryId,
      ownerPersonId: data.ownerPersonId,
      ownerOrgUnitId: data.ownerOrgUnitId,
      note: data.note,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    });
  }
}
