/**
 * Stock Locations Page
 * Display and manage stock storage locations
 */

import { StockLocationsPageClient } from "@/components/stock-locations/stock-locations-page-client";
import { listStockLocationsAction } from "@/interface-adapters/controllers/stock-location.controller";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { requireFeatureAndPermission } from "@/lib/features/feature-permission-guard";

export const dynamic = "force-dynamic";

export default async function StockLocationsPage() {
  await requireFeatureAndPermission(
    "INVENTORY",
    PERMISSIONS.STOCK_LOCATIONS_VIEW,
    "/stock-locations",
  );

  const result = await listStockLocationsAction();
  const initialStockLocations = result.success ? result.data : [];

  return (
    <StockLocationsPageClient initialStockLocations={initialStockLocations} />
  );
}
