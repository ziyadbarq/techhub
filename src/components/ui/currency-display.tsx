/**
 * Currency Display Component
 * Displays currency values with proper formatting and optional dual display (original + SAR)
 */

"use client";

import * as React from "react";
import { cn, formatCurrency, formatDualCurrency } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export interface CurrencyDisplayProps {
  /**
   * The amount to display
   */
  amount: number;

  /**
   * 3-letter ISO currency code (default: "SAR")
   */
  currency?: string;

  /**
   * SAR equivalent amount (for dual display)
   * If provided and currency is not SAR, shows "USD 100 (SAR 375)"
   */
  sarAmount?: number;

  /**
   * Display mode
   * - "single": Show only the original amount
   * - "dual": Show original amount with SAR in parentheses (if applicable)
   * - "sar-only": Show only SAR amount
   */
  mode?: "single" | "dual" | "sar-only";

  /**
   * Show currency symbol (default: true)
   */
  showSymbol?: boolean;

  /**
   * Show currency code (default: false)
   */
  showCode?: boolean;

  /**
   * Exchange rate (for tooltip display)
   */
  exchangeRate?: number;

  /**
   * Additional className
   */
  className?: string;

  /**
   * Tooltip behavior
   * - "auto": Show tooltip with exchange rate if provided (default)
   * - "always": Always show tooltip with full details
   * - "never": Never show tooltip
   */
  tooltip?: "auto" | "always" | "never";
}

/**
 * CurrencyDisplay component
 *
 * @example
 * // Simple SAR display
 * <CurrencyDisplay amount={1234.56} />
 * // Output: ر.س 1,234.56
 *
 * @example
 * // USD with dual display
 * <CurrencyDisplay
 *   amount={100}
 *   currency="USD"
 *   sarAmount={375}
 *   mode="dual"
 * />
 * // Output: $100.00 (ر.س 375.00)
 *
 * @example
 * // With exchange rate tooltip
 * <CurrencyDisplay
 *   amount={100}
 *   currency="USD"
 *   sarAmount={375}
 *   exchangeRate={3.75}
 * />
 * // Output: $100.00 (hover to see rate: 1 USD = 3.75 SAR)
 */
export function CurrencyDisplay({
  amount,
  currency = "SAR",
  sarAmount,
  mode = "dual",
  showSymbol = true,
  showCode = false,
  exchangeRate,
  className,
  tooltip = "auto",
}: CurrencyDisplayProps) {
  // Determine what to display based on mode
  let displayText: string;

  if (mode === "sar-only" && sarAmount !== undefined) {
    displayText = formatCurrency(sarAmount, "SAR", {
      showSymbol,
      showCode,
    });
  } else if (mode === "dual") {
    displayText = formatDualCurrency(amount, currency, sarAmount);
  } else {
    // mode === "single"
    displayText = formatCurrency(amount, currency, {
      showSymbol,
      showCode,
    });
  }

  // Determine if we should show tooltip
  const shouldShowTooltip =
    tooltip === "always" || (tooltip === "auto" && exchangeRate !== undefined);

  // Render without tooltip if not needed
  if (!shouldShowTooltip) {
    return (
      <span className={cn("font-mono tabular-nums", className)}>
        {displayText}
      </span>
    );
  }

  // Render with tooltip
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className={cn(
              "border-muted-foreground/40 cursor-help border-b border-dotted font-mono tabular-nums",
              className,
            )}
          >
            {displayText}
          </span>
        </TooltipTrigger>
        <TooltipContent>
          <div className="space-y-1 text-sm">
            {exchangeRate && (
              <p className="font-semibold">
                1 {currency} = {exchangeRate.toFixed(6)} SAR
              </p>
            )}
            {amount !== undefined && (
              <p className="text-muted-foreground">
                Original: {formatCurrency(amount, currency)}
              </p>
            )}
            {sarAmount !== undefined && currency !== "SAR" && (
              <p className="text-muted-foreground">
                SAR Equivalent: {formatCurrency(sarAmount, "SAR")}
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/**
 * Simple inline currency display without tooltip
 */
export function InlineCurrency({
  amount,
  currency = "SAR",
  className,
}: {
  amount: number;
  currency?: string;
  className?: string;
}) {
  return (
    <span className={cn("font-mono tabular-nums", className)}>
      {formatCurrency(amount, currency)}
    </span>
  );
}
