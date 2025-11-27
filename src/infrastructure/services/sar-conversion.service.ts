/**
 * SAR Conversion Service Implementation
 *
 * Provides reusable SAR conversion logic for all entities with monetary fields.
 * Uses the ExchangeRate repository to look up active exchange rates.
 *
 * Features:
 * - Graceful null handling (returns null if conversion not possible)
 * - SAR pass-through (no conversion needed for SAR amounts)
 * - Uses active exchange rates only
 * - Singleton scope for efficiency
 */

import { inject, injectable } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { IExchangeRateRepository } from "@/core/repositories/exchange-rate.repository.interface";
import type {
  ISarConversionService,
  SarRecalculationResult,
} from "@/core/services/sar-conversion.service.interface";

@injectable()
export class SarConversionService implements ISarConversionService {
  constructor(
    @inject(DI_TOKENS.IExchangeRateRepository)
    private readonly exchangeRateRepository: IExchangeRateRepository,
  ) {}

  /**
   * Convert an amount to SAR if conversion is possible
   */
  async convertToSarIfNeeded(
    amount: number | null | undefined,
    currency: string | null | undefined,
  ): Promise<number | null> {
    // Guard: No amount to convert
    if (amount === null || amount === undefined) {
      return null;
    }

    // Guard: No currency specified
    if (!currency) {
      return null;
    }

    const upperCurrency = currency.toUpperCase();

    // Already SAR - no conversion needed
    if (upperCurrency === "SAR") {
      return amount;
    }

    // Find active exchange rate
    const exchangeRate =
      await this.exchangeRateRepository.findActiveByCurrency(upperCurrency);

    // No exchange rate found - return null (not an error, per requirements)
    if (!exchangeRate) {
      return null;
    }

    // Convert using exchange rate
    return exchangeRate.convertToSAR(amount);
  }

  /**
   * Determine if SAR recalculation is needed based on field changes
   */
  shouldRecalculateSar(
    changes: { amount?: number | null; currency?: string | null },
    currentAmount: number | null,
    currentCurrency: string | null,
  ): SarRecalculationResult {
    const amountChanged = changes.amount !== undefined;
    const currencyChanged = changes.currency !== undefined;

    // No monetary field changed - no recalculation needed
    if (!amountChanged && !currencyChanged) {
      return {
        needsConversion: false,
        amount: currentAmount,
        currency: currentCurrency,
      };
    }

    // Determine final values after update
    const finalAmount = amountChanged
      ? (changes.amount ?? null)
      : currentAmount;
    const finalCurrency = currencyChanged
      ? (changes.currency ?? null)
      : currentCurrency;

    return {
      needsConversion: true,
      amount: finalAmount,
      currency: finalCurrency,
    };
  }
}
