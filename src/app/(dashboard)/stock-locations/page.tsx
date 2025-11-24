/**
 * Stock Locations Page
 * Display and manage stock storage locations
 */

import { StockLocationsPageClient } from "@/components/stock-locations/stock-locations-page-client";
import { listStockLocationsAction } from "@/interface-adapters/controllers/stock-location.controller";
import { requirePermission } from "@/lib/permissions/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { handlePermissionRedirect } from "@/lib/permissions/handle-permission-redirect";

export const dynamic = "force-dynamic";

export default async function StockLocationsPage() {
  try {
    await requirePermission(PERMISSIONS.STOCK_LOCATIONS_VIEW);
  } catch (error) {
    handlePermissionRedirect(error, "/stock-locations");
    throw error;
  }

  const result = await listStockLocationsAction();
  const initialStockLocations = result.success ? result.data : [];

  return (
    <StockLocationsPageClient initialStockLocations={initialStockLocations} />
  );
}
