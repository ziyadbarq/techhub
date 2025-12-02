// Deprecated entry point: kept for backward compatibility.
// Source of truth now lives in core/shared to keep domain pure.
export {
  type CurrencyInfo,
  SUPPORTED_CURRENCIES,
  CURRENCY_CODES,
  CURRENCY_SYMBOLS,
  CURRENCY_LOCALES,
  getCurrencyInfo,
  isSupportedCurrency,
} from "@/core/shared/currencies.config";
