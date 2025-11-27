/**
 * SAR Conversion Service Interface
 *
 * Provides a reusable pattern for converting monetary amounts to SAR (Saudi Riyal).
 * This service is designed to be injected into use cases that need to calculate
 * SAR snapshot values for financial fields.
 *
 * Architecture:
 * - Interface in core/services (domain layer)
 * - Implementation in infrastructure/services (SarConversionService)
 * - Injected via dependency injection container
 *
 * EXTENSIBILITY GUIDE:
 * When adding SAR columns to a new entity (e.g., Warranty, MaintenanceRecord):
 * 1. Add `{fieldName}Sar` column to Prisma schema
 * 2. Inject this service into your create/update use case
 * 3. Call convertToSarIfNeeded() when amount or currency changes
 * 4. Store the result in the entity's *Sar column
 *
 * @see Asset (purchaseCostSar), Contract (totalValueSar) for reference implementations
 */

/**
 * Result of SAR recalculation check
 */
export interface SarRecalculationResult {
  /** Whether SAR conversion should be performed */
  needsConversion: boolean;
  /** The final amount value to convert (after applying changes) */
  amount: number | null;
  /** The final currency to use for conversion (after applying changes) */
  currency: string | null;
}

/**
 * SAR Conversion Service Interface
 *
 * Provides currency-to-SAR conversion logic for frozen SAR snapshot columns.
 * SAR is used as the base currency for all financial aggregations and reporting.
 *
 * Features:
 * - Graceful null handling (returns null if conversion not possible)
 * - SAR pass-through (no conversion needed for SAR amounts)
 * - Uses active exchange rates from ExchangeRate repository
 */
export interface ISarConversionService {
  /**
   * Convert an amount to SAR if conversion is possible
   *
   * @param amount - The monetary amount to convert (can be null/undefined)
   * @param currency - The source currency code (can be null/undefined)
   * @returns Promise resolving to SAR amount, or null if conversion not possible
   *
   * Returns null when:
   * - amount is null/undefined
   * - currency is null/undefined
   * - No active exchange rate exists for the currency
   *
   * Returns the same amount when:
   * - currency is already SAR (no conversion needed)
   *
   * @example
   * ```typescript
   * // USD to SAR conversion
   * const sarAmount = await sarService.convertToSarIfNeeded(100, 'USD');
   * // Result: 375 (if exchange rate is 3.75)
   *
   * // SAR pass-through
   * const sarAmount = await sarService.convertToSarIfNeeded(100, 'SAR');
   * // Result: 100
   *
   * // Missing exchange rate
   * const sarAmount = await sarService.convertToSarIfNeeded(100, 'XYZ');
   * // Result: null
   * ```
   */
  convertToSarIfNeeded(
    amount: number | null | undefined,
    currency: string | null | undefined,
  ): Promise<number | null>;

  /**
   * Determine if SAR recalculation is needed based on field changes
   *
   * Call this in update use cases to check whether the SAR snapshot
   * should be recalculated based on changes to amount or currency fields.
   *
   * @param changes - Object containing the changed fields from the update request
   * @param currentAmount - Current amount value in the entity
   * @param currentCurrency - Current currency value in the entity
   * @returns Object with needsConversion flag and final values to use
   *
   * @example
   * ```typescript
   * // In UpdateAssetUseCase
   * const sarCheck = sarService.shouldRecalculateSar(
   *   { amount: input.purchaseCost, currency: input.currency },
   *   asset.purchaseCost,
   *   asset.currency
   * );
   *
   * if (sarCheck.needsConversion) {
   *   const newSarValue = await sarService.convertToSarIfNeeded(
   *     sarCheck.amount,
   *     sarCheck.currency
   *   );
   *   // Update entity with new SAR value
   * }
   * ```
   */
  shouldRecalculateSar(
    changes: { amount?: number | null; currency?: string | null },
    currentAmount: number | null,
    currentCurrency: string | null,
  ): SarRecalculationResult;
}
