/**
 * Asset Movement Service Implementation
 * Centralized service for creating stock movements during asset lifecycle events
 */

import { inject, injectable } from "inversify";
import type { PrismaClient, $Enums } from "@/generated/prisma/server";

import { DI_TOKENS } from "@/di/types";
import type { ILoggerService } from "@/core/services/logger.service.interface";
import type { IStockMovementRepository } from "@/core/repositories/stock-movement.repository.interface";
import {
  StockMovement,
  type StockMovementType,
  type StockMovementSource,
} from "@/core/domain/entities/stock-movement.entity";
import type {
  IAssetMovementService,
  CreateMovementParams,
  SyncAssetLocationParams,
  SyncAssetLocationResult,
  TransactionClient,
} from "@/core/services/asset-movement.service.interface";

@injectable()
export class AssetMovementService implements IAssetMovementService {
  constructor(
    @inject(DI_TOKENS.IStockMovementRepository)
    private readonly stockMovementRepository: IStockMovementRepository,
    @inject(DI_TOKENS.PrismaClient)
    private readonly prisma: PrismaClient,
    @inject(DI_TOKENS.ILoggerService)
    private readonly logger: ILoggerService,
  ) {}

  async createMovement(params: CreateMovementParams): Promise<StockMovement> {
    this.logger.debug("Creating stock movement", {
      movementType: params.movementType,
      assetId: params.assetId,
      source: params.source,
    });

    const movement = StockMovement.create({
      movementType: params.movementType,
      assetId: params.assetId,
      stockLocationFromId: params.stockLocationFromId,
      stockLocationToId: params.stockLocationToId,
      quantity: params.quantity || 1,
      reason: params.reason,
      performedById: params.performedById,
      source: params.source,
      sourceReferenceType: params.sourceReferenceType,
      sourceReferenceId: params.sourceReferenceId,
    });

    const created = await this.stockMovementRepository.create(movement);

    this.logger.info("Stock movement created", {
      id: created.id,
      movementType: params.movementType,
      assetId: params.assetId,
      source: params.source,
    });

    return created;
  }

  async createMovementTx(
    tx: TransactionClient,
    params: CreateMovementParams,
  ): Promise<StockMovement> {
    this.logger.debug("Creating stock movement in transaction", {
      movementType: params.movementType,
      assetId: params.assetId,
      source: params.source,
    });

    const created = await tx.stockMovement.create({
      data: {
        movementType: params.movementType as $Enums.StockMovementTypeEnum,
        assetId: params.assetId,
        stockLocationFromId: params.stockLocationFromId,
        stockLocationToId: params.stockLocationToId,
        quantity: params.quantity || 1,
        reason: params.reason,
        performedById: params.performedById,
        source: params.source as $Enums.StockMovementSourceEnum,
        sourceReferenceType: params.sourceReferenceType,
        sourceReferenceId: params.sourceReferenceId,
        status: "ACTIVE",
      },
    });

    this.logger.info("Stock movement created in transaction", {
      id: created.id,
      movementType: params.movementType,
      assetId: params.assetId,
      source: params.source,
    });

    // Reconstitute as domain entity
    return StockMovement.reconstitute({
      id: created.id,
      movementType: created.movementType as StockMovementType,
      stockLocationFromId: created.stockLocationFromId,
      stockLocationToId: created.stockLocationToId,
      assetId: created.assetId,
      quantity: created.quantity,
      reason: created.reason,
      performedById: created.performedById,
      occurredAt: created.occurredAt,
      createdAt: created.createdAt,
      status: created.status as "ACTIVE" | "VOIDED",
      voidedAt: created.voidedAt,
      voidedById: created.voidedById,
      voidReason: created.voidReason,
      source: created.source as StockMovementSource,
      sourceReferenceType: created.sourceReferenceType,
      sourceReferenceId: created.sourceReferenceId,
    });
  }

