/**
 * StockMovement Presenter
 * Transforms StockMovement domain entities to DTOs for presentation layer
 */

import type { StockMovement } from "@/core/domain/entities/stock-movement.entity";

export interface StockMovementDTO {
  id: string;
  movementType: string;
  stockLocationFromId: string | null;
  stockLocationToId: string | null;
  assetId: string | null;
  quantity: number;
  reason: string | null;
  performedById: string;
  occurredAt: string;
  createdAt: string;
  // Computed fields
  isReceiving: boolean;
  isIssuing: boolean;
  isTransfer: boolean;
  isAdjustment: boolean;
}

export function presentStockMovement(
  movement: StockMovement,
): StockMovementDTO {
  return {
    id: movement.id,
    movementType: movement.movementType,
    stockLocationFromId: movement.stockLocationFromId,
    stockLocationToId: movement.stockLocationToId,
    assetId: movement.assetId,
    quantity: movement.quantity,
    reason: movement.reason,
    performedById: movement.performedById,
    occurredAt: movement.occurredAt.toISOString(),
    createdAt: movement.createdAt.toISOString(),
    // Computed fields
    isReceiving: movement.isReceiving(),
    isIssuing: movement.isIssuing(),
    isTransfer: movement.isTransfer(),
    isAdjustment: movement.isAdjustment(),
  };
}

export function presentStockMovements(
  movements: StockMovement[],
): StockMovementDTO[] {
  return movements.map(presentStockMovement);
}
