/**
 * Update StockLocation Use Case
 *
 * Business logic for updating an existing stock location.
 */

import { inject, injectable } from "inversify";
import { ConflictError } from "@/core/domain/errors/conflict.error";
import { DI_TOKENS } from "@/di/types";
import type { StockLocation } from "@/core/domain/entities/stock-location.entity";
import type { IStockLocationRepository } from "@/core/repositories/stock-location.repository.interface";
import { NotFoundError } from "@/core/domain/errors/not-found.error";

export interface UpdateStockLocationProps {
  id: string;
  name?: string;
  code?: string;
  locationId?: string | null;
  description?: string | null;
}

@injectable()
export class UpdateStockLocationUseCase {
  constructor(
    @inject(DI_TOKENS.IStockLocationRepository)
    private readonly stockLocationRepository: IStockLocationRepository,
  ) {}

  /**
   * Execute update stock location use case
   *
   * @param props - Update properties
   * @returns Updated stock location
   * @throws Error if stock location not found or duplicate code
   */
  async execute(props: UpdateStockLocationProps): Promise<StockLocation> {
    // Find existing stock location
    const stockLocation = await this.stockLocationRepository.findById(props.id);
    if (!stockLocation) {
      throw new NotFoundError(`Stock location with ID "${props.id}" not found`);
    }

    // Check for duplicate code if code is being changed
    if (props.code && props.code !== stockLocation.code) {
      const existsByCode = await this.stockLocationRepository.existsByCode(
        props.code,
        props.id,
      );
      if (existsByCode) {
        throw new ConflictError(
          `Stock location with code "${props.code}" already exists`,
        );
      }
    }

    // Update the stock location
    stockLocation.update({
      name: props.name,
      code: props.code,
      locationId: props.locationId,
      description: props.description,
    });

    return this.stockLocationRepository.update(stockLocation);
  }
}
