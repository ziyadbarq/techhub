/**
 * License Entitlements Page
 */

import { LicenseEntitlementsPageClient } from "@/components/license-entitlements/license-entitlements-page-client";
import { requirePermission } from "@/lib/permissions/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { handlePermissionRedirect } from "@/lib/permissions/handle-permission-redirect";

export const dynamic = "force-dynamic";

export default async function LicenseEntitlementsPage() {
  try {
    await requirePermission(PERMISSIONS.LICENSE_ENTITLEMENTS_VIEW);
  } catch (error) {
    handlePermissionRedirect(error, "/license-entitlements");
    throw error;
  }

  return <LicenseEntitlementsPageClient />;
}
