/**
 * Documentation Index
 * Main landing page for documentation section
 * Requires authentication (any authenticated user with DASHBOARD_VIEW can access)
 */

import { redirect } from "next/navigation";
import { requirePermission } from "@/lib/permissions/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { handlePermissionRedirect } from "@/lib/permissions/handle-permission-redirect";

export const dynamic = "force-dynamic";

export default async function DocsIndexPage() {
  // Require DASHBOARD_VIEW permission - docs available to all authenticated users with minimal permissions
  try {
    await requirePermission(PERMISSIONS.DASHBOARD_VIEW);
  } catch (error) {
    handlePermissionRedirect(error, "/docs");
    throw error;
  }

  // Redirect to getting-started/overview as the default docs page
  redirect("/docs/getting-started/overview");
}
