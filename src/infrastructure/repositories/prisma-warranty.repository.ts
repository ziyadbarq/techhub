/**
 * Prisma Warranty Repository Implementation
 */

import { injectable, inject } from "inversify";
import type {
  PrismaClient,
  Warranty as PrismaWarranty,
  Prisma,
  WarrantyCoverageType,
} from "@/generated/prisma";
import { DI_TOKENS } from "@/di/types";
import type {
  IWarrantyRepository,
  WarrantySearchOptions,
} from "@/core/repositories/warranty.repository.interface";
import { Warranty } from "@/core/domain/entities/warranty.entity";
import { createRepositoryLogger } from "./repository-logger";
import { toJsonValue, fromJsonValue } from "./prisma-helpers";

@injectable()
export class PrismaWarrantyRepository implements IWarrantyRepository {
  private readonly logger = createRepositoryLogger("WarrantyRepository");

  constructor(
    @inject(DI_TOKENS.PrismaClient)
    private readonly prisma: PrismaClient,
  ) {}

  async create(warranty: Warranty): Promise<Warranty> {
    const timer = this.logger.startTimer();

    try {
      const created = await this.prisma.warranty.create({
        data: {
          assetId: warranty.assetId,
          vendorId: warranty.vendorId,
          coverageType: warranty.coverageType,
          coverageDetails: warranty.coverageDetails,
          policyReference: warranty.policyReference,
          slaDetails: toJsonValue(warranty.slaDetails),
          startDate: warranty.startDate,
          endDate: warranty.endDate,
          cost: warranty.cost || null,
          currency: warranty.currency,
          note: warranty.note,
          metadata: toJsonValue(warranty.metadata),
        },
      });

      this.logger.timed("create", "Warranty created", timer(), {
        id: created.id,
      });
      return this.toDomain(created);
    } catch (error) {
      this.logger.error("create", "Failed to create warranty", error);
      throw error;
    }
  }

  async findById(id: string): Promise<Warranty | null> {
    const warranty = await this.prisma.warranty.findUnique({
      where: { id },
    });

    return warranty ? this.toDomain(warranty) : null;
  }

  async findByAssetId(assetId: string): Promise<Warranty[]> {
    const warranties = await this.prisma.warranty.findMany({
      where: { assetId },
      orderBy: { startDate: "desc" },
    });

    return warranties.map((w) => this.toDomain(w));
  }

  async findActiveByAssetId(assetId: string): Promise<Warranty | null> {
    const now = new Date();
    const warranty = await this.prisma.warranty.findFirst({
      where: {
        assetId,
        startDate: { lte: now },
        endDate: { gte: now },
      },
      orderBy: { endDate: "desc" }, // Get the longest active warranty
    });

    return warranty ? this.toDomain(warranty) : null;
  }

  async findAllActiveByAssetId(assetId: string): Promise<Warranty[]> {
    const now = new Date();
    const warranties = await this.prisma.warranty.findMany({
      where: {
        assetId,
        startDate: { lte: now },
        endDate: { gte: now },
      },
      orderBy: { endDate: "desc" },
    });

    return warranties.map((w) => this.toDomain(w));
  }

  async findExpiringSoon(days: number): Promise<Warranty[]> {
    const now = new Date();
    const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

    const warranties = await this.prisma.warranty.findMany({
      where: {
        startDate: { lte: now }, // Already started
        endDate: {
          gte: now, // Not expired
          lte: futureDate, // Expiring within days
        },
      },
      orderBy: { endDate: "asc" },
    });

    return warranties.map((w) => this.toDomain(w));
  }

  async findByVendor(vendorId: string): Promise<Warranty[]> {
    const warranties = await this.prisma.warranty.findMany({
      where: { vendorId },
      orderBy: { startDate: "desc" },
    });

    return warranties.map((w) => this.toDomain(w));
  }

  async findByPolicyReference(
    policyReference: string,
  ): Promise<Warranty | null> {
    const warranty = await this.prisma.warranty.findFirst({
      where: { policyReference },
    });

    return warranty ? this.toDomain(warranty) : null;
  }

  async findByCoverageType(
    coverageType: WarrantyCoverageType,
  ): Promise<Warranty[]> {
    const warranties = await this.prisma.warranty.findMany({
      where: { coverageType },
      orderBy: { startDate: "desc" },
    });

    return warranties.map((w) => this.toDomain(w));
  }

  async findAll(limit?: number, offset?: number): Promise<Warranty[]> {
    const warranties = await this.prisma.warranty.findMany({
      orderBy: { createdAt: "desc" },
      ...(limit && { take: limit }),
      ...(offset && { skip: offset }),
    });

    return warranties.map((w) => this.toDomain(w));
  }

  async search(options: WarrantySearchOptions): Promise<Warranty[]> {
    const where = this.buildWhereClause(options);

    const warranties = await this.prisma.warranty.findMany({
      where,
      orderBy: { endDate: "desc" },
      ...(options.limit && { take: options.limit }),
      ...(options.offset && { skip: options.offset }),
    });

    return warranties.map((w) => this.toDomain(w));
  }

  async count(): Promise<number> {
    return await this.prisma.warranty.count();
  }

  async countBySearch(options: WarrantySearchOptions): Promise<number> {
    const where = this.buildWhereClause(options);
    return await this.prisma.warranty.count({ where });
  }

  async countActive(): Promise<number> {
    const now = new Date();
    return await this.prisma.warranty.count({
      where: {
        startDate: { lte: now },
        endDate: { gte: now },
      },
    });
  }

