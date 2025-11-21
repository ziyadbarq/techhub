/**
 * Get StockLocation Use Case
 *
 * Retrieve a single stock location by ID.
 */

import { inject, injectable } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { StockLocation } from "@/core/domain/entities/stock-location.entity";
import type { IStockLocationRepository } from "@/core/repositories/stock-location.repository.interface";

@injectable()
export class GetStockLocationUseCase {
  constructor(
    @inject(DI_TOKENS.IStockLocationRepository)
    private readonly stockLocationRepository: IStockLocationRepository,
  ) {}

  /**
   * Execute get stock location use case
   *
   * @param id - StockLocation ID
   * @returns StockLocation or null if not found
   */
  async execute(id: string): Promise<StockLocation | null> {
    return this.stockLocationRepository.findById(id);
  }
}
