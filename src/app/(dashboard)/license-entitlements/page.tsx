/**
 * License Entitlements Page
 */

import { LicenseEntitlementsPageClient } from "@/components/license-entitlements/license-entitlements-page-client";
import { requirePermission } from "@/lib/permissions/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";

export const dynamic = "force-dynamic";

export default async function LicenseEntitlementsPage() {
  await requirePermission(PERMISSIONS.LICENSE_ENTITLEMENTS_VIEW);

  return <LicenseEntitlementsPageClient />;
}
