/**
 * User Table Wrapper Component
 *
 * Client-side wrapper for UserTable to handle router refresh on updates.
 */

"use client";

import { useRouter } from "next/navigation";
import { UserTable } from "@/components/users/UserTable";
import type { UserWithRolesDTO } from "@/interface-adapters/controllers/user-role.controller";

interface UserTableWrapperProps {
  data: UserWithRolesDTO[];
  availableRoles: { id: string; name: string; displayName: string }[];
}

export function UserTableWrapper({
  data,
  availableRoles,
}: UserTableWrapperProps) {
  const router = useRouter();

  return (
    <UserTable
      data={data}
      availableRoles={availableRoles}
      onUpdate={() => router.refresh()}
    />
  );
}
