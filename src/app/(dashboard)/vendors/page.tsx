/**
 * Vendors Page
 */

import { VendorsPageClient } from "@/components/vendors/vendors-page-client";
import { listVendorsAction } from "@/interface-adapters/controllers/vendor.controller";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { requireFeatureAndPermission } from "@/lib/features/feature-permission-guard";

export const dynamic = "force-dynamic";

export default async function VendorsPage() {
  await requireFeatureAndPermission(
    "FOUNDATION",
    PERMISSIONS.VENDORS_VIEW,
    "/vendors",
  );

  const result = await listVendorsAction();
  const initialVendors = result.success ? result.data : [];

  return <VendorsPageClient initialVendors={initialVendors} />;
}
