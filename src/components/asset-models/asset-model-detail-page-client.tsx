/**
 * Asset Model Detail Page Client Component
 * Displays model details with tabs for Overview, Assets, and Statistics
 */

"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Edit, Trash2, Package, BarChart3 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

import type { AssetModelDTO } from "@/interface-adapters/presenters/asset-model.presenter";
import type { AssetCategoryDTO } from "@/interface-adapters/presenters/asset-category.presenter";
import type { VendorDTO } from "@/interface-adapters/presenters/vendor.presenter";
import type { AssetDTO } from "@/interface-adapters/presenters/asset.presenter";
import {
  deleteAssetModelAction,
  getAssetModelAction,
} from "@/interface-adapters/controllers/asset-model.controller";
import { usePermissions } from "@/hooks/use-permissions";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { AssetModelForm } from "./asset-model-form";
import { ModelOverviewTab } from "./model-overview-tab";
import { ModelAssetsTab } from "./model-assets-tab";
import { ModelStatisticsTab } from "./model-statistics-tab";

interface AssetModelDetailPageClientProps {
  model: AssetModelDTO;
  category: AssetCategoryDTO | null;
  vendor: VendorDTO | null;
  assets: AssetDTO[];
}

export function AssetModelDetailPageClient({
  model: initialModel,
  category,
  vendor,
  assets,
}: AssetModelDetailPageClientProps) {
  const router = useRouter();
  const { hasPermission } = usePermissions();

  const [model, setModel] = useState(initialModel);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const canUpdate = hasPermission(PERMISSIONS.ASSET_MODELS_UPDATE);
  const canDelete = hasPermission(PERMISSIONS.ASSET_MODELS_DELETE);
  const canViewAssets = hasPermission(PERMISSIONS.ASSETS_VIEW);

  const handleFormSuccess = useCallback(async () => {
    // Fetch updated model data to refresh UI immediately
    const result = await getAssetModelAction(model.id);
    if (result.success) {
      setModel(result.data);
    }
    router.refresh();
  }, [model.id, router]);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const result = await deleteAssetModelAction(model.id);
      if (result.success) {
        toast.success("Asset model deleted");
        router.push("/asset-models");
      } else {
        toast.error(result.error || "Failed to delete asset model");
      }
    } catch {
      toast.error("Failed to delete asset model");
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  // Format warranty display
  const formatWarranty = (months: number | null) => {
    if (!months) return null;
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;
    const parts = [];
    if (years > 0) parts.push(`${years} year${years !== 1 ? "s" : ""}`);
    if (remainingMonths > 0)
      parts.push(`${remainingMonths} month${remainingMonths !== 1 ? "s" : ""}`);
    return parts.join(" ");
  };

  return (
    <div className="space-y-6">
      {/* Header with Back Button and Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/asset-models")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold">{model.name}</h1>
              <Badge variant="outline" className="font-mono">
                {model.code}
              </Badge>
            </div>
            <div className="text-muted-foreground mt-1 flex items-center gap-2 text-sm">
              {category && <span>{category.name}</span>}
              {category && vendor && <span>•</span>}
              {vendor && <span>{vendor.name}</span>}
              {model.defaultWarrantyMonths && (
                <>
                  <span>•</span>
                  <Badge variant="secondary" className="text-xs">
                    {formatWarranty(model.defaultWarrantyMonths)} warranty
                  </Badge>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          {canUpdate && (
            <Button variant="outline" onClick={() => setEditDialogOpen(true)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
          )}
          {canDelete && (
            <Button
              variant="destructive"
              onClick={() => setDeleteDialogOpen(true)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          {canViewAssets && (
            <TabsTrigger value="assets" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Assets ({assets.length})
            </TabsTrigger>
          )}
          <TabsTrigger value="statistics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Statistics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <ModelOverviewTab model={model} category={category} vendor={vendor} />
        </TabsContent>

        {canViewAssets && (
          <TabsContent value="assets" className="mt-4">
            <ModelAssetsTab assets={assets} modelId={model.id} />
          </TabsContent>
        )}

        <TabsContent value="statistics" className="mt-4">
          <ModelStatisticsTab assets={assets} model={model} />
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      <AssetModelForm
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSuccess={handleFormSuccess}
        assetModel={model}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Asset Model</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{model.name}&quot;? This
              action cannot be undone.
              {assets.length > 0 && (
                <span className="mt-2 block text-amber-600">
                  Warning: This model has {assets.length} asset
                  {assets.length !== 1 ? "s" : ""} associated with it. You must
                  reassign or delete these assets before deleting this model.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting || assets.length > 0}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
