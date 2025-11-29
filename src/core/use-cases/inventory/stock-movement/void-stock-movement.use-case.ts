/**
 * Void Stock Movement Use Case
 *
 * Business logic for voiding a stock movement.
 * Replaces delete functionality to preserve audit trail.
 */

import { inject, injectable } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { StockMovement } from "@/core/domain/entities/stock-movement.entity";
import type { IStockMovementRepository } from "@/core/repositories/stock-movement.repository.interface";
import { NotFoundError } from "@/core/domain/errors";

export interface VoidStockMovementProps {
  id: string;
  voidedById: string;
  voidReason: string;
}

@injectable()
export class VoidStockMovementUseCase {
  constructor(
    @inject(DI_TOKENS.IStockMovementRepository)
    private readonly stockMovementRepository: IStockMovementRepository,
  ) {}

  /**
   * Execute void stock movement use case
   *
   * @param props - Void properties including ID, voided by, and reason
   * @returns Voided stock movement
   * @throws NotFoundError if movement not found
   * @throws Error if movement is already voided or validation fails
   */
  async execute(props: VoidStockMovementProps): Promise<StockMovement> {
    // Validate void reason
    if (!props.voidReason || props.voidReason.trim().length === 0) {
      throw new Error("Void reason is required");
    }

    // Find the movement
    const movement = await this.stockMovementRepository.findById(props.id);
    if (!movement) {
      throw new NotFoundError(
        "Stock movement not found",
        "StockMovement",
        props.id,
      );
    }

    // Check if already voided
    if (movement.isVoided()) {
      throw new Error("Stock movement is already voided");
    }

    // Void the movement (entity method validates and sets properties)
    movement.void(props.voidedById, props.voidReason);

    // Persist the change
    const updated = await this.stockMovementRepository.update(movement);

    return updated;
  }
}
