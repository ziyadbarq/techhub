/**
 * Exchange Rates (FX Rates) Page
 * Manage currency exchange rates for multi-currency support
 */

import { FxRatesPageClient } from "@/components/fx-rates/fx-rates-page-client";
import { listExchangeRatesAction } from "@/interface-adapters/controllers/exchange-rate.controller";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { requireFeatureAndPermission } from "@/lib/features/feature-permission-guard";

export const dynamic = "force-dynamic";

export default async function FxRatesPage() {
  await requireFeatureAndPermission(
    "FX_RATES",
    PERMISSIONS.FX_RATES_VIEW,
    "/fx-rates",
  );

  const result = await listExchangeRatesAction();
  const initialRates = result.success ? result.data : [];

  return <FxRatesPageClient initialRates={initialRates} />;
}
