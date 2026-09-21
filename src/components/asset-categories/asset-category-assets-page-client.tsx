/**
 * Asset Category Assets Page Client Component
 */

"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, FolderTree, Plus } from "lucide-react";
import { toast } from "sonner";

import { PermissionGuard } from "@/components/auth/PermissionGuard";
import { AssetForm } from "@/components/assets/asset-form";
import { AssetsTable } from "@/components/assets/assets-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { listAssetsAction } from "@/interface-adapters/controllers/asset.controller";
import type { AssetCategoryDTO } from "@/interface-adapters/presenters/asset-category.presenter";
import type { AssetDTO } from "@/interface-adapters/presenters/asset.presenter";

interface AssetCategoryAssetsPageClientProps {
  category: AssetCategoryDTO;
  initialAssets: AssetDTO[];
}

export function AssetCategoryAssetsPageClient({
  category,
  initialAssets,
}: AssetCategoryAssetsPageClientProps) {
  const router = useRouter();
  const [assets, setAssets] = useState<AssetDTO[]>(initialAssets);
  const [isLoading, setIsLoading] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<AssetDTO | null>(null);

  const goBack = () => {
    // Prefer real browser history so we land back on whichever page the
    // user came from (Asset Models, Assets, or Asset Categories). Fall
    // back to the categories list on direct URL entry (no referrer).
    if (
      typeof window !== "undefined" &&
      window.history.length > 1 &&
      document.referrer.startsWith(window.location.origin)
    ) {
      router.back();
    } else {
      router.push("/asset-categories");
    }
  };

  const loadAssets = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await listAssetsAction({ assetCategoryId: category.id });
      if (result.success && result.data) {
        setAssets(result.data);
      } else if (!result.success) {
        toast.error(result.error);
      }
    } catch {
      toast.error("Failed to load category assets");
    } finally {
      setIsLoading(false);
    }
  }, [category.id]);

  const handleEdit = (asset: AssetDTO) => {
    setEditingAsset(asset);
    setIsFormOpen(true);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingAsset(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div className="space-y-3">
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 px-0"
            onClick={goBack}
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-2xl font-bold">{category.name} Assets</h2>
              <Badge variant="outline">{category.code}</Badge>
            </div>
            <p className="text-muted-foreground">
              {assets.length.toLocaleString()} asset
              {assets.length !== 1 ? "s" : ""} in this category
            </p>
          </div>
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

      <Card>
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-muted text-muted-foreground flex h-10 w-10 items-center justify-center rounded-md">
              <FolderTree className="h-5 w-5" />
            </div>
            <div>
              <p className="font-medium">{category.name}</p>
              <p className="text-muted-foreground text-sm">
                Showing only assets assigned to this category.
              </p>
            </div>
          </div>
          <Badge variant="secondary">
            {assets.length.toLocaleString()} total
          </Badge>
        </CardContent>
      </Card>

      <AssetsTable
        data={assets}
        loading={isLoading}
        onEdit={handleEdit}
        onRefresh={loadAssets}
        detailReturnTo={`/asset-categories/${category.id}/assets`}
      />

      <AssetForm
        open={isFormOpen}
        onOpenChange={handleFormClose}
        onSuccess={loadAssets}
        asset={editingAsset}
        initialAssetCategoryId={category.id}
      />
    </div>
  );
}
