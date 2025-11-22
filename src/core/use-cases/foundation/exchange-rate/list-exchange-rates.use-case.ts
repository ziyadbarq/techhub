/**
 * List Exchange Rates Use Case
 *
 * Business logic for listing all exchange rates.
 */

import { inject, injectable } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { ExchangeRate } from "@/core/domain/entities/exchange-rate.entity";
import type { IExchangeRateRepository } from "@/core/repositories/exchange-rate.repository.interface";

export interface ListExchangeRatesOptions {
  onlyActive?: boolean;
  orderBy?: "currency" | "createdAt";
  order?: "asc" | "desc";
}

@injectable()
export class ListExchangeRatesUseCase {
  constructor(
    @inject(DI_TOKENS.IExchangeRateRepository)
    private readonly exchangeRateRepository: IExchangeRateRepository,
  ) {}

  /**
   * Execute list exchange rates use case
   *
   * @param options - Filtering and sorting options
   * @returns List of exchange rates
   */
  async execute(options?: ListExchangeRatesOptions): Promise<ExchangeRate[]> {
    const exchangeRates = await this.exchangeRateRepository.findAll(options);
    return exchangeRates;
  }
}
