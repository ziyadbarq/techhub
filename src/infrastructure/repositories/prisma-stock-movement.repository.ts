/**
 * Prisma Stock Movement Repository Implementation
 * Handles all stock movement data access operations
 */

import { inject, injectable } from "inversify";
import type { PrismaClient, $Enums } from "@/generated/prisma/server";
import type { StockMovement as PrismaStockMovement } from "@/generated/prisma";

import { DI_TOKENS } from "@/di/types";
import {
  StockMovement,
  type StockMovementType,
} from "@/core/domain/entities/stock-movement.entity";
import type { IStockMovementRepository } from "@/core/repositories/stock-movement.repository.interface";
import { createRepositoryLogger } from "./repository-logger";

@injectable()
export class PrismaStockMovementRepository implements IStockMovementRepository {
  private readonly logger = createRepositoryLogger("StockMovementRepository");

  constructor(
    @inject(DI_TOKENS.PrismaClient)
    private readonly prisma: PrismaClient,
  ) {}

  async create(stockMovement: StockMovement): Promise<StockMovement> {
    const timer = this.logger.startTimer();

    try {
      const created = await this.prisma.stockMovement.create({
        data: {
          movementType:
            stockMovement.movementType as $Enums.StockMovementTypeEnum,
          stockLocationFromId: stockMovement.stockLocationFromId,
          stockLocationToId: stockMovement.stockLocationToId,
          assetId: stockMovement.assetId,
          quantity: stockMovement.quantity,
          reason: stockMovement.reason,
          performedById: stockMovement.performedById,
          occurredAt: stockMovement.occurredAt,
        },
      });

      this.logger.timed("create", "Stock movement created", timer(), {
        id: created.id,
      });
      return this.toDomain(created);
    } catch (error) {
      this.logger.error("create", "Failed to create stock movement", error);
      throw error;
    }
  }

  async findById(id: string): Promise<StockMovement | null> {
    const stockMovement = await this.prisma.stockMovement.findUnique({
      where: { id },
    });

    return stockMovement ? this.toDomain(stockMovement) : null;
  }

  async findByAsset(assetId: string): Promise<StockMovement[]> {
    const stockMovements = await this.prisma.stockMovement.findMany({
      where: { assetId },
      orderBy: { occurredAt: "desc" },
    });

    return stockMovements.map((sm: PrismaStockMovement) => this.toDomain(sm));
  }

  async findByStockLocation(stockLocationId: string): Promise<StockMovement[]> {
    const stockMovements = await this.prisma.stockMovement.findMany({
      where: {
        OR: [
          { stockLocationFromId: stockLocationId },
          { stockLocationToId: stockLocationId },
        ],
      },
      orderBy: { occurredAt: "desc" },
    });

    return stockMovements.map((sm: PrismaStockMovement) => this.toDomain(sm));
  }

  async findByPerformedBy(userId: string): Promise<StockMovement[]> {
    const stockMovements = await this.prisma.stockMovement.findMany({
      where: { performedById: userId },
      orderBy: { occurredAt: "desc" },
    });

    return stockMovements.map((sm: PrismaStockMovement) => this.toDomain(sm));
  }

  async findByMovementType(
    movementType: StockMovementType,
  ): Promise<StockMovement[]> {
    const stockMovements = await this.prisma.stockMovement.findMany({
      where: { movementType: movementType as $Enums.StockMovementTypeEnum },
      orderBy: { occurredAt: "desc" },
    });

    return stockMovements.map((sm: PrismaStockMovement) => this.toDomain(sm));
  }

  async findByDateRange(
    startDate: Date,
    endDate: Date,
  ): Promise<StockMovement[]> {
    const stockMovements = await this.prisma.stockMovement.findMany({
      where: {
        occurredAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { occurredAt: "desc" },
    });

    return stockMovements.map((sm: PrismaStockMovement) => this.toDomain(sm));
  }

  async findAll(options?: {
    skip?: number;
    take?: number;
    orderBy?: "occurredAt" | "createdAt" | "movementType";
    order?: "asc" | "desc";
  }): Promise<StockMovement[]> {
    const stockMovements = await this.prisma.stockMovement.findMany({
      skip: options?.skip,
      take: options?.take,
      orderBy: options?.orderBy
        ? { [options.orderBy]: options.order ?? "desc" }
        : { occurredAt: "desc" },
    });

    return stockMovements.map((sm: PrismaStockMovement) => this.toDomain(sm));
  }

  async count(): Promise<number> {
    return await this.prisma.stockMovement.count();
  }

  async delete(id: string): Promise<void> {
    const timer = this.logger.startTimer();

    try {
      await this.prisma.stockMovement.delete({
        where: { id },
      });

      this.logger.timed("delete", "Stock movement deleted", timer(), { id });
    } catch (error) {
      this.logger.error("delete", "Failed to delete stock movement", error);
      throw error;
    }
  }

  private toDomain(prismaStockMovement: PrismaStockMovement): StockMovement {
    return StockMovement.reconstitute({
      id: prismaStockMovement.id,
      movementType: prismaStockMovement.movementType as StockMovementType,
      stockLocationFromId: prismaStockMovement.stockLocationFromId,
      stockLocationToId: prismaStockMovement.stockLocationToId,
      assetId: prismaStockMovement.assetId,
      quantity: prismaStockMovement.quantity,
      reason: prismaStockMovement.reason,
      performedById: prismaStockMovement.performedById,
      occurredAt: prismaStockMovement.occurredAt,
      createdAt: prismaStockMovement.createdAt,
    });
  }
}
