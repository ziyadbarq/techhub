/**
 * Exchange Rates (FX Rates) Page
 * Manage currency exchange rates for multi-currency support
 */

import { FxRatesPageClient } from "@/components/fx-rates/fx-rates-page-client";
import { listExchangeRatesAction } from "@/interface-adapters/controllers/exchange-rate.controller";
import { requirePermission } from "@/lib/permissions/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { handlePermissionRedirect } from "@/lib/permissions/handle-permission-redirect";

export const dynamic = "force-dynamic";

export default async function FxRatesPage() {
  try {
    await requirePermission(PERMISSIONS.FX_RATES_VIEW);
  } catch (error) {
    handlePermissionRedirect(error, "/fx-rates");
    throw error;
  }

  const result = await listExchangeRatesAction();
  const initialRates = result.success ? result.data : [];

  return <FxRatesPageClient initialRates={initialRates} />;
}
