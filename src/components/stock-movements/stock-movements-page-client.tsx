/**
 * Stock Movements Page Client Component
 */

"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import type { StockMovementDTO } from "@/interface-adapters/presenters/stock-movement.presenter";
import { listStockMovementsAction } from "@/interface-adapters/controllers/stock-movement.controller";
import { StockMovementsTable } from "./stock-movements-table";
import { StockMovementForm } from "./stock-movement-form";
import { PermissionGuard } from "@/components/auth/PermissionGuard";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";

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
  const [isFormOpen, setIsFormOpen] = useState(false);

  const loadStockMovements = async () => {
    setIsLoading(true);
    try {
      const result = await listStockMovementsAction();
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

  const handleFormClose = () => {
    setIsFormOpen(false);
  };

  const handleSuccess = () => {
    loadStockMovements();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-2xl font-bold">Stock Movements</h2>
          <p className="text-muted-foreground">
            {stockMovements.length} movement
            {stockMovements.length !== 1 ? "s" : ""}
          </p>
        </div>

        <PermissionGuard permission={PERMISSIONS.STOCK_MOVEMENTS_CREATE}>
          <Button
            onClick={() => setIsFormOpen(true)}
            className="bg-barq-yellow text-barq-black hover:bg-barq-yellow/90 gap-2"
          >
            <Plus className="h-4 w-4" />
            Record Movement
          </Button>
        </PermissionGuard>
      </div>

      {/* Stock Movements Table */}
      <StockMovementsTable
        data={stockMovements}
        loading={isLoading}
        onRefresh={handleSuccess}
      />

      {/* Stock Movement Form Dialog */}
      <StockMovementForm
        open={isFormOpen}
        onOpenChange={handleFormClose}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
