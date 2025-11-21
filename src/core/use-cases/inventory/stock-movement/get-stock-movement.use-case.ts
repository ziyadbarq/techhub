/**
 * Get Stock Movement Use Case
 *
 * Business logic for retrieving a single stock movement by ID.
 */

import { inject, injectable } from "inversify";
import { DI_TOKENS } from "@/di/types";
import { NotFoundError } from "@/core/domain/errors/not-found.error";
import type { StockMovement } from "@/core/domain/entities/stock-movement.entity";
import type { IStockMovementRepository } from "@/core/repositories/stock-movement.repository.interface";

@injectable()
export class GetStockMovementUseCase {
  constructor(
    @inject(DI_TOKENS.IStockMovementRepository)
    private readonly stockMovementRepository: IStockMovementRepository,
  ) {}

  /**
   * Execute get stock movement use case
   *
   * @param id - Stock movement ID
   * @returns Stock movement
   * @throws NotFoundError if stock movement not found
   */
  async execute(id: string): Promise<StockMovement> {
    const stockMovement = await this.stockMovementRepository.findById(id);
    if (!stockMovement) {
      throw new NotFoundError("Stock movement not found", "StockMovement", id);
    }

    return stockMovement;
  }
}
