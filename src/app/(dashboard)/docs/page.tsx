/**
 * Documentation Index
 * Main landing page for documentation section
 * Requires authentication (any authenticated user with DASHBOARD_VIEW can access)
 */

import { redirect } from "next/navigation";
import { requirePermission } from "@/lib/permissions/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { InsufficientPermissionsError } from "@/core/domain/errors/rbac-errors";

export const dynamic = "force-dynamic";

export default async function DocsIndexPage() {
  // Require DASHBOARD_VIEW permission - docs available to all authenticated users with minimal permissions
  try {
    await requirePermission(PERMISSIONS.DASHBOARD_VIEW);
  } catch (error) {
    if (error instanceof InsufficientPermissionsError) {
      const params = new URLSearchParams({
        required: error.requiredPermission,
        path: "/docs",
      });
      redirect(`/unauthorized?${params.toString()}`);
    }
    throw error;
  }

  // Redirect to getting-started as the default docs page
  redirect("/docs/getting-started");
}
