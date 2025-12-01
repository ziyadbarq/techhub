/**
 * Create Role Page
 *
 * Admin page to create a new role or clone an existing one.
 * Features:
 * - React Hook Form with Zod validation
 * - Permission guard for ROLES_CREATE
 * - Clone support via ?clone=roleName query parameter
 */

import Link from "next/link";
import { ArrowLeft, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PermissionGuard } from "@/components/auth/PermissionGuard";
import { RoleForm } from "@/components/roles/RoleForm";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { getRoleAction } from "@/interface-adapters/controllers/role.controller";
import { requireFeatureAndPermission } from "@/lib/features/feature-permission-guard";

interface CreateRolePageProps {
  searchParams: Promise<{
    clone?: string;
  }>;
}

export const dynamic = "force-dynamic";

export default async function CreateRolePage(props: CreateRolePageProps) {
  // Resolve searchParams (Next.js 16 async request API)
  const searchParams = await props.searchParams;
  const cloneRoleName = searchParams.clone
    ? decodeURIComponent(searchParams.clone)
    : undefined;

  await requireFeatureAndPermission(
    "RBAC",
    PERMISSIONS.ROLES_CREATE,
    "/admin/roles/new",
  );

  // If cloning, fetch the source role
  let sourceRole = null;
  if (cloneRoleName) {
    const roleResult = await getRoleAction(cloneRoleName);
    if (roleResult.success) {
      sourceRole = roleResult.data;
    }
  }
  return (
    <PermissionGuard
      permission={PERMISSIONS.ROLES_CREATE}
      fallback={
        <div className="bg-background min-h-screen">
          <div className="container mx-auto max-w-4xl px-4 py-8">
            <div className="border-destructive bg-destructive/10 rounded-lg border p-6 text-center">
              <h1 className="text-destructive mb-2 text-2xl font-bold">
                Access Denied
              </h1>
              <p className="text-muted-foreground">
                You do not have permission to create roles. Please contact your
                administrator.
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
        <div className="container mx-auto max-w-4xl px-4 py-8">
          {/* Back Button */}
          <Link href="/admin/roles" className="mb-6 inline-block">
            <Button variant="ghost" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Roles
            </Button>
          </Link>

          {/* Page Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3">
              <h1 className="text-4xl font-bold">
                {sourceRole ? "Clone Role" : "Create New Role"}
              </h1>
              {sourceRole && (
                <Badge variant="outline" className="gap-1">
                  <Copy className="h-3 w-3" />
                  Cloning from {sourceRole.displayName}
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground mt-2 text-lg">
              {sourceRole
                ? `Create a new role based on "${sourceRole.displayName}" with its ${sourceRole.permissions?.length ?? 0} permissions`
                : "Create a new role to organize permissions for your users"}
            </p>
          </div>

          {/* Role Form */}
          <RoleForm mode="create" sourceRole={sourceRole ?? undefined} />
        </div>
      </div>
    </PermissionGuard>
  );
}