  async countExpiringSoon(days: number): Promise<number> {
    const now = new Date();
    const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

    return await this.prisma.warranty.count({
      where: {
        startDate: { lte: now },
        endDate: {
          gte: now,
          lte: futureDate,
        },
      },
    });
  }

  async update(warranty: Warranty): Promise<Warranty> {
    const timer = this.logger.startTimer();

    try {
      const updated = await this.prisma.warranty.update({
        where: { id: warranty.id },
        data: {
          vendorId: warranty.vendorId,
          coverageType: warranty.coverageType,
          coverageDetails: warranty.coverageDetails,
          policyReference: warranty.policyReference,
          slaDetails: toJsonValue(warranty.slaDetails),
          startDate: warranty.startDate,
          endDate: warranty.endDate,
          cost: warranty.cost || null,
          currency: warranty.currency,
          note: warranty.note,
          metadata: toJsonValue(warranty.metadata),
          updatedAt: warranty.updatedAt,
        },
      });

      this.logger.timed("update", "Warranty updated", timer(), {
        id: updated.id,
      });
      return this.toDomain(updated);
    } catch (error) {
      this.logger.error("update", "Failed to update warranty", error);
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    const timer = this.logger.startTimer();

    try {
      await this.prisma.warranty.delete({
        where: { id },
      });

      this.logger.timed("delete", "Warranty deleted", timer(), { id });
    } catch (error) {
      this.logger.error("delete", "Failed to delete warranty", error);
      throw error;
    }
  }

  async existsByPolicyReference(
    policyReference: string,
    excludeId?: string,
  ): Promise<boolean> {
    const count = await this.prisma.warranty.count({
      where: {
        policyReference,
        ...(excludeId && { id: { not: excludeId } }),
      },
    });

    return count > 0;
  }

  async assetHasWarranties(assetId: string): Promise<boolean> {
    const count = await this.prisma.warranty.count({
      where: { assetId },
    });

    return count > 0;
  }

  async hasConflictingWarranty(
    assetId: string,
    startDate: Date,
    endDate: Date,
    excludeId?: string,
  ): Promise<boolean> {
    const count = await this.prisma.warranty.count({
      where: {
        assetId,
        ...(excludeId && { id: { not: excludeId } }),
        OR: [
          {
            // New warranty starts during existing warranty
            AND: [
              { startDate: { lte: startDate } },
              { endDate: { gte: startDate } },
            ],
          },
          {
            // New warranty ends during existing warranty
            AND: [
              { startDate: { lte: endDate } },
              { endDate: { gte: endDate } },
            ],
          },
          {
            // New warranty completely contains existing warranty
            AND: [
              { startDate: { gte: startDate } },
              { endDate: { lte: endDate } },
            ],
          },
        ],
      },
    });

    return count > 0;
  }

  /**
   * Build where clause for search queries
   */
  private buildWhereClause(
    options: WarrantySearchOptions,
  ): Prisma.WarrantyWhereInput {
    const where: Prisma.WarrantyWhereInput = {};

    if (options.assetId) {
      where.assetId = options.assetId;
    }

    if (options.vendorId) {
      where.vendorId = options.vendorId;
    }

    if (options.coverageType) {
      where.coverageType = options.coverageType;
    }

    if (options.status) {
      const now = new Date();
      switch (options.status) {
        case "active":
          where.startDate = { lte: now };
          where.endDate = { gte: now };
          break;
        case "expired":
          where.endDate = { lt: now };
          break;
        case "future":
          where.startDate = { gt: now };
          break;
        case "expiring_soon":
          if (options.expiringInDays) {
            const futureDate = new Date(
              now.getTime() + options.expiringInDays * 24 * 60 * 60 * 1000,
            );
            where.startDate = { lte: now };
            where.endDate = {
              gte: now,
              lte: futureDate,
            };
          }
          break;
      }
    }

    if (options.searchTerm) {
      where.OR = [
        {
          policyReference: {
            contains: options.searchTerm,
            mode: "insensitive",
          },
        },
        {
          coverageDetails: {
            contains: options.searchTerm,
            mode: "insensitive",
          },
        },
        {
          note: {
            contains: options.searchTerm,
            mode: "insensitive",
          },
        },
      ];
    }

    if (options.startDateFrom || options.startDateTo) {
      where.startDate = {
        ...(options.startDateFrom && { gte: options.startDateFrom }),
        ...(options.startDateTo && { lte: options.startDateTo }),
      };
    }

    if (options.endDateFrom || options.endDateTo) {
      where.endDate = {
        ...(options.endDateFrom && { gte: options.endDateFrom }),
        ...(options.endDateTo && { lte: options.endDateTo }),
      };
    }

    return where;
  }

  /**
   * Convert Prisma model to domain entity
   */
  private toDomain(prismaWarranty: PrismaWarranty): Warranty {
    return Warranty.reconstitute({
      id: prismaWarranty.id,
      assetId: prismaWarranty.assetId,
      vendorId: prismaWarranty.vendorId,
      coverageType: prismaWarranty.coverageType,
      coverageDetails: prismaWarranty.coverageDetails,
      policyReference: prismaWarranty.policyReference,
      slaDetails: fromJsonValue(prismaWarranty.slaDetails),
      startDate: prismaWarranty.startDate,
      endDate: prismaWarranty.endDate,
      cost: prismaWarranty.cost?.toNumber() || null,
      currency: prismaWarranty.currency,
      note: prismaWarranty.note,
      metadata: fromJsonValue(prismaWarranty.metadata),
      createdAt: prismaWarranty.createdAt,
      updatedAt: prismaWarranty.updatedAt,
    });
  }
}
