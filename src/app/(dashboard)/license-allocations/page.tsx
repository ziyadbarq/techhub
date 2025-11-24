/**
 * License Allocations Page
 */

import { LicenseAllocationsPageClient } from "@/components/license-allocations/license-allocations-page-client";
import { requirePermission } from "@/lib/permissions/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { handlePermissionRedirect } from "@/lib/permissions/handle-permission-redirect";

export const dynamic = "force-dynamic";

export default async function LicenseAllocationsPage() {
  try {
    await requirePermission(PERMISSIONS.LICENSE_ALLOCATIONS_VIEW);
  } catch (error) {
    handlePermissionRedirect(error, "/license-allocations");
    throw error;
  }

  return <LicenseAllocationsPageClient />;
}
