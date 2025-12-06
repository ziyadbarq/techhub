/**
 * User Role Management Page
 *
 * Manage roles for a specific user.
 * Protected by USERS_MANAGE permission.
 */

"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Mail, User as UserIcon } from "lucide-react";

import { PermissionGuard } from "@/components/auth/PermissionGuard";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { RoleAssignment } from "@/components/users/RoleAssignment";
import {
  getUserWithRolesAction,
  listAvailableRolesAction,
  type UserWithRolesDTO,
} from "@/interface-adapters/controllers/user-role.controller";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { UserAvatar } from "@/components/shared/user-avatar";

export default function UserRolesPage() {
  const params = useParams();
  const _router = useRouter();
  const userEmail = decodeURIComponent(params.email as string);

  const [user, setUser] = React.useState<UserWithRolesDTO | null>(null);
  const [availableRoles, setAvailableRoles] = React.useState<
    { id: string; name: string; displayName: string }[]
  >([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const fetchData = React.useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [userResult, rolesResult] = await Promise.all([
        getUserWithRolesAction(userEmail),
        listAvailableRolesAction(),
      ]);

      if (!userResult.success) {
        setError(userResult.error);
        return;
      }

      if (!rolesResult.success) {
        setError(rolesResult.error);
        return;
      }

      setUser(userResult.data);
      setAvailableRoles(rolesResult.data);
    } catch (_err) {
      setError("Failed to load user data");
    } finally {
      setLoading(false);
    }
  }, [userEmail]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <PermissionGuard
        permission={PERMISSIONS.USERS_MANAGE}
        loading={
          <div className="flex min-h-[600px] items-center justify-center">
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>
        }
      >
        <div className="container mx-auto space-y-6 py-8">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-[400px] w-full" />
        </div>
      </PermissionGuard>
    );
  }

  if (error || !user) {
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
          <Button variant="ghost" asChild>
            <Link href="/admin/users">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Users
            </Link>
          </Button>
          <div className="flex min-h-[400px] items-center justify-center rounded-lg border border-dashed p-8">
            <div className="text-center">
              <p className="text-muted-foreground text-sm">
                {error || "User not found"}
              </p>
            </div>
          </div>
        </div>
      </PermissionGuard>
    );
  }

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
        {/* Back Button */}
        <Button variant="ghost" asChild>
          <Link href="/admin/users">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Users
          </Link>
        </Button>

        {/* User Info Card */}
        <Card>
          <CardHeader>
            <CardTitle>User Information</CardTitle>
            <CardDescription>Details for the selected user</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <UserAvatar
                name={user.name || undefined}
                email={user.email}
                image={user.image || undefined}
                size="lg"
              />
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <UserIcon className="text-muted-foreground h-4 w-4" />
                  <span className="font-semibold">
                    {user.name || "Unnamed User"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="text-muted-foreground h-4 w-4" />
                  <span className="text-muted-foreground text-sm">
                    {user.email}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Role Assignment */}
        <RoleAssignment
          user={user}
          availableRoles={availableRoles}
          onUpdate={fetchData}
        />
      </div>
    </PermissionGuard>
  );
}
