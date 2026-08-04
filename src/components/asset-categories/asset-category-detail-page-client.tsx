/**
 * Asset Category Detail Page Client Component
 * Displays category details with tabs for Overview, Custom Fields, Models, and Assets
 */

"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Edit, Trash2, Layers, Package, Box } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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

import type { AssetCategoryDTO } from "@/interface-adapters/presenters/asset-category.presenter";
import type { EnrichedAssetCategoryFieldDTO } from "@/interface-adapters/presenters/asset-category-field.presenter";
import type { FieldDefinitionDTO } from "@/interface-adapters/presenters/field-definition.presenter";
import type { AssetModelDTO } from "@/interface-adapters/presenters/asset-model.presenter";
import type { AssetDTO } from "@/interface-adapters/presenters/asset.presenter";
import {
  deleteAssetCategoryAction,
  getAssetCategoryAction,
} from "@/interface-adapters/controllers/asset-category.controller";
import { usePermissions } from "@/hooks/use-permissions";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { AssetCategoryForm } from "./asset-category-form";
import { CategoryOverviewTab } from "./category-overview-tab";
import { CategoryFieldsTab } from "./category-fields-tab";
import { CategoryModelsTab } from "./category-models-tab";
import { CategoryAssetsTab } from "./category-assets-tab";
import {
  CountedTabs,
  type CountedTabConfig,
} from "@/components/ui/counted-tabs";

interface AssetCategoryDetailPageClientProps {
  category: AssetCategoryDTO;
  attachedFields: EnrichedAssetCategoryFieldDTO[];
  fieldDefinitions: FieldDefinitionDTO[];
  models: AssetModelDTO[];
  assets: AssetDTO[];
}

export function AssetCategoryDetailPageClient({
  category: initialCategory,
  attachedFields: initialFields,
  fieldDefinitions,
  models,
  assets,
}: AssetCategoryDetailPageClientProps) {
  const router = useRouter();
  const { hasPermission } = usePermissions();

  const [category, setCategory] = useState(initialCategory);
  const [attachedFields, setAttachedFields] =
    useState<EnrichedAssetCategoryFieldDTO[]>(initialFields);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const canUpdate = hasPermission(PERMISSIONS.ASSET_CATEGORIES_UPDATE);
  const canDelete = hasPermission(PERMISSIONS.ASSET_CATEGORIES_DELETE);

  const goBack = () => {
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
  const canManageFields = hasPermission(PERMISSIONS.ASSET_CATEGORY_FIELDS_VIEW);
  const canViewModels = hasPermission(PERMISSIONS.ASSET_MODELS_VIEW);
  const canViewAssets = hasPermission(PERMISSIONS.ASSETS_VIEW);
  const handleFieldsChange = (fields: EnrichedAssetCategoryFieldDTO[]) => {
    setAttachedFields(fields);
  };
  const tabs: CountedTabConfig[] = [
    {
      value: "overview",
      label: "Overview",
      content: <CategoryOverviewTab category={category} />,
      showWhenZero: true,
    },
    {
      value: "models",
      label: "Models",
      icon: Package,
      count: models.length,
      canView: canViewModels,
      content: <CategoryModelsTab models={models} categoryId={category.id} />,
      triggerClassName: "flex items-center gap-2",
    },
    {
      value: "assets",
      label: "Assets",
      icon: Box,
      count: assets.length,
      canView: canViewAssets,
      content: <CategoryAssetsTab assets={assets} categoryId={category.id} />,
      triggerClassName: "flex items-center gap-2",
    },
    {
      value: "fields",
      label: "Custom Fields",
      icon: Layers,
      count: attachedFields.length,
      canView: canManageFields,
      content: (
        <CategoryFieldsTab
          category={category}
          attachedFields={attachedFields}
          fieldDefinitions={fieldDefinitions}
          onFieldsChange={handleFieldsChange}
        />
      ),
      triggerClassName: "flex items-center gap-2",
    },
  ];

  const handleFormSuccess = useCallback(async () => {
    // Fetch updated category data to refresh UI immediately
    const result = await getAssetCategoryAction(category.id);
    if (result.success) {
      setCategory(result.data);
    }
    router.refresh();
  }, [category.id, router]);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const result = await deleteAssetCategoryAction(category.id);
      if (result.success) {
        toast.success("Asset category deleted");
        router.push("/asset-categories");
      } else {
        toast.error(result.error || "Failed to delete asset category");
      }
    } catch {
      toast.error("Failed to delete asset category");
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Back Button and Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={goBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold">{category.name}</h1>
              <Badge variant="outline" className="font-mono">
                {category.code}
              </Badge>
            </div>
            <div className="mt-1 flex items-center gap-2">
              <span className="text-muted-foreground text-sm">
                {attachedFields.length} custom field
                {attachedFields.length !== 1 ? "s" : ""}
              </span>
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

      <CountedTabs defaultValue="overview" tabs={tabs} tabsClassName="w-full" />

      {/* Edit Dialog */}
      <AssetCategoryForm
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSuccess={handleFormSuccess}
        assetCategory={category}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Asset Category</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{category.name}&quot;? This
              action cannot be undone.
              {attachedFields.length > 0 && (
                <span className="mt-2 block text-amber-600">
                  Warning: This category has {attachedFields.length} custom
                  field{attachedFields.length !== 1 ? "s" : ""} attached.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
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
