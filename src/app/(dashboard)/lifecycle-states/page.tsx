/**
 * Lifecycle States Page
 */

import { LifecycleStatesPageClient } from "@/components/lifecycle-states/lifecycle-states-page-client";
import { listLifecycleModelsAction } from "@/interface-adapters/controllers/lifecycle-model.controller";
import { listLifecycleStatesAction } from "@/interface-adapters/controllers/lifecycle-state.controller";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { requireFeatureAndPermission } from "@/lib/features/feature-permission-guard";

export const dynamic = "force-dynamic";

export default async function LifecycleStatesPage() {
  await requireFeatureAndPermission(
    "FOUNDATION",
    PERMISSIONS.LIFECYCLE_STATES_VIEW,
    "/lifecycle-states",
  );

  const result = await listLifecycleStatesAction();
  const initialStates = result.success ? result.data : [];
  const modelsResult = await listLifecycleModelsAction();
  const models = modelsResult.success ? modelsResult.data : [];

  return (
    <LifecycleStatesPageClient initialStates={initialStates} models={models} />
  );
}
