/**
 * Asset Kits Page
 */

import { AssetKitsPageClient } from "@/components/asset-kits/asset-kits-page-client";
import {
  listAssetKitsAction,
  listKitCheckoutsAction,
} from "@/interface-adapters/controllers/asset-kit.controller";
import { requirePermission } from "@/lib/permissions/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";

export const dynamic = "force-dynamic";

export default async function AssetKitsPage() {
  await requirePermission(PERMISSIONS.ASSET_KITS_VIEW);

  const [kitsResult, checkoutsResult] = await Promise.all([
    listAssetKitsAction(),
    listKitCheckoutsAction(),
  ]);

  const initialKits = kitsResult.success ? kitsResult.data : [];
  const initialCheckouts = checkoutsResult.success ? checkoutsResult.data : [];

  return (
    <AssetKitsPageClient
      initialKits={initialKits}
      initialCheckouts={initialCheckouts}
    />
  );
}
