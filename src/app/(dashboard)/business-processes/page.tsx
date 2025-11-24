/**
 * Business Processes Page
 */

import { BusinessProcessesPageClient } from "@/components/services/business-processes-page-client";
import { requirePermission } from "@/lib/permissions/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { handlePermissionRedirect } from "@/lib/permissions/handle-permission-redirect";
import { requireFeature } from "@/lib/features/server";

export const dynamic = "force-dynamic";

export default async function BusinessProcessesPage() {
  await requireFeature("SERVICES");

  try {
    await requirePermission(PERMISSIONS.BUSINESS_PROCESSES_VIEW);
  } catch (error) {
    handlePermissionRedirect(error, "/business-processes");
    throw error;
  }

  return <BusinessProcessesPageClient />;
}
