"use client";

import * as React from "react";
import { DollarSign, Calculator, Info } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CurrencyDisplay } from "@/components/ui/currency-display";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { calculateEntitlementTotalCost } from "@/interface-adapters/controllers/license-entitlement-addon.controller";
import type { EntitlementCostBreakdownDTO } from "@/interface-adapters/dtos/generated/license-entitlement-addon.dto";
import { listExchangeRatesAction } from "@/interface-adapters/controllers/exchange-rate.controller";

interface EntitlementCostDisplayProps {
  entitlementId: string;
  unitCost: number | null;
  currency: string | null;
  purchasedQuantity: number;
}

export function EntitlementCostDisplay({
  entitlementId,
  unitCost,
  currency,
  purchasedQuantity,
}: EntitlementCostDisplayProps) {
  const [breakdown, setBreakdown] =
    React.useState<EntitlementCostBreakdownDTO | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [exchangeRates, setExchangeRates] = React.useState<
    Map<string, { rateToSAR: number }>
  >(new Map());

  // Fetch exchange rates for currency conversion
  React.useEffect(() => {
    async function fetchRates() {
      try {
        const result = await listExchangeRatesAction({ onlyActive: true });
        if (result.success && result.data) {
          const rateMap = new Map<string, { rateToSAR: number }>();
          for (const rate of result.data) {
            rateMap.set(rate.currency, { rateToSAR: rate.rateToSAR });
          }
          setExchangeRates(rateMap);
        }
      } catch {
        // Silent fail - just won't show conversion
      }
    }
    void fetchRates();
  }, []);

  // Fetch cost breakdown
  React.useEffect(() => {
    async function fetchBreakdown() {
      setLoading(true);
      try {
        const result = await calculateEntitlementTotalCost(entitlementId);
        if (result.success) {
          setBreakdown(result.data);
        }
      } finally {
        setLoading(false);
      }
    }
    void fetchBreakdown();
  }, [entitlementId]);

  const calculateSARAmount = (
    amount: number,
    curr: string,
  ): { sarAmount?: number; exchangeRate?: number } => {
    if (curr === "SAR") {
      return { sarAmount: amount, exchangeRate: 1.0 };
    }
    const rate = exchangeRates.get(curr);
    if (!rate) {
      return {};
    }
    return { sarAmount: amount * rate.rateToSAR, exchangeRate: rate.rateToSAR };
  };

  if (!unitCost) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <DollarSign className="h-4 w-4" />
            Cost Tracking
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            No cost information recorded for this entitlement.
          </p>
        </CardContent>
      </Card>
    );
  }

  const totalBaseCost = unitCost * purchasedQuantity;
  const baseCurrency = currency || "SAR";
  const baseSAR = calculateSARAmount(totalBaseCost, baseCurrency);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <DollarSign className="h-4 w-4" />
          Cost Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Base License Cost */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-sm">Unit Cost</span>
            <CurrencyDisplay
              amount={unitCost}
              currency={baseCurrency}
              sarAmount={calculateSARAmount(unitCost, baseCurrency).sarAmount}
              exchangeRate={
                calculateSARAmount(unitCost, baseCurrency).exchangeRate
              }
              mode="dual"
              className="text-sm"
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-sm">
              Quantity × {purchasedQuantity}
            </span>
            <CurrencyDisplay
              amount={totalBaseCost}
              currency={baseCurrency}
              sarAmount={baseSAR.sarAmount}
              exchangeRate={baseSAR.exchangeRate}
              mode="dual"
              className="text-sm font-medium"
            />
          </div>
        </div>

        {/* Addon Costs */}
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        ) : breakdown && breakdown.addonCosts.length > 0 ? (
          <div className="space-y-2 border-t pt-3">
            <div className="flex items-center gap-1">
              <span className="text-sm font-medium">Addon Costs</span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="text-muted-foreground h-3 w-3" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Additional costs from attached addons</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            {breakdown.addonCosts.map((cost, index) => {
              const addonSAR = calculateSARAmount(cost.total, cost.currency);
              return (
                <div
                  key={`${cost.currency}-${index}`}
                  className="flex items-center justify-between"
                >
                  <span className="text-muted-foreground text-sm">
                    Addons ({cost.currency})
                  </span>
                  <CurrencyDisplay
                    amount={cost.total}
                    currency={cost.currency}
                    sarAmount={addonSAR.sarAmount}
                    exchangeRate={addonSAR.exchangeRate}
                    mode="dual"
                    className="text-sm"
                  />
                </div>
              );
            })}
          </div>
        ) : null}

        {/* Total */}
        {breakdown && breakdown.totalByCurrency.length > 0 && (
          <div className="space-y-2 border-t pt-3">
            <div className="flex items-center gap-1">
              <Calculator className="text-muted-foreground h-4 w-4" />
              <span className="text-sm font-medium">Total Cost</span>
            </div>
            {breakdown.totalByCurrency.map((cost, index) => {
              const totalSAR = calculateSARAmount(cost.total, cost.currency);
              return (
                <div
                  key={`total-${cost.currency}-${index}`}
                  className="flex items-center justify-between"
                >
                  <span className="text-muted-foreground text-sm">
                    {cost.currency}
                  </span>
                  <CurrencyDisplay
                    amount={cost.total}
                    currency={cost.currency}
                    sarAmount={totalSAR.sarAmount}
                    exchangeRate={totalSAR.exchangeRate}
                    mode="dual"
                    className="text-sm font-semibold"
                  />
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
