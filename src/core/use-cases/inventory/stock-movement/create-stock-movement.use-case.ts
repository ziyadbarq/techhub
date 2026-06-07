/**
 * Create Stock Movement Use Case
 *
 * Business logic for creating a new stock movement.
 * Validates movement logic based on type (IN, OUT, TRANSFER, ADJUSTMENT).
 */

import { inject, injectable } from "inversify";
import { DI_TOKENS } from "@/di/types";
import {
  StockMovement,
  type StockMovementSource,
  type StockMovementType,
} from "@/core/domain/entities/stock-movement.entity";
import type { IStockMovementRepository } from "@/core/repositories/stock-movement.repository.interface";

export interface CreateStockMovementProps {
  movementType: StockMovementType;
  stockLocationFromId?: string | null;
  stockLocationToId?: string | null;
  assetId?: string | null;
  quantity?: number;
  reason?: string | null;
  performedById: string;
  occurredAt?: Date;
  source?: StockMovementSource;
  sourceReferenceType?: string | null;
  sourceReferenceId?: string | null;
}

@injectable()
export class CreateStockMovementUseCase {
  constructor(
    @inject(DI_TOKENS.IStockMovementRepository)
    private readonly stockMovementRepository: IStockMovementRepository,
  ) {}

  /**
   * Execute create stock movement use case
   *
   * @param props - Stock movement creation properties
   * @returns Created stock movement
   * @throws Error if validation fails (entity validates movement type logic)
   */
  async execute(props: CreateStockMovementProps): Promise<StockMovement> {
    // Entity validates movement type logic in create method
    // IN: requires destination, no source
    // OUT: requires source, no destination
    // TRANSFER: requires both source and destination (must be different)
    // ADJUSTMENT: flexible (can have from, to, or both)
    const stockMovement = StockMovement.create(props);
    const created = await this.stockMovementRepository.create(stockMovement);
    return created;
  }
}
