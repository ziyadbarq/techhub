/**
 * Create Exchange Rate Use Case
 *
 * Business logic for creating a new exchange rate.
 */

import { inject, injectable } from "inversify";
import { ConflictError } from "@/core/domain/errors/conflict.error";
import { DI_TOKENS } from "@/di/types";
import { ExchangeRate } from "@/core/domain/entities/exchange-rate.entity";
import type { IExchangeRateRepository } from "@/core/repositories/exchange-rate.repository.interface";
import type { IIdGenerator } from "@/core/services/id-generator.service.interface";

export interface CreateExchangeRateProps {
  currency: string;
  rateToSAR: number;
  isActive?: boolean;
}

@injectable()
export class CreateExchangeRateUseCase {
  constructor(
    @inject(DI_TOKENS.IExchangeRateRepository)
    private readonly exchangeRateRepository: IExchangeRateRepository,

    @inject(DI_TOKENS.IIdGenerator)
    private readonly idGenerator: IIdGenerator,
  ) {}

  /**
   * Execute create exchange rate use case
   *
   * @param props - Exchange rate creation properties
   * @returns Created exchange rate
   * @throws Error if currency already exists
   */
  async execute(props: CreateExchangeRateProps): Promise<ExchangeRate> {
    // Check for duplicate currency
    const existingRate = await this.exchangeRateRepository.findByCurrency(
      props.currency,
    );
    if (existingRate) {
      throw new ConflictError(
        `Exchange rate for currency "${props.currency}" already exists`,
      );
    }

    const exchangeRate = ExchangeRate.create(props);
    const created = await this.exchangeRateRepository.create(exchangeRate);
    return created;
  }
}
