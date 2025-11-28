/**
 * Asset Model Detail Page
 * Server component that fetches model data with enriched category and vendor info
 */

import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/permissions/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { getAssetModelAction } from "@/interface-adapters/controllers/asset-model.controller";
import { getAssetCategoryAction } from "@/interface-adapters/controllers/asset-category.controller";
import { getVendorAction } from "@/interface-adapters/controllers/vendor.controller";
import { listAssetsAction } from "@/interface-adapters/controllers/asset.controller";
import { AssetModelDetailPageClient } from "@/components/asset-models/asset-model-detail-page-client";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AssetModelDetailPage({ params }: PageProps) {
  // Await params (Next.js 16 async API)
  const { id } = await params;

  // Server-side permission check
  await requirePermission(PERMISSIONS.ASSET_MODELS_VIEW);

  // Fetch model first
  const modelResult = await getAssetModelAction(id);

  if (!modelResult.success || !modelResult.data) {
    notFound();
  }

  const model = modelResult.data;

  // Fetch related data in parallel
  const [categoryResult, vendorResult, assetsResult] = await Promise.all([
    getAssetCategoryAction(model.assetCategoryId),
    getVendorAction(model.vendorId),
    listAssetsAction({ assetModelId: id }),
  ]);

  const category = categoryResult.success ? categoryResult.data : null;
  const vendor = vendorResult.success ? vendorResult.data : null;
  const assets = assetsResult.success ? assetsResult.data : [];

  return (
    <AssetModelDetailPageClient
      model={model}
      category={category}
      vendor={vendor}
      assets={assets}
    />
  );
}