  async syncAssetLocation(
    params: SyncAssetLocationParams,
  ): Promise<SyncAssetLocationResult> {
    const { oldLocationId, newLocationId } = params;

    // Determine movement type based on location change
    let movementType: StockMovementType | null = null;
    let stockLocationFromId: string | null = null;
    let stockLocationToId: string | null = null;

    if (!oldLocationId && newLocationId) {
      // null → location = IN movement (receiving into stock)
      movementType = "IN";
      stockLocationToId = newLocationId;
    } else if (oldLocationId && !newLocationId) {
      // location → null = OUT movement (issuing from stock)
      movementType = "OUT";
      stockLocationFromId = oldLocationId;
    } else if (
      oldLocationId &&
      newLocationId &&
      oldLocationId !== newLocationId
    ) {
      // locationA → locationB = TRANSFER movement
      movementType = "TRANSFER";
      stockLocationFromId = oldLocationId;
      stockLocationToId = newLocationId;
    }
    // If same location or both null, no movement needed

    if (!movementType) {
      this.logger.debug("No movement needed - location unchanged", {
        assetId: params.assetId,
        oldLocationId,
        newLocationId,
      });
      return { movement: null, movementType: null };
    }

    const movement = await this.createMovement({
      movementType,
      assetId: params.assetId,
      stockLocationFromId,
      stockLocationToId,
      performedById: params.performedById,
      reason: params.reason || this.getDefaultReason(movementType),
      source: params.source,
      sourceReferenceType: params.sourceReferenceType,
      sourceReferenceId: params.sourceReferenceId,
    });

    return { movement, movementType };
  }

  async recordAssetReceived(params: {
    assetId: string;
    stockLocationId: string;
    performedById: string;
    reason?: string;
    source: StockMovementSource;
    sourceReferenceType?: string;
    sourceReferenceId?: string;
  }): Promise<StockMovement> {
    return this.createMovement({
      movementType: "IN",
      assetId: params.assetId,
      stockLocationToId: params.stockLocationId,
      performedById: params.performedById,
      reason: params.reason || "Asset received into stock",
      source: params.source,
      sourceReferenceType: params.sourceReferenceType,
      sourceReferenceId: params.sourceReferenceId,
    });
  }

  async recordAssetIssued(params: {
    assetId: string;
    stockLocationId: string;
    performedById: string;
    reason?: string;
    source: StockMovementSource;
    sourceReferenceType?: string;
    sourceReferenceId?: string;
  }): Promise<StockMovement> {
    return this.createMovement({
      movementType: "OUT",
      assetId: params.assetId,
      stockLocationFromId: params.stockLocationId,
      performedById: params.performedById,
      reason: params.reason || "Asset issued from stock",
      source: params.source,
      sourceReferenceType: params.sourceReferenceType,
      sourceReferenceId: params.sourceReferenceId,
    });
  }

  async recordAssetTransferred(params: {
    assetId: string;
    fromLocationId: string;
    toLocationId: string;
    performedById: string;
    reason?: string;
    source: StockMovementSource;
    sourceReferenceType?: string;
    sourceReferenceId?: string;
  }): Promise<StockMovement> {
    return this.createMovement({
      movementType: "TRANSFER",
      assetId: params.assetId,
      stockLocationFromId: params.fromLocationId,
      stockLocationToId: params.toLocationId,
      performedById: params.performedById,
      reason: params.reason || "Asset transferred between locations",
      source: params.source,
      sourceReferenceType: params.sourceReferenceType,
      sourceReferenceId: params.sourceReferenceId,
    });
  }

  private getDefaultReason(movementType: StockMovementType): string {
    switch (movementType) {
      case "IN":
        return "Location assigned";
      case "OUT":
        return "Location removed";
      case "TRANSFER":
        return "Location changed";
      case "ADJUSTMENT":
        return "Stock adjustment";
      default:
        return "Stock movement";
    }
  }
}
