/**
 * Asset Categories Page Client Component
 */

"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import type { AssetCategoryDTO } from "@/interface-adapters/presenters/asset-category.presenter";
import { listAssetCategoriesAction } from "@/interface-adapters/controllers/asset-category.controller";
import { AssetCategoriesTable } from "./asset-categories-table";
import { AssetCategoryForm } from "./asset-category-form";
import { PermissionGuard } from "@/components/auth/PermissionGuard";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";

interface AssetCategoriesPageClientProps {
  initialAssetCategories: AssetCategoryDTO[];
}

export function AssetCategoriesPageClient({
  initialAssetCategories,
}: AssetCategoriesPageClientProps) {
  const [assetCategories, setAssetCategories] = useState<AssetCategoryDTO[]>(
    initialAssetCategories,
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAssetCategory, setEditingAssetCategory] =
    useState<AssetCategoryDTO | null>(null);

  const loadAssetCategories = async () => {
    setIsLoading(true);
    try {
      const result = await listAssetCategoriesAction();
      if (result.success) {
        setAssetCategories(result.data);
      } else {
        toast.error(result.error);
      }
    } catch (_error) {
      toast.error("Failed to load asset categories");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (assetCategory: AssetCategoryDTO) => {
    setEditingAssetCategory(assetCategory);
    setIsFormOpen(true);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingAssetCategory(null);
  };

  const handleSuccess = () => {
    loadAssetCategories();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-2xl font-bold">Asset Categories</h2>
          <p className="text-muted-foreground">
            {assetCategories.length} categor
            {assetCategories.length !== 1 ? "ies" : "y"}
          </p>
        </div>

        <PermissionGuard permission={PERMISSIONS.ASSET_CATEGORIES_CREATE}>
          <Button
            onClick={() => setIsFormOpen(true)}
            className="bg-barq-yellow text-barq-black hover:bg-barq-yellow/90 gap-2"
          >
            <Plus className="h-4 w-4" />
            New Asset Category
          </Button>
        </PermissionGuard>
      </div>

      {/* Asset Categories Table */}
      <AssetCategoriesTable
        data={assetCategories}
        loading={isLoading}
        onEdit={handleEdit}
        onRefresh={handleSuccess}
      />

      {/* Asset Category Form Dialog */}
      <AssetCategoryForm
        open={isFormOpen}
        onOpenChange={handleFormClose}
        onSuccess={handleSuccess}
        assetCategory={editingAssetCategory}
      />
    </div>
  );
}
