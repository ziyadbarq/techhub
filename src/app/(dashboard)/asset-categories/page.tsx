/**
 * Asset Categories Page
 */

import { AssetCategoriesPageClient } from "@/components/asset-categories/asset-categories-page-client";
import { listAssetCategoriesAction } from "@/interface-adapters/controllers/asset-category.controller";
import { requirePermission } from "@/lib/permissions/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";

export const dynamic = "force-dynamic";

export default async function AssetCategoriesPage() {
  await requirePermission(PERMISSIONS.ASSET_CATEGORIES_VIEW);

  const result = await listAssetCategoriesAction();
  const initialAssetCategories = result.success ? result.data : [];

  return (
    <AssetCategoriesPageClient
      initialAssetCategories={initialAssetCategories}
    />
  );
}
