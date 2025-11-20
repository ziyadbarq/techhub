/**
 * Admin Layout Component
 *
 * Provides layout wrapper for all admin pages with:
 * - Permission checks (requires any admin permission)
 * - Admin navigation tabs
 * - Breadcrumbs (inherited from main Header)
 * - Consistent styling and spacing
 *
 * This layout wraps all routes under /admin/*
 */

import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { hasAnyPermission } from "@/lib/permissions/check-permission";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { AdminNav } from "@/components/admin/AdminNav";
import { Card } from "@/components/ui/card";

// Force dynamic rendering - admin pages require authentication
export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = await getSession();

  if (!user) {
    redirect("/");
  }

  // Check if user has any admin permissions
  // This runs on the server, so it's secure
  const hasAdminAccess = await hasAnyPermission(user.id, [
    PERMISSIONS.USERS_MANAGE,
    PERMISSIONS.ROLES_VIEW,
    PERMISSIONS.PERMISSIONS_VIEW,
    PERMISSIONS.USERS_VIEW,
    PERMISSIONS.AUDIT_LOGS_VIEW,
  ]);

  // Redirect to unauthorized page if no admin access
  if (!hasAdminAccess) {
    redirect("/unauthorized?required=admin&path=/admin");
  }

  return (
    <div className="space-y-6">
      {/* Admin Navigation */}
      <AdminNav />

      {/* Admin Content Area */}
      <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8">
        <Card className="min-h-[calc(100vh-16rem)] p-6">{children}</Card>
      </div>
    </div>
  );
}

export const metadata = {
  title: "Admin Dashboard - Barq App",
  description: "Manage roles, permissions, users, and system settings",
};
