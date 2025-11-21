/**
 * Lifecycle States Page
 */

import { LifecycleStatesPageClient } from "@/components/lifecycle-states/lifecycle-states-page-client";
import { listLifecycleStatesAction } from "@/interface-adapters/controllers/lifecycle-state.controller";
import { requirePermission } from "@/lib/permissions/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";

export default async function LifecycleStatesPage() {
  await requirePermission(PERMISSIONS.LIFECYCLE_STATES_VIEW);

  const result = await listLifecycleStatesAction();
  const initialStates = result.success ? result.data : [];

  return <LifecycleStatesPageClient initialStates={initialStates} />;
}
