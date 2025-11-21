/**
 * Asset Detail Page
 */

import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/permissions/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { getAssetAction } from "@/interface-adapters/controllers/asset.controller";
import { AssetDetailPageClient } from "@/components/assets/asset-detail-page-client";

export const dynamic = "force-dynamic";

interface AssetDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function AssetDetailPage({
  params,
}: AssetDetailPageProps) {
  const { id } = await params;

  await requirePermission(PERMISSIONS.ASSETS_VIEW);

  const result = await getAssetAction(id);

  if (!result.success || !result.data) {
    notFound();
  }

  return <AssetDetailPageClient asset={result.data} />;
}
