/**
 * Assets Page
 *
 * Server component that fetches initial data for the assets page:
 * - Paginated assets list
 * - Asset statistics for summary cards
 * - Filter options (categories, statuses, locations, vendors)
 */

import { AssetsPageClient } from "@/components/assets/assets-page-client";
import {
  listAssetsPaginatedAction,
  getAssetStatisticsAction,
  getAssetFilterOptionsAction,
} from "@/interface-adapters/controllers/asset.controller";
import { requirePermission } from "@/lib/permissions/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { handlePermissionRedirect } from "@/lib/permissions/handle-permission-redirect";

export const dynamic = "force-dynamic";

export default async function AssetsPage() {
  try {
    await requirePermission(PERMISSIONS.ASSETS_VIEW);
  } catch (error) {
    handlePermissionRedirect(error, "/assets");
    throw error;
  }

  // Fetch initial data in parallel for better performance
  const [assetsResult, statisticsResult, filterOptionsResult] =
    await Promise.all([
      listAssetsPaginatedAction(undefined, { page: 1, pageSize: 20 }),
      getAssetStatisticsAction(),
      getAssetFilterOptionsAction(),
    ]);

  return (
    <AssetsPageClient
      initialData={assetsResult.success ? assetsResult.data : undefined}
      initialStatistics={
        statisticsResult.success ? statisticsResult.data : undefined
      }
      initialFilterOptions={
        filterOptionsResult.success ? filterOptionsResult.data : undefined
      }
    />
  );
}
