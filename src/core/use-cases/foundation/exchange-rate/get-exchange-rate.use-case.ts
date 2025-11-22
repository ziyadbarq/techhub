/**
 * Get Exchange Rate Use Case
 *
 * Business logic for retrieving a single exchange rate by currency.
 */

import { inject, injectable } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { ExchangeRate } from "@/core/domain/entities/exchange-rate.entity";
import type { IExchangeRateRepository } from "@/core/repositories/exchange-rate.repository.interface";

@injectable()
export class GetExchangeRateUseCase {
  constructor(
    @inject(DI_TOKENS.IExchangeRateRepository)
    private readonly exchangeRateRepository: IExchangeRateRepository,
  ) {}

  /**
   * Execute get exchange rate use case
   *
   * @param currency - Currency code (e.g., "USD", "EUR")
   * @param onlyActive - Whether to only retrieve active rates (default: true)
   * @returns Exchange rate if found
   * @throws Error if exchange rate not found
   */
  async execute(
    currency: string,
    onlyActive: boolean = true,
  ): Promise<ExchangeRate> {
    const exchangeRate = onlyActive
      ? await this.exchangeRateRepository.findActiveByCurrency(currency)
      : await this.exchangeRateRepository.findByCurrency(currency);

    if (!exchangeRate) {
      throw new Error(`Exchange rate for currency "${currency}" not found`);
    }

    return exchangeRate;
  }
}
