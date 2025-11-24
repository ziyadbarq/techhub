/**
 * License Products Page
 */

import { LicenseProductsPageClient } from "@/components/license-products/license-products-page-client";
import { requirePermission } from "@/lib/permissions/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { handlePermissionRedirect } from "@/lib/permissions/handle-permission-redirect";

export const dynamic = "force-dynamic";

export default async function LicenseProductsPage() {
  try {
    await requirePermission(PERMISSIONS.LICENSE_PRODUCTS_VIEW);
  } catch (error) {
    handlePermissionRedirect(error, "/license-products");
    throw error;
  }

  return <LicenseProductsPageClient />;
}
