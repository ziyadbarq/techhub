/**
 * Assets Page
 */

import { AssetsPageClient } from "@/components/assets/assets-page-client";
import { listAssetsAction } from "@/interface-adapters/controllers/asset.controller";
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

  const result = await listAssetsAction();
  const initialAssets = result.success ? result.data : [];

  return <AssetsPageClient initialAssets={initialAssets} />;
}
