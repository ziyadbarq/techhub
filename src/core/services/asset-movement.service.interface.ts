/**
 * Asset Movement Service Interface
 * Centralized service for creating stock movements during asset lifecycle events
 */

import type {
  StockMovement,
  StockMovementType,
  StockMovementSource,
} from "../domain/entities/stock-movement.entity";
import type { PrismaClient } from "@/generated/prisma/server";

export interface CreateMovementParams {
  movementType: StockMovementType;
  assetId: string;
  stockLocationFromId?: string | null;
  stockLocationToId?: string | null;
  quantity?: number;
  reason?: string;
  performedById: string;
  source: StockMovementSource;
  sourceReferenceType?: string;
  sourceReferenceId?: string;
}

export interface SyncAssetLocationParams {
  assetId: string;
  oldLocationId: string | null;
  newLocationId: string | null;
  performedById: string;
  source: StockMovementSource;
  sourceReferenceType?: string;
  sourceReferenceId?: string;
  reason?: string;
}

export interface SyncAssetLocationResult {
  movement: StockMovement | null;
  movementType: StockMovementType | null;
}

/**
 * Transaction client type for Prisma transactions
 * Used when movement creation needs to be part of a larger transaction
 */
export type TransactionClient = Parameters<
  Parameters<PrismaClient["$transaction"]>[0]
>[0];

export interface IAssetMovementService {
  /**
   * Create a movement with source tracking
   */
  createMovement(params: CreateMovementParams): Promise<StockMovement>;

  /**
   * Create a movement within an existing transaction
   * Use this when movement creation needs to be atomic with other operations
   */
  createMovementTx(
    tx: TransactionClient,
    params: CreateMovementParams,
  ): Promise<StockMovement>;

  /**
   * Sync asset location with automatic movement creation
   * Determines movement type (IN/OUT/TRANSFER) based on old vs new location:
   * - null → location = IN movement
   * - location → null = OUT movement
   * - locationA → locationB = TRANSFER movement
   * - same location or both null = no movement
   */
  syncAssetLocation(
    params: SyncAssetLocationParams,
  ): Promise<SyncAssetLocationResult>;

  /**
   * Record asset received into stock (IN movement)
   */
  recordAssetReceived(params: {
    assetId: string;
    stockLocationId: string;
    performedById: string;
    reason?: string;
    source: StockMovementSource;
    sourceReferenceType?: string;
    sourceReferenceId?: string;
  }): Promise<StockMovement>;

  /**
   * Record asset issued from stock (OUT movement)
   */
  recordAssetIssued(params: {
    assetId: string;
    stockLocationId: string;
    performedById: string;
    reason?: string;
    source: StockMovementSource;
    sourceReferenceType?: string;
    sourceReferenceId?: string;
  }): Promise<StockMovement>;

  /**
   * Record asset transferred between locations (TRANSFER movement)
   */
  recordAssetTransferred(params: {
    assetId: string;
    fromLocationId: string;
    toLocationId: string;
    performedById: string;
    reason?: string;
    source: StockMovementSource;
    sourceReferenceType?: string;
    sourceReferenceId?: string;
  }): Promise<StockMovement>;
}
