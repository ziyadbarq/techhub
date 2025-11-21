/**
 * Vendors Page
 */

import { VendorsPageClient } from "@/components/vendors/vendors-page-client";
import { listVendorsAction } from "@/interface-adapters/controllers/vendor.controller";
import { requirePermission } from "@/lib/permissions/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";

export default async function VendorsPage() {
  await requirePermission(PERMISSIONS.VENDORS_VIEW);

  const result = await listVendorsAction();
  const initialVendors = result.success ? result.data : [];

  return <VendorsPageClient initialVendors={initialVendors} />;
}
