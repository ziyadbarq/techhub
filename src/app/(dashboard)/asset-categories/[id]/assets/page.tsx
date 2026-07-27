/**
 * Asset Category Assets Page
 * Server component that shows assets scoped to a single asset category.
 */

import { notFound } from "next/navigation";

import { AssetCategoryAssetsPageClient } from "@/components/asset-categories/asset-category-assets-page-client";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { getAssetCategoryAction } from "@/interface-adapters/controllers/asset-category.controller";
import { listAssetsAction } from "@/interface-adapters/controllers/asset.controller";
import { requireFeatureAndPermission } from "@/lib/features/feature-permission-guard";
import { requirePermission } from "@/lib/permissions/server";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AssetCategoryAssetsPage({ params }: PageProps) {
  const { id } = await params;

  await requireFeatureAndPermission(
    "ASSETS",
    PERMISSIONS.ASSETS_VIEW,
    `/asset-categories/${id}/assets`,
  );
  await requirePermission(PERMISSIONS.ASSET_CATEGORIES_VIEW);

  const [categoryResult, assetsResult] = await Promise.all([
    getAssetCategoryAction(id),
    listAssetsAction({ assetCategoryId: id }),
  ]);

  if (!categoryResult.success || !categoryResult.data) {
    notFound();
  }

  return (
    <AssetCategoryAssetsPageClient
      category={categoryResult.data}
      initialAssets={assetsResult.success ? assetsResult.data : []}
    />
  );
}
