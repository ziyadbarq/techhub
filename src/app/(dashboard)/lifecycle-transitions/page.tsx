/**
 * Lifecycle Transitions Page
 */

import { LifecycleTransitionsPageClient } from "@/components/lifecycle-transitions/lifecycle-transitions-page-client";
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

  return (
    <LifecycleTransitionsPageClient initialTransitions={initialTransitions} />
  );
}
