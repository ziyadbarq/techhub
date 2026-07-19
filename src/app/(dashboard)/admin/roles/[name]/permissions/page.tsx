/**
 * Assign Permissions to Role Page
 *
 * Admin page to manage permissions for a role.
 * Features:
 * - Multi-select UI for permissions
 * - Show currently assigned permissions
 * - Add/remove permissions
 * - Group permissions by resource
 * - Permission guard for ROLES_MANAGE
 */

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { PermissionGuard } from "@/components/auth/PermissionGuard";
import { PermissionsManager } from "@/components/roles/PermissionsManager";
import {
  getRoleAction,
  listPermissionsAction,
} from "@/interface-adapters/controllers/role.controller";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { requireFeatureAndPermission } from "@/lib/features/feature-permission-guard";

export const dynamic = "force-dynamic";

interface AssignPermissionsPageProps {
  params: Promise<{
    name: string;
  }>;
}

export default async function AssignPermissionsPage(
  props: AssignPermissionsPageProps,
) {
  // Resolve params (Next.js 16 async request API)
  const params = await props.params;

  // Decode URL-encoded role name
  const roleName = decodeURIComponent(params.name);

  await requireFeatureAndPermission(
    "RBAC",
    PERMISSIONS.ROLES_MANAGE,
    `/admin/roles/${roleName}/permissions`,
  );

  // Fetch role and all available permissions on the server
  const [roleResult, permissionsResult] = await Promise.all([
    getRoleAction(roleName),
    listPermissionsAction(),
  ]);

  // Handle not found
  if (!roleResult.success || !roleResult.data) {
    notFound();
  }

  const role = roleResult.data;
  const allPermissions = permissionsResult.success
    ? permissionsResult.data
    : [];

  return (
    <PermissionGuard
      permission={PERMISSIONS.ROLES_MANAGE}
      fallback={
        <div className="bg-background min-h-screen">
          <div className="container mx-auto max-w-4xl px-4 py-8">
            <div className="border-destructive bg-destructive/10 rounded-lg border p-6 text-center">
              <h1 className="text-destructive mb-2 text-2xl font-bold">
                Access Denied
              </h1>
              <p className="text-muted-foreground">
                You do not have permission to manage role permissions. Please
                contact your administrator.
              </p>
              <Link href="/admin/roles" className="mt-4 inline-block">
                <Button variant="outline">Back to Roles</Button>
              </Link>
            </div>
          </div>
        </div>
      }
    >
      <div className="bg-background min-h-screen">
        <div className="container mx-auto max-w-6xl px-4 py-8">
          {/* Back Button */}
          <Link href="/admin/roles" className="mb-6 inline-block">
            <Button variant="ghost" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Roles
            </Button>
          </Link>

          {/* Page Header */}
          <div className="mb-8">
            <h1 className="mb-2 text-4xl font-bold">Manage Permissions</h1>
            <p className="text-muted-foreground text-lg">
              Assign permissions to <strong>{role.displayName}</strong>
            </p>
          </div>

          {/* System Role Warning */}
          {role.isSystem && (
            <div className="border-barq-yellow bg-barq-yellow/10 mb-6 rounded-lg border p-4">
              <p className="text-barq-yellow text-sm">
                <strong>System Role:</strong> This is a protected system role.
                Modifying permissions may affect core system functionality.
              </p>
            </div>
          )}

          {/* Permissions Manager */}
          <PermissionsManager
            role={role}
            allPermissions={allPermissions}
            isSystemRole={role.isSystem}
          />
        </div>
      </div>
    </PermissionGuard>
  );
}
