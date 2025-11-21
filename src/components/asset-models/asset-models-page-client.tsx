/**
 * Asset Models Page Client Component
 */

"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import type { AssetModelDTO } from "@/interface-adapters/presenters/asset-model.presenter";
import { listAssetModelsAction } from "@/interface-adapters/controllers/asset-model.controller";
import { AssetModelsTable } from "./asset-models-table";
import { AssetModelForm } from "./asset-model-form";
import { PermissionGuard } from "@/components/auth/PermissionGuard";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";

interface AssetModelsPageClientProps {
  initialAssetModels: AssetModelDTO[];
}

export function AssetModelsPageClient({
  initialAssetModels,
}: AssetModelsPageClientProps) {
  const [assetModels, setAssetModels] =
    useState<AssetModelDTO[]>(initialAssetModels);
  const [isLoading, setIsLoading] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAssetModel, setEditingAssetModel] =
    useState<AssetModelDTO | null>(null);

  const loadAssetModels = async () => {
    setIsLoading(true);
    try {
      const result = await listAssetModelsAction();
      if (result.success) {
        setAssetModels(result.data);
      } else {
        toast.error(result.error);
      }
    } catch (_error) {
      toast.error("Failed to load asset models");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (assetModel: AssetModelDTO) => {
    setEditingAssetModel(assetModel);
    setIsFormOpen(true);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingAssetModel(null);
  };

  const handleSuccess = () => {
    loadAssetModels();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-2xl font-bold">Asset Models</h2>
          <p className="text-muted-foreground">
            {assetModels.length} model{assetModels.length !== 1 ? "s" : ""}
          </p>
        </div>

        <PermissionGuard permission={PERMISSIONS.ASSET_MODELS_CREATE}>
          <Button
            onClick={() => setIsFormOpen(true)}
            className="bg-barq-yellow text-barq-black hover:bg-barq-yellow/90 gap-2"
          >
            <Plus className="h-4 w-4" />
            New Asset Model
          </Button>
        </PermissionGuard>
      </div>

      {/* Asset Models Table */}
      <AssetModelsTable
        data={assetModels}
        loading={isLoading}
        onEdit={handleEdit}
        onRefresh={handleSuccess}
      />

      {/* Asset Model Form Dialog */}
      <AssetModelForm
        open={isFormOpen}
        onOpenChange={handleFormClose}
        onSuccess={handleSuccess}
        assetModel={editingAssetModel}
      />
    </div>
  );
}
