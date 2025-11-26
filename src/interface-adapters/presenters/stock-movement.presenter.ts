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
  // Display fields (enriched from relations)
  stockLocationFromName?: string | null;
  stockLocationToName?: string | null;
  assetTag?: string | null;
  performedByName?: string | null;
}

export function presentStockMovement(
  movement: StockMovement,
  enrichment?: {
    stockLocationFromName?: string | null;
    stockLocationToName?: string | null;
    assetTag?: string | null;
    performedByName?: string | null;
  },
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
    // Display fields
    stockLocationFromName: enrichment?.stockLocationFromName,
    stockLocationToName: enrichment?.stockLocationToName,
    assetTag: enrichment?.assetTag,
    performedByName: enrichment?.performedByName,
  };
}

export interface StockMovementEnrichment {
  stockLocationFromName?: string | null;
  stockLocationToName?: string | null;
  assetTag?: string | null;
  performedByName?: string | null;
}

export function presentStockMovements(
  movements: StockMovement[],
  enrichmentMap?: Map<string, StockMovementEnrichment>,
): StockMovementDTO[] {
  return movements.map((movement) =>
    presentStockMovement(movement, enrichmentMap?.get(movement.id)),
  );
}
