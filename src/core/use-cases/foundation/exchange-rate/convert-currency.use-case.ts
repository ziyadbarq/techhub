/**
 * Convert Currency Use Case
 *
 * Business logic for converting an amount from a given currency to SAR.
 */

import { inject, injectable } from "inversify";
import { ValidationError } from "@/core/domain/errors/validation.error";
import { DI_TOKENS } from "@/di/types";
import type { IExchangeRateRepository } from "@/core/repositories/exchange-rate.repository.interface";

export interface ConvertCurrencyProps {
  amount: number;
  fromCurrency: string;
}

export interface ConvertCurrencyResult {
  originalAmount: number;
  originalCurrency: string;
  convertedAmount: number;
  convertedCurrency: string; // Always "SAR"
  exchangeRate: number;
}

@injectable()
export class ConvertCurrencyUseCase {
  constructor(
    @inject(DI_TOKENS.IExchangeRateRepository)
    private readonly exchangeRateRepository: IExchangeRateRepository,
  ) {}

  /**
   * Execute convert currency use case
   *
   * @param props - Amount and source currency
   * @returns Conversion result with SAR amount
   * @throws Error if exchange rate not found
   */
  async execute(props: ConvertCurrencyProps): Promise<ConvertCurrencyResult> {
    // If already in SAR, no conversion needed
    if (props.fromCurrency.toUpperCase() === "SAR") {
      return {
        originalAmount: props.amount,
        originalCurrency: "SAR",
        convertedAmount: props.amount,
        convertedCurrency: "SAR",
        exchangeRate: 1.0,
      };
    }

    // Find active exchange rate
    const exchangeRate = await this.exchangeRateRepository.findActiveByCurrency(
      props.fromCurrency,
    );

    if (!exchangeRate) {
      throw new ValidationError(
        `Active exchange rate for currency "${props.fromCurrency}" not found`,
      );
    }

    // Convert to SAR using the exchange rate
    const convertedAmount = exchangeRate.convertToSAR(props.amount);

    return {
      originalAmount: props.amount,
      originalCurrency: exchangeRate.currency,
      convertedAmount,
      convertedCurrency: "SAR",
      exchangeRate: exchangeRate.rateToSAR,
    };
  }
}
