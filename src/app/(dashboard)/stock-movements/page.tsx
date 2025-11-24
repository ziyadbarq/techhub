/**
 * Stock Movements Page
 * Display and manage stock movement transactions
 */

import { StockMovementsPageClient } from "@/components/stock-movements/stock-movements-page-client";
import { listStockMovementsAction } from "@/interface-adapters/controllers/stock-movement.controller";
import { requirePermission } from "@/lib/permissions/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { handlePermissionRedirect } from "@/lib/permissions/handle-permission-redirect";

export const dynamic = "force-dynamic";

export default async function StockMovementsPage() {
  try {
    await requirePermission(PERMISSIONS.STOCK_MOVEMENTS_VIEW);
  } catch (error) {
    handlePermissionRedirect(error, "/stock-movements");
    throw error;
  }

  const result = await listStockMovementsAction();
  const initialStockMovements = result.success ? result.data : [];

  return (
    <StockMovementsPageClient initialStockMovements={initialStockMovements} />
  );
}
