/**
 * Persons Page
 * Enhanced with directory features (table, cards, org chart views)
 */

import { requirePermission } from "@/lib/permissions/server";
import { handlePermissionRedirect } from "@/lib/permissions/handle-permission-redirect";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { listEmployeeDirectoryAction } from "@/interface-adapters/controllers/employee-directory.controller";
import { PersonsPageClient } from "@/components/persons/persons-page-client";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Persons",
  description: "Manage and browse company employees",
};

export default async function PersonsPage() {
  // Server-side permission check
  try {
    await requirePermission(PERMISSIONS.PERSONS_VIEW);
  } catch (error) {
    handlePermissionRedirect(error, "/persons");
    throw error;
  }

  // Fetch initial employee data using directory action for rich data
  const result = await listEmployeeDirectoryAction({ isActive: true });

  const initialPersons = result.success ? result.data.employees : [];
  const initialTotal = result.success ? result.data.total : 0;

  return (
    <PersonsPageClient
      initialPersons={initialPersons}
      initialTotal={initialTotal}
    />
  );
}
