/**
 * Update Exchange Rate Use Case
 *
 * Business logic for updating an existing exchange rate.
 */

import { inject, injectable } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { ExchangeRate } from "@/core/domain/entities/exchange-rate.entity";
import type { IExchangeRateRepository } from "@/core/repositories/exchange-rate.repository.interface";

export interface UpdateExchangeRateProps {
  id: string;
  rateToSAR?: number;
  isActive?: boolean;
}

@injectable()
export class UpdateExchangeRateUseCase {
  constructor(
    @inject(DI_TOKENS.IExchangeRateRepository)
    private readonly exchangeRateRepository: IExchangeRateRepository,
  ) {}

  /**
   * Execute update exchange rate use case
   *
   * @param props - Exchange rate update properties
   * @returns Updated exchange rate
   * @throws Error if exchange rate not found
   */
  async execute(props: UpdateExchangeRateProps): Promise<ExchangeRate> {
    const exchangeRate = await this.exchangeRateRepository.findById(props.id);

    if (!exchangeRate) {
      throw new Error(`Exchange rate with ID "${props.id}" not found`);
    }

    // Update the exchange rate
    exchangeRate.update({
      rateToSAR: props.rateToSAR,
      isActive: props.isActive,
    });

    const updated = await this.exchangeRateRepository.update(exchangeRate);
    return updated;
  }
}
