/**
 * Admin Users Page
 *
 * Lists all users with their roles.
 * Protected by USERS_MANAGE permission.
 */

import { Suspense } from "react";
import { UserTable } from "@/components/users/UserTable";
import { PermissionGuard } from "@/components/auth/PermissionGuard";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { listUsersWithRolesAction } from "@/interface-adapters/controllers/user-role.controller";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

async function UsersTableContent() {
  const result = await listUsersWithRolesAction();

  if (!result.success) {
    return (
      <div className="flex min-h-[400px] items-center justify-center rounded-lg border border-dashed p-8">
        <div className="text-center">
          <p className="text-muted-foreground text-sm">{result.error}</p>
        </div>
      </div>
    );
  }

  return <UserTable data={result.data} />;
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-[400px] w-full" />
    </div>
  );
}

export default function AdminUsersPage() {
  return (
    <PermissionGuard
      permission={PERMISSIONS.USERS_MANAGE}
      fallback={
        <div className="flex min-h-[600px] items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-semibold">Access Denied</h2>
            <p className="text-muted-foreground mt-2">
              You don&apos;t have permission to manage users.
            </p>
          </div>
        </div>
      }
    >
      <div className="container mx-auto space-y-6 py-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground mt-2">
            Manage user accounts and role assignments
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Users</CardTitle>
            <CardDescription>
              View and manage user accounts and their assigned roles
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<LoadingSkeleton />}>
              <UsersTableContent />
            </Suspense>
          </CardContent>
        </Card>
      </div>
    </PermissionGuard>
  );
}
