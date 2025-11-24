/**
 * Asset Disposals Page
 */

import { AssetDisposalsPageClient } from "@/components/asset-disposals/asset-disposals-page-client";
import { listAssetDisposalsAction } from "@/interface-adapters/controllers/asset-disposal.controller";
import { requirePermission } from "@/lib/permissions/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { handlePermissionRedirect } from "@/lib/permissions/handle-permission-redirect";

export const dynamic = "force-dynamic";

export default async function AssetDisposalsPage() {
  try {
    await requirePermission(PERMISSIONS.ASSET_DISPOSALS_VIEW);
  } catch (error) {
    handlePermissionRedirect(error, "/asset-disposals");
    throw error;
  }

  const result = await listAssetDisposalsAction();
  const initialDisposals = result.success ? result.data : [];

  return <AssetDisposalsPageClient initialDisposals={initialDisposals} />;
}
