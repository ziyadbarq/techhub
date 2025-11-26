/**
 * Employee Directory Page
 * Server component with permission check and initial data fetch
 */

import { requirePermission } from "@/lib/permissions/server";
import { handlePermissionRedirect } from "@/lib/permissions/handle-permission-redirect";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { listEmployeeDirectoryAction } from "@/interface-adapters/controllers/employee-directory.controller";
import { DirectoryPageClient } from "@/components/employee-directory";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Employee Directory",
  description: "Browse and search company employees",
};

export default async function DirectoryPage() {
  // Server-side permission check
  try {
    await requirePermission(PERMISSIONS.PERSONS_VIEW);
  } catch (error) {
    handlePermissionRedirect(error, "/directory");
    throw error;
  }

  // Fetch initial employee data
  const result = await listEmployeeDirectoryAction({ isActive: true });

  const initialEmployees = result.success ? result.data.employees : [];
  const initialTotal = result.success ? result.data.total : 0;

  return (
    <DirectoryPageClient
      initialEmployees={initialEmployees}
      initialTotal={initialTotal}
    />
  );
}
