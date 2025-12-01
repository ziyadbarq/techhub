/**
 * Lifecycle Models Page
 */

import { LifecycleModelsPageClient } from "@/components/lifecycle-models/lifecycle-models-page-client";
import { listLifecycleModelsAction } from "@/interface-adapters/controllers/lifecycle-model.controller";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { requireFeatureAndPermission } from "@/lib/features/feature-permission-guard";

export const dynamic = "force-dynamic";

export default async function LifecycleModelsPage() {
  await requireFeatureAndPermission(
    "FOUNDATION",
    PERMISSIONS.LIFECYCLE_MODELS_VIEW,
    "/lifecycle-models",
  );

  const result = await listLifecycleModelsAction();
  const initialModels = result.success ? result.data : [];

  return <LifecycleModelsPageClient initialModels={initialModels} />;
}
