/**
 * Lifecycle Transitions Page
 */

import { LifecycleTransitionsPageClient } from "@/components/lifecycle-transitions/lifecycle-transitions-page-client";
import { listLifecycleModelsAction } from "@/interface-adapters/controllers/lifecycle-model.controller";
import { listLifecycleStatesAction } from "@/interface-adapters/controllers/lifecycle-state.controller";
import { listLifecycleTransitionsAction } from "@/interface-adapters/controllers/lifecycle-transition.controller";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { requireFeatureAndPermission } from "@/lib/features/feature-permission-guard";

export const dynamic = "force-dynamic";

export default async function LifecycleTransitionsPage() {
  await requireFeatureAndPermission(
    "FOUNDATION",
    PERMISSIONS.LIFECYCLE_TRANSITIONS_VIEW,
    "/lifecycle-transitions",
  );

  const result = await listLifecycleTransitionsAction();
  const initialTransitions = result.success ? result.data : [];
  const modelsResult = await listLifecycleModelsAction();
  const models = modelsResult.success ? modelsResult.data : [];
  const statesResult = await listLifecycleStatesAction();
  const states = statesResult.success ? statesResult.data : [];

  return (
    <LifecycleTransitionsPageClient
      initialTransitions={initialTransitions}
      models={models}
      states={states}
    />
  );
}
