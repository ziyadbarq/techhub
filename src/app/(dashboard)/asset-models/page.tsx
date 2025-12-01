/**
 * Asset Models Page
 */

import { AssetModelsPageClient } from "@/components/asset-models/asset-models-page-client";
import { listAssetModelsAction } from "@/interface-adapters/controllers/asset-model.controller";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { requireFeatureAndPermission } from "@/lib/features/feature-permission-guard";

export const dynamic = "force-dynamic";

export default async function AssetModelsPage() {
  await requireFeatureAndPermission(
    "ASSETS",
    PERMISSIONS.ASSET_MODELS_VIEW,
    "/asset-models",
  );

  const result = await listAssetModelsAction();
  const initialAssetModels = result.success ? result.data : [];

  return <AssetModelsPageClient initialAssetModels={initialAssetModels} />;
}
