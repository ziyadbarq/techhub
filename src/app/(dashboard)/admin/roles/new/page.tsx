/**
 * Create Role Page
 *
 * Admin page to create a new role.
 * Features:
 * - React Hook Form with Zod validation
 * - Permission guard for ROLES_CREATE
 */

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PermissionGuard } from "@/components/auth/PermissionGuard";
import { RoleForm } from "@/components/roles/RoleForm";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";

export default function CreateRolePage() {
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
            <h1 className="mb-2 text-4xl font-bold">Create New Role</h1>
            <p className="text-muted-foreground text-lg">
              Create a new role to organize permissions for your users
            </p>
          </div>

          {/* Role Form */}
          <RoleForm mode="create" />
        </div>
      </div>
    </PermissionGuard>
  );
}
