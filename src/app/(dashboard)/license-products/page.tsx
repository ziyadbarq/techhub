/**
 * License Products Page
 */

import { LicenseProductsPageClient } from "@/components/license-products/license-products-page-client";
import { requirePermission } from "@/lib/permissions/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";

export const dynamic = "force-dynamic";

export default async function LicenseProductsPage() {
  await requirePermission(PERMISSIONS.LICENSE_PRODUCTS_VIEW);

  return <LicenseProductsPageClient />;
}
