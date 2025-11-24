/**
 * Asset Models Page
 */

import { AssetModelsPageClient } from "@/components/asset-models/asset-models-page-client";
import { listAssetModelsAction } from "@/interface-adapters/controllers/asset-model.controller";
import { requirePermission } from "@/lib/permissions/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { handlePermissionRedirect } from "@/lib/permissions/handle-permission-redirect";

export const dynamic = "force-dynamic";

export default async function AssetModelsPage() {
  try {
    await requirePermission(PERMISSIONS.ASSET_MODELS_VIEW);
  } catch (error) {
    handlePermissionRedirect(error, "/asset-models");
    throw error;
  }

  const result = await listAssetModelsAction();
  const initialAssetModels = result.success ? result.data : [];

  return <AssetModelsPageClient initialAssetModels={initialAssetModels} />;
}
