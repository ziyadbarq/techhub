/**
 * useExchangeRates Hook
 *
 * Reusable hook for fetching exchange rates and calculating SAR conversions.
 * Eliminates ~70 lines of boilerplate per table component.
 *
 * @example
 * ```tsx
 * const { calculateSARAmount, isLoading } = useExchangeRates();
 *
 * // In column cell
 * const { sarAmount, exchangeRate } = calculateSARAmount(cost, currency);
 * <CurrencyDisplay
 *   amount={cost}
 *   currency={currency}
 *   sarAmount={sarAmount}
 *   exchangeRate={exchangeRate}
 * />
 * ```
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { listExchangeRatesAction } from "@/interface-adapters/controllers/exchange-rate.controller";
import type { ExchangeRateResponseDTO } from "@/interface-adapters/presenters/exchange-rate.presenter";

export interface SARConversionResult {
  /** Amount in SAR (if conversion successful) */
  sarAmount?: number;
  /** Exchange rate used for conversion */
  exchangeRate?: number;
}

export interface UseExchangeRatesReturn {
  /** Map of currency code to exchange rate data */
  exchangeRates: Map<string, ExchangeRateResponseDTO>;
  /** Whether rates are currently loading */
  isLoading: boolean;
  /** Calculate SAR amount from given amount and currency */
  calculateSARAmount: (amount: number, currency: string) => SARConversionResult;
}

/**
 * Hook for fetching and using exchange rates
 */
export function useExchangeRates(): UseExchangeRatesReturn {
  const [exchangeRates, setExchangeRates] = useState<
    Map<string, ExchangeRateResponseDTO>
  >(new Map());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchExchangeRates() {
      try {
        const result = await listExchangeRatesAction({ onlyActive: true });
        if (result.success && result.data) {
          const ratesMap = new Map<string, ExchangeRateResponseDTO>();
          result.data.forEach((rate) => {
            ratesMap.set(rate.currency, rate);
          });
          setExchangeRates(ratesMap);
        }
      } catch (error) {
        // Silently fail - tables will display single currency only
        console.error("Failed to fetch exchange rates:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchExchangeRates();
  }, []);

  const calculateSARAmount = useCallback(
    (amount: number, currency: string): SARConversionResult => {
      // If already in SAR, no conversion needed
      if (currency === "SAR") {
        return { sarAmount: amount, exchangeRate: 1.0 };
      }

      // Get exchange rate for the currency
      const rate = exchangeRates.get(currency);
      if (!rate) {
        return {}; // No conversion available
      }

      // Calculate SAR amount
      const sarAmount = amount * rate.rateToSAR;
      return { sarAmount, exchangeRate: rate.rateToSAR };
    },
    [exchangeRates],
  );

  return {
    exchangeRates,
    isLoading,
    calculateSARAmount,
  };
}
