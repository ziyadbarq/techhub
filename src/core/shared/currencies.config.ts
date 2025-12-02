/**
 * Currency Configuration
 * Single source of truth for supported currencies across the application
 *
 * Located in core/shared so it can be consumed by domain without depending on lib.
 */

export interface CurrencyInfo {
  code: string;
  name: string;
  symbol: string;
  locale: string;
}

/**
 * Supported currencies in the system
 * All amounts are stored/converted relative to SAR (Saudi Riyal)
 */
export const SUPPORTED_CURRENCIES: readonly CurrencyInfo[] = [
  { code: "SAR", name: "Saudi Riyal", symbol: "ر.س", locale: "ar-SA" },
  { code: "USD", name: "US Dollar", symbol: "$", locale: "en-US" },
  { code: "EUR", name: "Euro", symbol: "€", locale: "de-DE" },
  { code: "GBP", name: "British Pound", symbol: "£", locale: "en-GB" },
  { code: "JPY", name: "Japanese Yen", symbol: "¥", locale: "ja-JP" },
  { code: "AUD", name: "Australian Dollar", symbol: "A$", locale: "en-AU" },
  { code: "CAD", name: "Canadian Dollar", symbol: "C$", locale: "en-CA" },
  { code: "CHF", name: "Swiss Franc", symbol: "CHF", locale: "de-CH" },
  { code: "CNY", name: "Chinese Yuan", symbol: "¥", locale: "zh-CN" },
  { code: "INR", name: "Indian Rupee", symbol: "₹", locale: "en-IN" },
  { code: "AED", name: "UAE Dirham", symbol: "د.إ", locale: "ar-AE" },
  { code: "KWD", name: "Kuwaiti Dinar", symbol: "د.ك", locale: "ar-KW" },
  { code: "BHD", name: "Bahraini Dinar", symbol: "د.ب", locale: "ar-BH" },
  { code: "OMR", name: "Omani Rial", symbol: "ر.ع", locale: "ar-OM" },
  { code: "QAR", name: "Qatari Riyal", symbol: "ر.ق", locale: "ar-QA" },
] as const;

/**
 * Currency codes only (for validation)
 */
export const CURRENCY_CODES = [
  "SAR",
  "USD",
  "EUR",
  "GBP",
  "JPY",
  "AUD",
  "CAD",
  "CHF",
  "CNY",
  "INR",
  "AED",
  "KWD",
  "BHD",
  "OMR",
  "QAR",
] as const;

/**
 * Currency symbols mapping (for quick lookup)
 * @deprecated Use SUPPORTED_CURRENCIES directly for better type safety
 */
export const CURRENCY_SYMBOLS: Record<string, string> = Object.fromEntries(
  SUPPORTED_CURRENCIES.map((c) => [c.code, c.symbol]),
);

/**
 * Currency locales mapping (for Intl.NumberFormat)
 * @deprecated Use SUPPORTED_CURRENCIES directly for better type safety
 */
export const CURRENCY_LOCALES: Record<string, string> = Object.fromEntries(
  SUPPORTED_CURRENCIES.map((c) => [c.code, c.locale]),
);

/**
 * Get currency info by code
 */
export function getCurrencyInfo(code: string): CurrencyInfo | undefined {
  return SUPPORTED_CURRENCIES.find((c) => c.code === code);
}

/**
 * Check if a currency code is supported
 */
export function isSupportedCurrency(
  code: string,
): code is (typeof CURRENCY_CODES)[number] {
  return CURRENCY_CODES.includes(code as (typeof CURRENCY_CODES)[number]);
}
