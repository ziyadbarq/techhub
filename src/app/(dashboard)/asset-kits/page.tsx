/**
 * Asset Kits Page
 */

import { AssetKitsPageClient } from "@/components/asset-kits/asset-kits-page-client";
import { listAssetKitsAction } from "@/interface-adapters/controllers/asset-kit.controller";
import { listKitCheckoutsAction } from "@/interface-adapters/controllers/asset-kit-checkout.controller";
import { requirePermission } from "@/lib/permissions/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { handlePermissionRedirect } from "@/lib/permissions/handle-permission-redirect";
import { requireFeature } from "@/lib/features/server";

export const dynamic = "force-dynamic";

export default async function AssetKitsPage() {
  await requireFeature("ASSET_KITS");

  try {
    await requirePermission(PERMISSIONS.ASSET_KITS_VIEW);
  } catch (error) {
    handlePermissionRedirect(error, "/asset-kits");
    throw error;
  }

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
