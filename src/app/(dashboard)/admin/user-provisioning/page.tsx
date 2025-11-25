/**
 * Admin User Provisioning Page
 *
 * Lists Persons without linked User accounts and allows admins
 * to create User accounts for them.
 *
 * Protected by USERS_MANAGE permission.
 */

import { Suspense } from "react";
import { PermissionGuard } from "@/components/auth/PermissionGuard";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { listPersonsWithoutUsersAction } from "@/interface-adapters/controllers/user-provisioning.controller";
import { PersonsWithoutUsersTable } from "@/components/user-provisioning/PersonsWithoutUsersTable";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { requirePermission } from "@/lib/permissions/server";

export const dynamic = "force-dynamic";

async function PersonsTableContent() {
  // Server-side permission check (CRITICAL - client checks can be bypassed)
  await requirePermission(PERMISSIONS.USERS_MANAGE);

  const result = await listPersonsWithoutUsersAction();

  if (!result.success) {
    return (
      <div className="flex min-h-[400px] items-center justify-center rounded-lg border border-dashed p-8">
        <div className="text-center">
          <p className="text-muted-foreground text-sm">{result.error}</p>
        </div>
      </div>
    );
  }

  if (result.data.length === 0) {
    return (
      <div className="flex min-h-[400px] items-center justify-center rounded-lg border border-dashed p-8">
        <div className="text-center">
          <h3 className="text-lg font-semibold">All Set!</h3>
          <p className="text-muted-foreground mt-2">
            All active employees have User accounts linked.
          </p>
        </div>
      </div>
    );
  }

  return <PersonsWithoutUsersTable data={result.data} />;
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-[400px] w-full" />
    </div>
  );
}

export default function UserProvisioningPage() {
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
          <h1 className="text-3xl font-bold tracking-tight">
            User Provisioning
          </h1>
          <p className="text-muted-foreground mt-2">
            Create user accounts for employees without login access
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Employees Without User Accounts</CardTitle>
            <CardDescription>
              These employees are in the system but cannot login yet. Create a
              user account to grant them access.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<LoadingSkeleton />}>
              <PersonsTableContent />
            </Suspense>
          </CardContent>
        </Card>
      </div>
    </PermissionGuard>
  );
}
