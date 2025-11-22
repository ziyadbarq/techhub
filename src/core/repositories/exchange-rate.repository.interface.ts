/**
 * IExchangeRateRepository Interface
 * Data access contract for exchange rates
 */

import type { ExchangeRate } from "../domain/entities/exchange-rate.entity";

export interface IExchangeRateRepository {
  /**
   * Create a new exchange rate
   */
  create(exchangeRate: ExchangeRate): Promise<ExchangeRate>;

  /**
   * Find exchange rate by ID
   */
  findById(id: string): Promise<ExchangeRate | null>;

  /**
   * Find exchange rate by currency code
   */
  findByCurrency(currency: string): Promise<ExchangeRate | null>;

  /**
   * Find active exchange rate by currency code
   */
  findActiveByCurrency(currency: string): Promise<ExchangeRate | null>;

  /**
   * Find all exchange rates
   */
  findAll(options?: {
    onlyActive?: boolean;
    orderBy?: "currency" | "createdAt";
    order?: "asc" | "desc";
  }): Promise<ExchangeRate[]>;

  /**
   * Count all exchange rates
   */
  count(onlyActive?: boolean): Promise<number>;

  /**
   * Update exchange rate
   */
  update(exchangeRate: ExchangeRate): Promise<ExchangeRate>;

  /**
   * Delete exchange rate (soft delete by marking as inactive)
   */
  delete(id: string): Promise<void>;

  /**
   * Check if currency exists (for uniqueness validation)
   */
  existsByCurrency(currency: string, excludeId?: string): Promise<boolean>;
}
