/**
 * Edit Role Page
 *
 * Admin page to edit an existing role.
 * Features:
 * - Load role by ID
 * - React Hook Form with Zod validation
 * - Permission guard for ROLES_UPDATE
 */

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { PermissionGuard } from "@/components/auth/PermissionGuard";
import { RoleForm } from "@/components/roles/RoleForm";
import { getRoleAction } from "@/interface-adapters/controllers/role.controller";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";

interface EditRolePageProps {
  params: Promise<{
    name: string;
  }>;
}

export default async function EditRolePage(props: EditRolePageProps) {
  // Resolve params (Next.js 16 async request API)
  const params = await props.params;

  // Decode URL-encoded role name
  const roleName = decodeURIComponent(params.name);

  // Fetch role data on the server
  const result = await getRoleAction(roleName);

  // Handle not found
  if (!result.success || !result.data) {
    notFound();
  }

  const role = result.data;

  return (
    <PermissionGuard
      permission={PERMISSIONS.ROLES_UPDATE}
      fallback={
        <div className="bg-background min-h-screen">
          <div className="container mx-auto max-w-4xl px-4 py-8">
            <div className="border-destructive bg-destructive/10 rounded-lg border p-6 text-center">
              <h1 className="text-destructive mb-2 text-2xl font-bold">
                Access Denied
              </h1>
              <p className="text-muted-foreground">
                You do not have permission to edit roles. Please contact your
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
            <h1 className="mb-2 text-4xl font-bold">Edit Role</h1>
            <p className="text-muted-foreground text-lg">
              Update role details for <strong>{role.displayName}</strong>
            </p>
          </div>

          {/* Role Form */}
          <RoleForm mode="edit" role={role} />

          {/* Additional Actions */}
          <div className="mt-6">
            <Link
              href={`/admin/roles/${encodeURIComponent(role.name)}/permissions`}
            >
              <Button variant="outline" className="w-full">
                Manage Permissions
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </PermissionGuard>
  );
}
