/**
 * Lifecycle States Page
 */

import { LifecycleStatesPageClient } from "@/components/lifecycle-states/lifecycle-states-page-client";
import { listLifecycleStatesAction } from "@/interface-adapters/controllers/lifecycle-state.controller";
import { requirePermission } from "@/lib/permissions/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { handlePermissionRedirect } from "@/lib/permissions/handle-permission-redirect";

export const dynamic = "force-dynamic";

export default async function LifecycleStatesPage() {
  try {
    await requirePermission(PERMISSIONS.LIFECYCLE_STATES_VIEW);
  } catch (error) {
    handlePermissionRedirect(error, "/lifecycle-states");
    throw error;
  }

  const result = await listLifecycleStatesAction();
  const initialStates = result.success ? result.data : [];

  return <LifecycleStatesPageClient initialStates={initialStates} />;
}
