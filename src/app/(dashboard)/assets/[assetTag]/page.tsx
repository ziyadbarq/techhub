/**
 * Asset Detail Page
 */

import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/permissions/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { getAssetAction } from "@/interface-adapters/controllers/asset.controller";
import { AssetDetailPageClient } from "@/components/assets/asset-detail-page-client";
import { handlePermissionRedirect } from "@/lib/permissions/handle-permission-redirect";

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

  try {
    await requirePermission(PERMISSIONS.ASSETS_VIEW);
  } catch (error) {
    handlePermissionRedirect(error, `/assets/${assetTag}`);
    throw error;
  }

  const result = await getAssetAction(assetTag);

  if (!result.success || !result.data) {
    notFound();
  }

  return <AssetDetailPageClient asset={result.data} />;
}
