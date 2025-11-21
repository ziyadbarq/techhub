/**
 * Asset Disposals Page Client Component
 */

"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import type { AssetDisposalDTO } from "@/interface-adapters/dtos/generated/asset-disposal.dto";
import { listAssetDisposalsAction } from "@/interface-adapters/controllers/asset-disposal.controller";
import { AssetDisposalsTable } from "./asset-disposals-table";
import { DisposalForm } from "./disposal-form";
import { DisposalDetail } from "./disposal-detail";
import { PermissionGuard } from "@/components/auth/PermissionGuard";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";

interface AssetDisposalsPageClientProps {
  initialDisposals: AssetDisposalDTO[];
}

export function AssetDisposalsPageClient({
  initialDisposals,
}: AssetDisposalsPageClientProps) {
  const [disposals, setDisposals] =
    useState<AssetDisposalDTO[]>(initialDisposals);
  const [isLoading, setIsLoading] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedDisposal, setSelectedDisposal] =
    useState<AssetDisposalDTO | null>(null);

  const loadDisposals = async () => {
    setIsLoading(true);
    try {
      const result = await listAssetDisposalsAction();
      if (result.success) {
        setDisposals(result.data);
      } else {
        toast.error(result.error);
      }
    } catch (_error) {
      toast.error("Failed to load disposals");
    } finally {
      setIsLoading(false);
    }
  };

  const handleView = (disposal: AssetDisposalDTO) => {
    setSelectedDisposal(disposal);
  };

  const handleSuccess = () => {
    loadDisposals();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-2xl font-bold">Asset Disposals</h2>
          <p className="text-muted-foreground">
            {disposals.length} disposal{disposals.length !== 1 ? "s" : ""}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <PermissionGuard permission={PERMISSIONS.ASSET_DISPOSALS_CREATE}>
            <Button
              onClick={() => setIsFormOpen(true)}
              className="bg-barq-yellow text-barq-black hover:bg-barq-yellow/90 gap-2"
            >
              <Plus className="h-4 w-4" />
              New Disposal Request
            </Button>
          </PermissionGuard>
        </div>
      </div>

      {/* Disposals Table */}
      <AssetDisposalsTable
        data={disposals}
        loading={isLoading}
        onView={handleView}
        onRefresh={handleSuccess}
      />

      {/* Disposal Form Dialog */}
      <DisposalForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSuccess={handleSuccess}
      />

      {/* Disposal Detail Dialog */}
      {selectedDisposal && (
        <DisposalDetail
          disposal={selectedDisposal}
          onClose={() => setSelectedDisposal(null)}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  );
}
