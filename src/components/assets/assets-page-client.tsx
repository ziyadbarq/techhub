/**
 * Assets Page Client Component
 */

"use client";

import { useState } from "react";
import { Plus, Download, Upload } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import type { AssetDTO } from "@/interface-adapters/presenters/asset.presenter";
import { listAssetsAction } from "@/interface-adapters/controllers/asset.controller";
import { AssetsTable } from "./assets-table";
import { AssetForm } from "./asset-form";
import { ImportAssetsWizard } from "./import-assets-wizard";
import { PermissionGuard } from "@/components/auth/PermissionGuard";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { exportAssetsToCSV } from "@/lib/csv-export";
import { downloadAssetCSVTemplate } from "@/lib/csv-template";

interface AssetsPageClientProps {
  initialAssets: AssetDTO[];
}

export function AssetsPageClient({ initialAssets }: AssetsPageClientProps) {
  const [assets, setAssets] = useState<AssetDTO[]>(initialAssets);
  const [isLoading, setIsLoading] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
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

  const handleExport = () => {
    if (assets.length === 0) {
      toast.error("No assets to export");
      return;
    }
    exportAssetsToCSV(assets);
    toast.success(`Exported ${assets.length} asset(s)`);
  };

  const handleDownloadTemplate = () => {
    downloadAssetCSVTemplate();
    toast.success("Template downloaded");
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

        <div className="flex flex-wrap gap-2">
          <PermissionGuard permission={PERMISSIONS.ASSETS_VIEW}>
            <Button variant="outline" onClick={handleExport} className="gap-2">
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
          </PermissionGuard>

          <PermissionGuard permission={PERMISSIONS.ASSETS_CREATE}>
            <Button
              variant="outline"
              onClick={handleDownloadTemplate}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              Template
            </Button>
          </PermissionGuard>

          <PermissionGuard permission={PERMISSIONS.ASSETS_CREATE}>
            <Button
              variant="outline"
              onClick={() => setIsImportOpen(true)}
              className="gap-2"
            >
              <Upload className="h-4 w-4" />
              Import CSV
            </Button>
          </PermissionGuard>

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

      {/* Import Assets Wizard */}
      <ImportAssetsWizard
        open={isImportOpen}
        onOpenChange={setIsImportOpen}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
