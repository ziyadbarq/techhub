/**
 * Roles List Page
 *
 * Admin page to view and manage all roles.
 * Features:
 * - TanStack Table with sorting, filtering, pagination
 * - Create new role button
 * - Edit, Delete, and Manage Permissions actions
 * - Permission guard for ROLES_VIEW
 */

import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PermissionGuard } from "@/components/auth/PermissionGuard";
import { RolesPageClient } from "@/components/roles/RolesPageClient";
import { listRolesAction } from "@/interface-adapters/controllers/role.controller";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { requireFeatureAndPermission } from "@/lib/features/feature-permission-guard";

export const dynamic = "force-dynamic";

export default async function RolesPage() {
  await requireFeatureAndPermission(
    "RBAC",
    PERMISSIONS.ROLES_VIEW,
    "/admin/roles",
  );

  // Fetch initial data on the server
  const result = await listRolesAction();

  return (
    <PermissionGuard
      permission={PERMISSIONS.ROLES_VIEW}
      fallback={
        <div className="bg-background min-h-screen">
          <div className="container mx-auto max-w-7xl px-4 py-8">
            <div className="border-destructive bg-destructive/10 rounded-lg border p-6 text-center">
              <h1 className="text-destructive mb-2 text-2xl font-bold">
                Access Denied
              </h1>
              <p className="text-muted-foreground">
                You do not have permission to view roles. Please contact your
                administrator.
              </p>
            </div>
          </div>
        </div>
      }
    >
      <div className="bg-background min-h-screen">
        <div className="container mx-auto max-w-7xl px-4 py-8">
          {/* Page Header */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="mb-2 text-4xl font-bold">Roles Management</h1>
              <p className="text-muted-foreground text-lg">
                Manage roles and their associated permissions
              </p>
            </div>
            <Link href="/admin/roles/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Role
              </Button>
            </Link>
          </div>

          {/* Info Card */}
          <div className="bg-muted/50 mb-6 rounded-lg border p-4">
            <h2 className="mb-2 font-semibold">Role-Based Access Control</h2>
            <p className="text-muted-foreground text-sm">
              Roles are collections of permissions that can be assigned to
              users. System roles (marked with a yellow badge) cannot be deleted
              to maintain system integrity.
            </p>
          </div>

          {/* Roles Table */}
          <RolesPageClient initialData={result} />
        </div>
      </div>
    </PermissionGuard>
  );
}
