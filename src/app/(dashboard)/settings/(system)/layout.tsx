/**
 * System Settings Layout
 *
 * Server-side guard for the system settings pages (authentication,
 * integrations, notifications, operations, platform). The pages themselves
 * are client components; this layout enforces SETTINGS_MANAGE on the server
 * so unauthorized users are redirected before any page code or data ships.
 */

import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth/session";
import { requirePermission } from "@/lib/permissions/check-permission";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { handlePermissionRedirect } from "@/lib/permissions/handle-permission-redirect";

export const dynamic = "force-dynamic";

export default async function SystemSettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = await requireAuth();

  try {
    await requirePermission(user.id, PERMISSIONS.SETTINGS_MANAGE);
  } catch (error) {
    handlePermissionRedirect(error, "/settings");
    redirect("/unauthorized");
  }

  return <>{children}</>;
}
