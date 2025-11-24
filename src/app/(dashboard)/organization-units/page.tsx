/**
 * Organization Units Page
 */

import { OrganizationUnitsPageClient } from "@/components/organization-units/organization-units-page-client";
import { listOrganizationUnitsAction } from "@/interface-adapters/controllers/organization-unit.controller";
import { requirePermission } from "@/lib/permissions/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { handlePermissionRedirect } from "@/lib/permissions/handle-permission-redirect";

export const dynamic = "force-dynamic";

export default async function OrganizationUnitsPage() {
  try {
    await requirePermission(PERMISSIONS.ORGANIZATION_UNITS_VIEW);
  } catch (error) {
    handlePermissionRedirect(error, "/organization-units");
    throw error;
  }

  const result = await listOrganizationUnitsAction();
  const initialUnits = result.success ? result.data : [];

  return <OrganizationUnitsPageClient initialUnits={initialUnits} />;
}
