/**
 * Stock Movements Page
 */

import { StockMovementsPageClient } from "@/components/stock-movements/stock-movements-page-client";
import { listStockMovementsAction } from "@/interface-adapters/controllers/stock-movement.controller";
import { requirePermission } from "@/lib/permissions/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";

export const dynamic = "force-dynamic";

export default async function StockMovementsPage() {
  await requirePermission(PERMISSIONS.STOCK_MOVEMENTS_VIEW);

  const result = await listStockMovementsAction();
  const initialStockMovements = result.success ? result.data : [];

  return (
    <StockMovementsPageClient initialStockMovements={initialStockMovements} />
  );
}
