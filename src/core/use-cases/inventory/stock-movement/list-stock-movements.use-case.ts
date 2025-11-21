/**
 * List Stock Movements Use Case
 *
 * Business logic for listing stock movements with optional filtering.
 * Supports filtering by asset, location, type, and date range.
 */

import { inject, injectable } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type {
  StockMovement,
  StockMovementType,
} from "@/core/domain/entities/stock-movement.entity";
import type { IStockMovementRepository } from "@/core/repositories/stock-movement.repository.interface";

export interface ListStockMovementsOptions {
  skip?: number;
  take?: number;
  orderBy?: "occurredAt" | "createdAt" | "movementType";
  order?: "asc" | "desc";
  assetId?: string;
  stockLocationId?: string;
  performedById?: string;
  movementType?: StockMovementType;
  startDate?: Date;
  endDate?: Date;
}

@injectable()
export class ListStockMovementsUseCase {
  constructor(
    @inject(DI_TOKENS.IStockMovementRepository)
    private readonly stockMovementRepository: IStockMovementRepository,
  ) {}

  /**
   * Execute list stock movements use case
   *
   * @param options - Optional filter options
   * @returns Array of stock movements
   */
  async execute(options?: ListStockMovementsOptions): Promise<StockMovement[]> {
    // Filter by asset
    if (options?.assetId) {
      return await this.stockMovementRepository.findByAsset(options.assetId);
    }

    // Filter by stock location
    if (options?.stockLocationId) {
      return await this.stockMovementRepository.findByStockLocation(
        options.stockLocationId,
      );
    }

    // Filter by performed by user
    if (options?.performedById) {
      return await this.stockMovementRepository.findByPerformedBy(
        options.performedById,
      );
    }

    // Filter by movement type
    if (options?.movementType) {
      return await this.stockMovementRepository.findByMovementType(
        options.movementType,
      );
    }

    // Filter by date range
    if (options?.startDate && options?.endDate) {
      return await this.stockMovementRepository.findByDateRange(
        options.startDate,
        options.endDate,
      );
    }

    // Default: find all with pagination/sorting
    return await this.stockMovementRepository.findAll(options);
  }
}
