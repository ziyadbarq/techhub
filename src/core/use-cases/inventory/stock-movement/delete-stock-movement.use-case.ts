/**
 * Delete Stock Movement Use Case
 *
 * Business logic for deleting a stock movement.
 * WARNING: Deleting stock movements impacts audit trail.
 * This should only be used for corrections of erroneous entries.
 */

import { inject, injectable } from "inversify";
import { DI_TOKENS } from "@/di/types";
import { NotFoundError } from "@/core/domain/errors/not-found.error";
import type { IStockMovementRepository } from "@/core/repositories/stock-movement.repository.interface";

@injectable()
export class DeleteStockMovementUseCase {
  constructor(
    @inject(DI_TOKENS.IStockMovementRepository)
    private readonly stockMovementRepository: IStockMovementRepository,
  ) {}

  /**
   * Execute delete stock movement use case
   *
   * WARNING: This operation impacts audit trail.
   * Stock movements are typically immutable for audit purposes.
   * Only use for correcting erroneous entries.
   *
   * @param id - Stock movement ID to delete
   * @throws NotFoundError if stock movement not found
   */
  async execute(id: string): Promise<void> {
    // Check if exists
    const stockMovement = await this.stockMovementRepository.findById(id);
    if (!stockMovement) {
      throw new NotFoundError("Stock movement not found", "StockMovement", id);
    }

    // WARNING: Deleting impacts audit trail
    // Consider implementing soft delete or requiring special permissions
    await this.stockMovementRepository.delete(id);
  }
}
