/**
 * Stock Locations Page
 */

import { StockLocationsPageClient } from "@/components/stock-locations/stock-locations-page-client";
import { listStockLocationsAction } from "@/interface-adapters/controllers/stock-location.controller";
import { requirePermission } from "@/lib/permissions/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";

export const dynamic = "force-dynamic";

export default async function StockLocationsPage() {
  await requirePermission(PERMISSIONS.STOCK_LOCATIONS_VIEW);

  const result = await listStockLocationsAction();
  const initialStockLocations = result.success ? result.data : [];

  return (
    <StockLocationsPageClient initialStockLocations={initialStockLocations} />
  );
}
