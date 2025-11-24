/**
 * Lifecycle Transitions Page
 */

import { LifecycleTransitionsPageClient } from "@/components/lifecycle-transitions/lifecycle-transitions-page-client";
import { listLifecycleTransitionsAction } from "@/interface-adapters/controllers/lifecycle-transition.controller";
import { requirePermission } from "@/lib/permissions/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { handlePermissionRedirect } from "@/lib/permissions/handle-permission-redirect";

export const dynamic = "force-dynamic";

export default async function LifecycleTransitionsPage() {
  try {
    await requirePermission(PERMISSIONS.LIFECYCLE_TRANSITIONS_VIEW);
  } catch (error) {
    handlePermissionRedirect(error, "/lifecycle-transitions");
    throw error;
  }

  const result = await listLifecycleTransitionsAction();
  const initialTransitions = result.success ? result.data : [];

  return (
    <LifecycleTransitionsPageClient initialTransitions={initialTransitions} />
  );
}
