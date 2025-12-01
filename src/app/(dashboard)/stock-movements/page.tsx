/**
 * Stock Movements Page
 * Display and manage stock movement transactions
 */

import { StockMovementsPageClient } from "@/components/stock-movements/stock-movements-page-client";
import { listStockMovementsAction } from "@/interface-adapters/controllers/stock-movement.controller";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { requireFeatureAndPermission } from "@/lib/features/feature-permission-guard";

export const dynamic = "force-dynamic";

export default async function StockMovementsPage() {
  await requireFeatureAndPermission(
    "INVENTORY",
    PERMISSIONS.STOCK_MOVEMENTS_VIEW,
    "/stock-movements",
  );

  const result = await listStockMovementsAction();
  const initialStockMovements = result.success ? result.data : [];

  return (
    <StockMovementsPageClient initialStockMovements={initialStockMovements} />
  );
}
