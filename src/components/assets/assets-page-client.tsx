/**
 * Assets Page Client Component
 */

"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import type { AssetDTO } from "@/interface-adapters/presenters/asset.presenter";
import { listAssetsAction } from "@/interface-adapters/controllers/asset.controller";
import { AssetsTable } from "./assets-table";
import { AssetForm } from "./asset-form";
import { PermissionGuard } from "@/components/auth/PermissionGuard";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";

interface AssetsPageClientProps {
  initialAssets: AssetDTO[];
}

export function AssetsPageClient({ initialAssets }: AssetsPageClientProps) {
  const [assets, setAssets] = useState<AssetDTO[]>(initialAssets);
  const [isLoading, setIsLoading] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<AssetDTO | null>(null);

  const loadAssets = async () => {
    setIsLoading(true);
    try {
      const result = await listAssetsAction();
      if (result.success) {
        setAssets(result.data);
      } else {
        toast.error(result.error);
      }
    } catch (_error) {
      toast.error("Failed to load assets");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (asset: AssetDTO) => {
    setEditingAsset(asset);
    setIsFormOpen(true);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingAsset(null);
  };

  const handleSuccess = () => {
    loadAssets();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-2xl font-bold">Assets</h2>
          <p className="text-muted-foreground">
            {assets.length} asset{assets.length !== 1 ? "s" : ""}
          </p>
        </div>

        <PermissionGuard permission={PERMISSIONS.ASSETS_CREATE}>
          <Button
            onClick={() => setIsFormOpen(true)}
            className="bg-barq-yellow text-barq-black hover:bg-barq-yellow/90 gap-2"
          >
            <Plus className="h-4 w-4" />
            New Asset
          </Button>
        </PermissionGuard>
      </div>

      {/* Assets Table */}
      <AssetsTable
        data={assets}
        loading={isLoading}
        onEdit={handleEdit}
        onRefresh={handleSuccess}
      />

      {/* Asset Form Dialog */}
      <AssetForm
        open={isFormOpen}
        onOpenChange={handleFormClose}
        onSuccess={handleSuccess}
        asset={editingAsset}
      />
    </div>
  );
}
