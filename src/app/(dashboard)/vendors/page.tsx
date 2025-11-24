/**
 * Vendors Page
 */

import { VendorsPageClient } from "@/components/vendors/vendors-page-client";
import { listVendorsAction } from "@/interface-adapters/controllers/vendor.controller";
import { requirePermission } from "@/lib/permissions/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { handlePermissionRedirect } from "@/lib/permissions/handle-permission-redirect";

export const dynamic = "force-dynamic";

export default async function VendorsPage() {
  try {
    await requirePermission(PERMISSIONS.VENDORS_VIEW);
  } catch (error) {
    handlePermissionRedirect(error, "/vendors");
    throw error;
  }

  const result = await listVendorsAction();
  const initialVendors = result.success ? result.data : [];

  return <VendorsPageClient initialVendors={initialVendors} />;
}
