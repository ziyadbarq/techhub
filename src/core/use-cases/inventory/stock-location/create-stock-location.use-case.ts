/**
 * Create StockLocation Use Case
 *
 * Business logic for creating a new stock location.
 */

import { inject, injectable } from "inversify";
import { DI_TOKENS } from "@/di/types";
import { StockLocation } from "@/core/domain/entities/stock-location.entity";
import type { IStockLocationRepository } from "@/core/repositories/stock-location.repository.interface";
import type { ICodeGeneratorService } from "@/core/services/code-generator.service.interface";

export interface CreateStockLocationProps {
  name: string;
  code?: string;
  locationId?: string | null;
  description?: string | null;
}

@injectable()
export class CreateStockLocationUseCase {
  constructor(
    @inject(DI_TOKENS.IStockLocationRepository)
    private readonly stockLocationRepository: IStockLocationRepository,
    @inject(DI_TOKENS.ICodeGeneratorService)
    private readonly codeGenerator: ICodeGeneratorService,
  ) {}

  /**
   * Execute create stock location use case
   *
   * @param props - StockLocation creation properties
   * @returns Created stock location
   * @throws Error if code already exists
   */
  async execute(props: CreateStockLocationProps): Promise<StockLocation> {
    // Auto-generate code if not provided
    const code =
      props.code ??
      (await this.codeGenerator.generateCode("STOCK_LOCATION", "STOCK"));

    // Check for duplicate code
    const existsByCode = await this.stockLocationRepository.existsByCode(code);
    if (existsByCode) {
      throw new Error(`Stock location with code "${code}" already exists`);
    }

    const stockLocation = StockLocation.create({ ...props, code });
    const created = await this.stockLocationRepository.create(stockLocation);
    return created;
  }
}
