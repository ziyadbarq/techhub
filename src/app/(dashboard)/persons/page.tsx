/**
 * Persons Page
 * Enhanced with directory features (table, cards, org chart views)
 * Supports viewing active and disabled users via status tabs
 */

import { hasPermission } from "@/lib/permissions/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { listEmployeeDirectoryAction } from "@/interface-adapters/controllers/employee-directory.controller";
import { PersonsPageClient } from "@/components/persons/persons-page-client";
import { requireFeatureAndPermission } from "@/lib/features/feature-permission-guard";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Persons",
  description: "Manage and browse company employees",
};

export default async function PersonsPage() {
  await requireFeatureAndPermission(
    "FOUNDATION",
    PERMISSIONS.PERSONS_VIEW,
    "/persons",
  );

  // Check if user can manage persons (for showing disable/enable actions)
  const canManage = await hasPermission(PERMISSIONS.PERSONS_MANAGE);

  // Fetch initial employee data using directory action for rich data
  // Filter by isActive: true AND isExcluded: false to match "Active" tab behavior
  const result = await listEmployeeDirectoryAction({
    isActive: true,
    isExcluded: false,
    take: 100,
  });

  const initialPersons = result.success ? result.data.employees : [];
  const initialTotal = result.success ? result.data.total : 0;

  return (
    <PersonsPageClient
      initialPersons={initialPersons}
      initialTotal={initialTotal}
      canManagePersons={canManage}
    />
  );
}
