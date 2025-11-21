/**
 * Prisma StockLocation Repository Implementation
 * Handles persistence for stock locations
 */

import { inject, injectable } from "inversify";
import type { PrismaClient } from "@/generated/prisma";
import type { StockLocation as PrismaStockLocation } from "@/generated/prisma";

import { DI_TOKENS } from "@/di/types";
import { StockLocation } from "@/core/domain/entities/stock-location.entity";
import type { IStockLocationRepository } from "@/core/repositories/stock-location.repository.interface";
import { createRepositoryLogger } from "./repository-logger";

@injectable()
export class PrismaStockLocationRepository implements IStockLocationRepository {
  private readonly logger = createRepositoryLogger("StockLocationRepository");

  constructor(
    @inject(DI_TOKENS.PrismaClient)
    private readonly prisma: PrismaClient,
  ) {}

  async create(stockLocation: StockLocation): Promise<StockLocation> {
    const timer = this.logger.startTimer();

    try {
      const created = await this.prisma.stockLocation.create({
        data: {
          name: stockLocation.name,
          code: stockLocation.code,
          locationId: stockLocation.locationId,
          description: stockLocation.description,
        },
      });

      this.logger.timed("create", "StockLocation created", timer(), {
        id: created.id,
      });
      return this.toDomain(created);
    } catch (error) {
      this.logger.error("create", "Failed to create stock location", error);
      throw error;
    }
  }

  async findById(id: string): Promise<StockLocation | null> {
    const stockLocation = await this.prisma.stockLocation.findUnique({
      where: { id },
    });

    return stockLocation ? this.toDomain(stockLocation) : null;
  }

  async findByCode(code: string): Promise<StockLocation | null> {
    const stockLocation = await this.prisma.stockLocation.findUnique({
      where: { code },
    });

    return stockLocation ? this.toDomain(stockLocation) : null;
  }

  async findByLocation(locationId: string): Promise<StockLocation[]> {
    const stockLocations = await this.prisma.stockLocation.findMany({
      where: { locationId },
      orderBy: { name: "asc" },
    });

    return stockLocations.map((sl: PrismaStockLocation) => this.toDomain(sl));
  }

  async findAll(options?: {
    skip?: number;
    take?: number;
    orderBy?: "name" | "code" | "createdAt";
    order?: "asc" | "desc";
  }): Promise<StockLocation[]> {
    const orderBy = options?.orderBy || "name";
    const order = options?.order || "asc";

    const stockLocations = await this.prisma.stockLocation.findMany({
      skip: options?.skip,
      take: options?.take,
      orderBy: { [orderBy]: order },
    });

    return stockLocations.map((sl: PrismaStockLocation) => this.toDomain(sl));
  }

  async count(): Promise<number> {
    return this.prisma.stockLocation.count();
  }

  async update(stockLocation: StockLocation): Promise<StockLocation> {
    const timer = this.logger.startTimer();

    try {
      const updated = await this.prisma.stockLocation.update({
        where: { id: stockLocation.id },
        data: {
          name: stockLocation.name,
          code: stockLocation.code,
          locationId: stockLocation.locationId,
          description: stockLocation.description,
        },
      });

      this.logger.timed("update", "StockLocation updated", timer(), {
        id: updated.id,
      });
      return this.toDomain(updated);
    } catch (error) {
      this.logger.error("update", "Failed to update stock location", error);
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    const timer = this.logger.startTimer();

    try {
      await this.prisma.stockLocation.delete({
        where: { id },
      });

      this.logger.timed("delete", "StockLocation deleted", timer(), { id });
    } catch (error) {
      this.logger.error("delete", "Failed to delete stock location", error);
      throw error;
    }
  }

  async existsByCode(code: string, excludeId?: string): Promise<boolean> {
    const stockLocation = await this.prisma.stockLocation.findFirst({
      where: {
        code,
        id: excludeId ? { not: excludeId } : undefined,
      },
    });

    return stockLocation !== null;
  }

  async hasAssets(id: string): Promise<boolean> {
    const count = await this.prisma.asset.count({
      where: { currentStockLocationId: id },
    });
    return count > 0;
  }

  async hasMovements(id: string): Promise<boolean> {
    const count = await this.prisma.stockMovement.count({
      where: {
        OR: [{ stockLocationFromId: id }, { stockLocationToId: id }],
      },
    });
    return count > 0;
  }

  private toDomain(prismaStockLocation: PrismaStockLocation): StockLocation {
    return StockLocation.reconstitute({
      id: prismaStockLocation.id,
      name: prismaStockLocation.name,
      code: prismaStockLocation.code,
      locationId: prismaStockLocation.locationId,
      description: prismaStockLocation.description,
      createdAt: prismaStockLocation.createdAt,
      updatedAt: prismaStockLocation.updatedAt,
    });
  }
}
