/**
 * Asset Categories Page
 */

import { AssetCategoriesPageClient } from "@/components/asset-categories/asset-categories-page-client";
import { listAssetCategoriesAction } from "@/interface-adapters/controllers/asset-category.controller";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { requireFeatureAndPermission } from "@/lib/features/feature-permission-guard";

export const dynamic = "force-dynamic";

export default async function AssetCategoriesPage() {
  await requireFeatureAndPermission(
    "ASSETS",
    PERMISSIONS.ASSET_CATEGORIES_VIEW,
    "/asset-categories",
  );

  const result = await listAssetCategoriesAction();
  const initialAssetCategories = result.success ? result.data : [];

  return (
    <AssetCategoriesPageClient
      initialAssetCategories={initialAssetCategories}
    />
  );
}
