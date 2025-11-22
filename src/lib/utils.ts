import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Utility function to merge Tailwind CSS classes
 * Combines clsx for conditional classes and tailwind-merge to handle conflicts
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Currency Utilities
 * Functions for formatting and displaying currency values
 */

/**
 * Currency symbols mapping
 */
export const CURRENCY_SYMBOLS: Record<string, string> = {
  SAR: "ر.س",
  USD: "$",
  EUR: "€",
  GBP: "£",
  JPY: "¥",
  AUD: "A$",
  CAD: "C$",
  CHF: "CHF",
  CNY: "¥",
  INR: "₹",
  AED: "د.إ",
  KWD: "د.ك",
  BHD: "د.ب",
  OMR: "ر.ع",
  QAR: "ر.ق",
};

/**
 * Currency locales mapping for Intl.NumberFormat
 */
export const CURRENCY_LOCALES: Record<string, string> = {
  SAR: "ar-SA",
  USD: "en-US",
  EUR: "de-DE",
  GBP: "en-GB",
  JPY: "ja-JP",
  AUD: "en-AU",
  CAD: "en-CA",
  CHF: "de-CH",
  CNY: "zh-CN",
  INR: "en-IN",
  AED: "ar-AE",
  KWD: "ar-KW",
  BHD: "ar-BH",
  OMR: "ar-OM",
  QAR: "ar-QA",
};

/**
 * Format a currency amount with proper locale and symbol
 *
 * @param amount - The amount to format
 * @param currency - 3-letter ISO currency code (default: "SAR")
 * @param options - Additional formatting options
 * @returns Formatted currency string (e.g., "ر.س 1,234.56")
 *
 * @example
 * formatCurrency(1234.56, "SAR") // "ر.س 1,234.56"
 * formatCurrency(1234.56, "USD") // "$1,234.56"
 * formatCurrency(1234.56, "EUR") // "€1,234.56"
 */
export function formatCurrency(
  amount: number,
  currency: string = "SAR",
  options?: {
    showSymbol?: boolean;
    showCode?: boolean;
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
  },
): string {
  const {
    showSymbol = true,
    showCode = false,
    minimumFractionDigits = 2,
    maximumFractionDigits = 2,
  } = options ?? {};

  const locale = CURRENCY_LOCALES[currency] ?? "en-US";
  const symbol = CURRENCY_SYMBOLS[currency] ?? currency;

  // Format the number with locale
  const formatted = new Intl.NumberFormat(locale, {
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(amount);

  // Build the output string
  let result = formatted;

  if (showSymbol) {
    // For Arabic currencies (SAR, AED, KWD, etc.), put symbol before with space
    if (locale.startsWith("ar")) {
      result = `${symbol} ${formatted}`;
    } else {
      // For Western currencies, put symbol before without space
      result = `${symbol}${formatted}`;
    }
  }

  if (showCode) {
    result = `${result} ${currency}`;
  }

  return result;
}

/**
 * Format a currency amount in SAR (default base currency)
 *
 * @param amount - The amount to format
 * @returns Formatted SAR string (e.g., "ر.س 1,234.56")
 */
export function formatSAR(amount: number): string {
  return formatCurrency(amount, "SAR");
}

/**
 * Get currency symbol for a given currency code
 *
 * @param currency - 3-letter ISO currency code
 * @returns Currency symbol or the code itself if not found
 */
export function getCurrencySymbol(currency: string): string {
  return CURRENCY_SYMBOLS[currency] ?? currency;
}

/**
 * Format dual currency display (original amount + SAR equivalent)
 *
 * @param amount - Original amount
 * @param currency - Original currency code
 * @param sarAmount - Converted SAR amount (optional)
 * @returns Formatted dual display string
 *
 * @example
 * formatDualCurrency(100, "USD", 375) // "$100 (ر.س 375.00)"
 * formatDualCurrency(100, "SAR") // "ر.س 100.00"
 */
export function formatDualCurrency(
  amount: number,
  currency: string,
  sarAmount?: number,
): string {
  const formattedOriginal = formatCurrency(amount, currency);

  // If already in SAR or no conversion provided, return single format
  if (currency === "SAR" || !sarAmount) {
    return formattedOriginal;
  }

  const formattedSAR = formatSAR(sarAmount);
  return `${formattedOriginal} (${formattedSAR})`;
}
