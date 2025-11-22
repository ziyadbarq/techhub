/**
 * FX Rates Page Client Component
 * Manage exchange rates with CRUD operations
 */

"use client";

import { useState } from "react";
import { Plus, Info } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { ExchangeRateResponseDTO } from "@/interface-adapters/presenters/exchange-rate.presenter";
import { listExchangeRatesAction } from "@/interface-adapters/controllers/exchange-rate.controller";
import { FxRatesTable } from "./fx-rates-table";
import { FxRateForm } from "./fx-rate-form";
import { PermissionGuard } from "@/components/auth/PermissionGuard";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";

interface FxRatesPageClientProps {
  initialRates: ExchangeRateResponseDTO[];
}

export function FxRatesPageClient({ initialRates }: FxRatesPageClientProps) {
  const [rates, setRates] = useState<ExchangeRateResponseDTO[]>(initialRates);
  const [isLoading, setIsLoading] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRate, setEditingRate] =
    useState<ExchangeRateResponseDTO | null>(null);

  const loadRates = async () => {
    setIsLoading(true);
    try {
      const result = await listExchangeRatesAction();
      if (result.success) {
        setRates(result.data);
      } else {
        toast.error(result.error);
      }
    } catch (_error) {
      toast.error("Failed to load exchange rates");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (rate: ExchangeRateResponseDTO) => {
    setEditingRate(rate);
    setIsFormOpen(true);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingRate(null);
  };

  const handleSuccess = () => {
    loadRates();
  };

  const activeCount = rates.filter((r) => r.isActive).length;
  const inactiveCount = rates.length - activeCount;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-2xl font-bold">Exchange Rates (FX Rates)</h2>
          <p className="text-muted-foreground">
            {activeCount} active rate{activeCount !== 1 ? "s" : ""}
            {inactiveCount > 0 && `, ${inactiveCount} inactive`}
          </p>
        </div>

        <PermissionGuard permission={PERMISSIONS.FX_RATES_CREATE}>
          <Button
            onClick={() => setIsFormOpen(true)}
            className="bg-barq-yellow text-barq-black hover:bg-barq-yellow/90 gap-2"
          >
            <Plus className="h-4 w-4" />
            New Exchange Rate
          </Button>
        </PermissionGuard>
      </div>

      {/* Info Alert */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>Multi-Currency Support</AlertTitle>
        <AlertDescription>
          Exchange rates define conversion from foreign currencies to SAR (Saudi
          Riyal). All asset values are stored in their original currency and
          converted to SAR for reporting and aggregation. SAR is the base
          currency and does not need an exchange rate entry.
        </AlertDescription>
      </Alert>

      {/* Exchange Rates Table */}
      <FxRatesTable
        data={rates}
        loading={isLoading}
        onEdit={handleEdit}
        onRefresh={handleSuccess}
      />

      {/* Exchange Rate Form Dialog */}
      <FxRateForm
        open={isFormOpen}
        onOpenChange={handleFormClose}
        onSuccess={handleSuccess}
        rate={editingRate}
      />
    </div>
  );
}
