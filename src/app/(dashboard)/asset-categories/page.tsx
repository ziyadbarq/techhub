/**
 * Asset Categories Page
 */

import { AssetCategoriesPageClient } from "@/components/asset-categories/asset-categories-page-client";
import { listAssetCategoriesAction } from "@/interface-adapters/controllers/asset-category.controller";
import { requirePermission } from "@/lib/permissions/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { handlePermissionRedirect } from "@/lib/permissions/handle-permission-redirect";

export const dynamic = "force-dynamic";

export default async function AssetCategoriesPage() {
  try {
    await requirePermission(PERMISSIONS.ASSET_CATEGORIES_VIEW);
  } catch (error) {
    handlePermissionRedirect(error, "/asset-categories");
    throw error;
  }

  const result = await listAssetCategoriesAction();
  const initialAssetCategories = result.success ? result.data : [];

  return (
    <AssetCategoriesPageClient
      initialAssetCategories={initialAssetCategories}
    />
  );
}
