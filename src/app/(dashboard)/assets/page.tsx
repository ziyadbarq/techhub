/**
 * Assets Page
 *
 * Server component that fetches initial data for the assets page.
 */

import { AssetsPageClient } from "@/components/assets/assets-page-client";
import {
  listAssetsAction,
  getAssetStatisticsAction,
  getAssetFilterOptionsAction,
} from "@/interface-adapters/controllers/asset.controller";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { requireFeatureAndPermission } from "@/lib/features/feature-permission-guard";

export const dynamic = "force-dynamic";

interface AssetsPageProps {
  searchParams: Promise<{
    assetCategoryId?: string;
  }>;
}

export default async function AssetsPage({ searchParams }: AssetsPageProps) {
  const params = await searchParams;

  await requireFeatureAndPermission(
    "ASSETS",
    PERMISSIONS.ASSETS_VIEW,
    "/assets",
  );

  // Fetch initial data in parallel for better performance
  const [assetsResult, statisticsResult, filterOptionsResult] =
    await Promise.all([
      listAssetsAction(),
      getAssetStatisticsAction(),
      getAssetFilterOptionsAction(),
    ]);

  return (
    <AssetsPageClient
      initialAssets={assetsResult.success ? assetsResult.data : []}
      initialStatistics={
        statisticsResult.success ? statisticsResult.data : undefined
      }
      initialFilterOptions={
        filterOptionsResult.success ? filterOptionsResult.data : undefined
      }
      initialAssetCategoryId={params.assetCategoryId}
    />
  );
}
