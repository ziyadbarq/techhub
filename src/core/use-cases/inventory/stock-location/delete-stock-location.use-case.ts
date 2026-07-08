/**
 * Delete StockLocation Use Case
 *
 * Business logic for deleting a stock location.
 */

import { inject, injectable } from "inversify";
import { ValidationError } from "@/core/domain/errors/validation.error";
import { DI_TOKENS } from "@/di/types";
import type { IStockLocationRepository } from "@/core/repositories/stock-location.repository.interface";
import { NotFoundError } from "@/core/domain/errors/not-found.error";

@injectable()
export class DeleteStockLocationUseCase {
  constructor(
    @inject(DI_TOKENS.IStockLocationRepository)
    private readonly stockLocationRepository: IStockLocationRepository,
  ) {}

  /**
   * Execute delete stock location use case
   *
   * @param id - StockLocation ID
   * @throws Error if stock location not found or cannot be deleted
   */
  async execute(id: string): Promise<void> {
    // Find existing stock location
    const stockLocation = await this.stockLocationRepository.findById(id);
    if (!stockLocation) {
      throw new NotFoundError(`Stock location with ID "${id}" not found`);
    }

    // Check if can be deleted (no assets or stock movements)
    const hasAssets = await this.stockLocationRepository.hasAssets(id);
    const hasMovements = await this.stockLocationRepository.hasMovements(id);

    if (!stockLocation.canBeDeleted(hasAssets, hasMovements)) {
      const reasons = [];
      if (hasAssets) reasons.push("assets");
      if (hasMovements) reasons.push("stock movements");

      throw new ValidationError(
        `Cannot delete stock location "${stockLocation.name}" because it has ${reasons.join(" and ")}. Remove them first.`,
      );
    }

    await this.stockLocationRepository.delete(id);
  }
}
