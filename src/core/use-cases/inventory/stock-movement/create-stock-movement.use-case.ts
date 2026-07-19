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
import type { IUnitOfWork } from "@/core/services/unit-of-work.service.interface";
import { ValidationError } from "@/core/domain/errors/validation.error";

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
    @inject(DI_TOKENS.IUnitOfWork)
    private readonly unitOfWork: IUnitOfWork,
  ) {}

  /**
   * Execute create stock movement use case
   *
   * @param props - Stock movement creation properties
   * @returns Created stock movement
   * @throws Error if validation fails (entity validates movement type logic)
   * @throws ValidationError if an OUT/TRANSFER movement exceeds the quantity
   *         available at the source location
   */
  async execute(props: CreateStockMovementProps): Promise<StockMovement> {
    // Entity validates movement type logic in create method
    // IN: requires destination, no source
    // OUT: requires source, no destination
    // TRANSFER: requires both source and destination (must be different)
    // ADJUSTMENT: flexible (can have from, to, or both)
    const stockMovement = StockMovement.create(props);

    // Outbound movements must not exceed the source location's balance.
    // The availability check and the insert run in one transaction with a
    // row lock on the source location, so two concurrent movements cannot
    // both pass the check and drive the balance negative. ADJUSTMENT is
    // exempt: it exists to correct the ledger, including below-zero states.
    const drawsFromLocation =
      (props.movementType === "OUT" || props.movementType === "TRANSFER") &&
      props.stockLocationFromId;

    if (!drawsFromLocation) {
      return this.stockMovementRepository.create(stockMovement);
    }

    return this.unitOfWork.execute(async () => {
      const available =
        await this.stockMovementRepository.getNetQuantityAtLocation(
          props.stockLocationFromId as string,
        );
      const requested = props.quantity ?? 1;

      if (available < requested) {
        throw new ValidationError(
          `Insufficient stock at source location: ${available} available, ${requested} requested`,
        );
      }

      return this.stockMovementRepository.create(stockMovement);
    });
  }
}
