/**
 * System Settings Admin Page
 * Server component with permission check
 */

import { requirePermission } from "@/lib/permissions/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { handlePermissionRedirect } from "@/lib/permissions/handle-permission-redirect";
import { SettingsPageClient } from "@/components/admin-settings/settings-page-client";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  try {
    await requirePermission(PERMISSIONS.SETTINGS_MANAGE);
  } catch (error) {
    handlePermissionRedirect(error, "/admin/settings");
    throw error;
  }

  return <SettingsPageClient />;
}
