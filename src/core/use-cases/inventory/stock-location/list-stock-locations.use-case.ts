/**
 * List StockLocations Use Case
 *
 * Retrieve all stock locations with optional filtering and pagination.
 */

import { inject, injectable } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { StockLocation } from "@/core/domain/entities/stock-location.entity";
import type { IStockLocationRepository } from "@/core/repositories/stock-location.repository.interface";

export interface ListStockLocationsOptions {
  skip?: number;
  take?: number;
  orderBy?: "name" | "code" | "createdAt";
  order?: "asc" | "desc";
}

@injectable()
export class ListStockLocationsUseCase {
  constructor(
    @inject(DI_TOKENS.IStockLocationRepository)
    private readonly stockLocationRepository: IStockLocationRepository,
  ) {}

  /**
   * Execute list stock locations use case
   *
   * @param options - Query options
   * @returns List of stock locations
   */
  async execute(options?: ListStockLocationsOptions): Promise<StockLocation[]> {
    return this.stockLocationRepository.findAll({
      skip: options?.skip,
      take: options?.take,
      orderBy: options?.orderBy,
      order: options?.order,
    });
  }
}
