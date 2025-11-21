/**
 * Lifecycle Models Page
 */

import { LifecycleModelsPageClient } from "@/components/lifecycle-models/lifecycle-models-page-client";
import { listLifecycleModelsAction } from "@/interface-adapters/controllers/lifecycle-model.controller";
import { requirePermission } from "@/lib/permissions/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";

export default async function LifecycleModelsPage() {
  await requirePermission(PERMISSIONS.LIFECYCLE_MODELS_VIEW);

  const result = await listLifecycleModelsAction();
  const initialModels = result.success ? result.data : [];

  return <LifecycleModelsPageClient initialModels={initialModels} />;
}
