/**
 * Stock Locations Page Client Component
 * Orchestrates stock location list and CRUD operations
 */

"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import type { StockLocationDTO } from "@/interface-adapters/presenters/stock-location.presenter";
import { listStockLocationsAction } from "@/interface-adapters/controllers/stock-location.controller";
import { StockLocationsTable } from "./stock-locations-table";
import { StockLocationForm } from "./stock-location-form";
import { PermissionGuard } from "@/components/auth/PermissionGuard";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";

interface StockLocationsPageClientProps {
  initialStockLocations: StockLocationDTO[];
}

export function StockLocationsPageClient({
  initialStockLocations,
}: StockLocationsPageClientProps) {
  const [stockLocations, setStockLocations] = useState<StockLocationDTO[]>(
    initialStockLocations,
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingStockLocation, setEditingStockLocation] =
    useState<StockLocationDTO | null>(null);

  const loadStockLocations = async () => {
    setIsLoading(true);
    try {
      const result = await listStockLocationsAction();
      if (result.success) {
        setStockLocations(result.data);
      } else {
        toast.error(result.error);
      }
    } catch (_error) {
      toast.error("Failed to load stock locations");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (stockLocation: StockLocationDTO) => {
    setEditingStockLocation(stockLocation);
    setIsFormOpen(true);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingStockLocation(null);
  };

  const handleSuccess = () => {
    loadStockLocations();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-2xl font-bold">Stock Locations</h2>
          <p className="text-muted-foreground">
            {stockLocations.length} total locations
          </p>
        </div>

        <PermissionGuard permission={PERMISSIONS.STOCK_LOCATIONS_CREATE}>
          <Button
            onClick={() => setIsFormOpen(true)}
            className="bg-barq-yellow text-barq-black hover:bg-barq-yellow/90 gap-2"
          >
            <Plus className="h-4 w-4" />
            New Location
          </Button>
        </PermissionGuard>
      </div>

      {/* Stock Locations Table */}
      <StockLocationsTable
        data={stockLocations}
        loading={isLoading}
        onEdit={handleEdit}
        onRefresh={handleSuccess}
      />

      {/* Stock Location Form Dialog */}
      <StockLocationForm
        open={isFormOpen}
        onOpenChange={handleFormClose}
        onSuccess={handleSuccess}
        stockLocation={editingStockLocation}
      />
    </div>
  );
}
