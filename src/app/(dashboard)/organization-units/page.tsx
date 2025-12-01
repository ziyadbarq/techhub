/**
 * Organization Units Page
 */

import { OrganizationUnitsPageClient } from "@/components/organization-units/organization-units-page-client";
import { listOrganizationUnitsAction } from "@/interface-adapters/controllers/organization-unit.controller";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { requireFeatureAndPermission } from "@/lib/features/feature-permission-guard";

export const dynamic = "force-dynamic";

export default async function OrganizationUnitsPage() {
  await requireFeatureAndPermission(
    "FOUNDATION",
    PERMISSIONS.ORGANIZATION_UNITS_VIEW,
    "/organization-units",
  );

  const result = await listOrganizationUnitsAction();
  const initialUnits = result.success ? result.data : [];

  return <OrganizationUnitsPageClient initialUnits={initialUnits} />;
}
