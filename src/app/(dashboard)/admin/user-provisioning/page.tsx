/**
 * Admin User Provisioning Page
 *
 * Lists Persons without linked User accounts and Users without linked Person records.
 * Allows admins to create User accounts or link existing records.
 *
 * Protected by USERS_MANAGE permission.
 */

import { Suspense } from "react";
import { PermissionGuard } from "@/components/auth/PermissionGuard";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import {
  listPersonsWithoutUsersAction,
  listUsersWithoutPersonsAction,
} from "@/interface-adapters/controllers/user-provisioning.controller";
import { PersonsWithoutUsersTable } from "@/components/user-provisioning/PersonsWithoutUsersTable";
import { UsersWithoutPersonsTable } from "@/components/user-provisioning/UsersWithoutPersonsTable";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { requirePermission } from "@/lib/permissions/server";

export const dynamic = "force-dynamic";

async function PersonsTableContent() {
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

async function UsersTableContent() {
  const result = await listUsersWithoutPersonsAction();

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
          <h3 className="text-lg font-semibold">All Linked!</h3>
          <p className="text-muted-foreground mt-2">
            All users have Person records linked.
          </p>
        </div>
      </div>
    );
  }

  return <UsersWithoutPersonsTable data={result.data} />;
}

async function TabsWithCounts() {
  // Server-side permission check (CRITICAL - client checks can be bypassed)
  await requirePermission(PERMISSIONS.USERS_MANAGE);

  // Fetch counts in parallel
  const [personsResult, usersResult] = await Promise.all([
    listPersonsWithoutUsersAction(),
    listUsersWithoutPersonsAction(),
  ]);

  const personsCount = personsResult.success ? personsResult.data.length : 0;
  const usersCount = usersResult.success ? usersResult.data.length : 0;

  return (
    <Tabs defaultValue="persons" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="persons" className="flex items-center gap-2">
          Employees Without Accounts
          {personsCount > 0 && (
            <Badge variant="secondary" className="ml-1">
              {personsCount}
            </Badge>
          )}
        </TabsTrigger>
        <TabsTrigger value="users" className="flex items-center gap-2">
          Users Without Persons
          {usersCount > 0 && (
            <Badge variant="secondary" className="ml-1">
              {usersCount}
            </Badge>
          )}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="persons" className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Employees Without User Accounts</CardTitle>
            <CardDescription>
              These employees are in the system but cannot login yet. Create a
              user account or link to an existing user to grant them access.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<LoadingSkeleton />}>
              <PersonsTableContent />
            </Suspense>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="users" className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Users Without Person Records</CardTitle>
            <CardDescription>
              These users have login accounts but are not linked to employee
              records. Link them to existing Person records to associate their
              organizational context.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<LoadingSkeleton />}>
              <UsersTableContent />
            </Suspense>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
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
            Manage user accounts and link them to employee records
          </p>
        </div>

        <Suspense fallback={<LoadingSkeleton />}>
          <TabsWithCounts />
        </Suspense>
      </div>
    </PermissionGuard>
  );
}
