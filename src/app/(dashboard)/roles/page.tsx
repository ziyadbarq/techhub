/**
 * Business Roles List Page
 *
 * Server component for viewing business roles in the organization.
 * Shows only active roles (excludes inactive).
 */

import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { listRolesAction } from "@/interface-adapters/controllers/role.controller";
import { RolesPageClient } from "@/components/roles/business/roles-page-client";
import { requireFeatureAndPermission } from "@/lib/features/feature-permission-guard";

export const dynamic = "force-dynamic";

export default async function RolesPage() {
  await requireFeatureAndPermission(
    "FOUNDATION",
    PERMISSIONS.ROLES_VIEW,
    "/roles",
  );

  // Fetch all roles
  const result = await listRolesAction();

  // Filter to active roles only (per requirements)
  const activeRoles = result.success
    ? result.data.filter((r) => r.isActive)
    : [];

  return <RolesPageClient roles={activeRoles} />;
}
