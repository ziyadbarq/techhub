/**
 * Permissions List Page
 *
 * Displays all permissions in a table with search, filter, and CRUD actions.
 * Protected by PERMISSIONS_VIEW permission.
 */

import { Suspense } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { PermissionsPageClient } from "./permissions-page-client";
import { listPermissionsAction } from "@/interface-adapters/controllers/permission.controller";
import { requireFeatureAndPermission } from "@/lib/features/feature-permission-guard";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";

export const metadata = {
  title: "Permissions | Admin",
  description: "View system permissions and access control",
};

async function PermissionsList() {
  const result = await listPermissionsAction({ includeInactive: true });

  if (!result.success) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-destructive text-lg font-semibold">
          Failed to load permissions
        </p>
        <p className="text-muted-foreground mt-2">{result.error}</p>
      </div>
    );
  }

  return <PermissionsPageClient initialData={result.data} />;
}

function PermissionsListSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-[600px] w-full" />
    </div>
  );
}

export const dynamic = "force-dynamic";

export default async function PermissionsPage() {
  await requireFeatureAndPermission(
    "RBAC",
    PERMISSIONS.PERMISSIONS_VIEW,
    "/admin/permissions",
  );

  return (
    <div className="container mx-auto space-y-6 py-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Permissions</h1>
        <p className="text-muted-foreground mt-2">
          Browse system permissions defined in the codebase
        </p>
      </div>

      {/* Info Card */}
      <div className="bg-muted/50 rounded-lg border p-4">
        <h2 className="mb-2 font-semibold">Code-Managed Permissions</h2>
        <p className="text-muted-foreground text-sm">
          All permissions are defined in{" "}
          <code className="bg-muted rounded px-1 py-0.5 font-mono text-xs">
            permission-key.ts
          </code>{" "}
          and automatically seeded to the database. To add new permissions,
          update the codebase and run the seed command.
        </p>
      </div>

      {/* Permissions Table */}
      <Suspense fallback={<PermissionsListSkeleton />}>
        <PermissionsList />
      </Suspense>
    </div>
  );
}
