/**
 * CMDB Health Dashboard Page
 *
 * Displays data quality metrics for the CMDB including completeness,
 * freshness, orphan rate, and ownership compliance.
 */

import { redirect } from "next/navigation";
import { requireFeature } from "@/lib/features/server";
import { FEATURE_FLAGS } from "@/lib/features/feature-flag-keys";
import { requirePermission } from "@/lib/permissions/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { handlePermissionRedirect } from "@/lib/permissions/handle-permission-redirect";
import { CMDBHealthDashboard } from "@/components/cmdb/cmdb-health-dashboard";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "CMDB Health Dashboard",
};

export default async function CMDBHealthPage() {
  try {
    await requireFeature(FEATURE_FLAGS.CMDB);
    await requirePermission(PERMISSIONS.CONFIGURATION_ITEMS_VIEW);
  } catch (error) {
    handlePermissionRedirect(error, "/admin/cmdb-health");
    redirect("/unauthorized");
  }

  return <CMDBHealthDashboard />;
}
