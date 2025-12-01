/**
 * Asset Detail Page
 */

import { notFound } from "next/navigation";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { getAssetAction } from "@/interface-adapters/controllers/asset.controller";
import { AssetDetailPageClient } from "@/components/assets/asset-detail-page-client";
import { requireFeatureAndPermission } from "@/lib/features/feature-permission-guard";

export const dynamic = "force-dynamic";

interface AssetDetailPageProps {
  params: Promise<{
    assetTag: string;
  }>;
}

export default async function AssetDetailPage({
  params,
}: AssetDetailPageProps) {
  const { assetTag } = await params;

  await requireFeatureAndPermission(
    "ASSETS",
    PERMISSIONS.ASSETS_VIEW,
    `/assets/${assetTag}`,
  );

  const result = await getAssetAction(assetTag);

  if (!result.success || !result.data) {
    notFound();
  }

  return <AssetDetailPageClient asset={result.data} />;
}
