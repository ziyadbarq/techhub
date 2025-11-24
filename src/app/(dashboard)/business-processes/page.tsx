/**
 * Business Processes Page
 */

import { BusinessProcessesPageClient } from "@/components/services/business-processes-page-client";
import { requirePermission } from "@/lib/permissions/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { handlePermissionRedirect } from "@/lib/permissions/handle-permission-redirect";

export const dynamic = "force-dynamic";

export default async function BusinessProcessesPage() {
  try {
    await requirePermission(PERMISSIONS.BUSINESS_PROCESSES_VIEW);
  } catch (error) {
    handlePermissionRedirect(error, "/business-processes");
    throw error;
  }

  return <BusinessProcessesPageClient />;
}
