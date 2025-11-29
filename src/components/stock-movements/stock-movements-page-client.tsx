/**
 * Stock Movements Page Client Component
 * Displays stock movement history (movements are created automatically via asset workflows)
 */

"use client";

import { useState } from "react";
import { toast } from "sonner";

import type { StockMovementDTO } from "@/interface-adapters/presenters/stock-movement.presenter";
import { listStockMovementsAction } from "@/interface-adapters/controllers/stock-movement.controller";
import { StockMovementsTable } from "./stock-movements-table";

interface StockMovementsPageClientProps {
  initialStockMovements: StockMovementDTO[];
}

export function StockMovementsPageClient({
  initialStockMovements,
}: StockMovementsPageClientProps) {
  const [stockMovements, setStockMovements] = useState<StockMovementDTO[]>(
    initialStockMovements,
  );
  const [isLoading, setIsLoading] = useState(false);
  const [showVoided, setShowVoided] = useState(false);

  const loadStockMovements = async () => {
    setIsLoading(true);
    try {
      // Always load all movements including voided - filtering happens in the table
      const result = await listStockMovementsAction({ includeVoided: true });
      if (result.success) {
        setStockMovements(result.data);
      } else {
        toast.error(result.error);
      }
    } catch (_error) {
      toast.error("Failed to load stock movements");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = () => {
    loadStockMovements();
  };

  // Count movements by type (active only for display)
  const activeMovements = stockMovements.filter((m) => m.isActive);
  const voidedCount = stockMovements.length - activeMovements.length;
  const receivingCount = activeMovements.filter((m) => m.isReceiving).length;
  const issuingCount = activeMovements.filter((m) => m.isIssuing).length;
  const transferCount = activeMovements.filter((m) => m.isTransfer).length;
  const adjustmentCount = activeMovements.filter((m) => m.isAdjustment).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Stock Movements</h2>
        <p className="text-muted-foreground">
          {activeMovements.length} active movements
          {receivingCount > 0 && ` • ${receivingCount} received`}
          {issuingCount > 0 && ` • ${issuingCount} issued`}
          {transferCount > 0 && ` • ${transferCount} transfers`}
          {adjustmentCount > 0 && ` • ${adjustmentCount} adjustments`}
          {voidedCount > 0 && (
            <span className="text-muted-foreground/70">
              {" "}
              • {voidedCount} voided
            </span>
          )}
        </p>
      </div>

      {/* Stock Movements Table */}
      <StockMovementsTable
        data={stockMovements}
        loading={isLoading}
        onRefresh={handleRefresh}
        showVoided={showVoided}
        onShowVoidedChange={setShowVoided}
      />
    </div>
  );
}
