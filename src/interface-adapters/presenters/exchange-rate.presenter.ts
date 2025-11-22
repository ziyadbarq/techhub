/**
 * Exchange Rate Presenter
 * Transforms ExchangeRate domain entities into DTOs for the UI layer
 */

import type { ExchangeRate } from "@/core/domain/entities/exchange-rate.entity";
import type { ConvertCurrencyResult } from "@/core/use-cases/foundation/exchange-rate/convert-currency.use-case";
import type {
  ExchangeRateResponseDTO,
  ConvertCurrencyResponseDTO,
} from "@/interface-adapters/dtos/generated/exchange-rate.dto";

// Re-export types for controller usage
export type {
  ExchangeRateResponseDTO,
  ConvertCurrencyResponseDTO,
} from "@/interface-adapters/dtos/generated/exchange-rate.dto";

export function presentExchangeRate(
  exchangeRate: ExchangeRate,
): ExchangeRateResponseDTO {
  return {
    id: exchangeRate.id,
    currency: exchangeRate.currency,
    rateToSAR: exchangeRate.rateToSAR,
    isActive: exchangeRate.isActive,
    createdAt: exchangeRate.createdAt,
    updatedAt: exchangeRate.updatedAt,
  };
}

export function presentExchangeRates(
  exchangeRates: ExchangeRate[],
): ExchangeRateResponseDTO[] {
  return exchangeRates.map(presentExchangeRate);
}

export function presentConvertCurrencyResult(
  result: ConvertCurrencyResult,
): ConvertCurrencyResponseDTO {
  return {
    originalAmount: result.originalAmount,
    originalCurrency: result.originalCurrency,
    convertedAmount: result.convertedAmount,
    convertedCurrency: result.convertedCurrency,
    exchangeRate: result.exchangeRate,
  };
}
