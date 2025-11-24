/**
 * Business Processes Page
 */

import { BusinessProcessesPageClient } from "@/components/services/business-processes-page-client";
import { requirePermission } from "@/lib/permissions/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";

export const dynamic = "force-dynamic";

export default async function BusinessProcessesPage() {
  await requirePermission(PERMISSIONS.BUSINESS_PROCESSES_VIEW);

  return <BusinessProcessesPageClient />;
}
