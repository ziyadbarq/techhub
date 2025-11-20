/**
 * Permissions Page Client Component
 *
 * Client-side wrapper for the permissions table with refresh capability.
 */

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { PermissionTable } from "@/components/permissions/PermissionTable";
import type { PermissionDTO } from "@/interface-adapters/presenters/permission.presenter";

interface PermissionsPageClientProps {
  initialData: PermissionDTO[];
}

export function PermissionsPageClient({
  initialData,
}: PermissionsPageClientProps) {
  const router = useRouter();
  const [_isPending, startTransition] = useTransition();
  const [data] = useState(initialData);

  const handleRefresh = () => {
    startTransition(() => {
      router.refresh();
    });
  };

  return <PermissionTable data={data} onRefresh={handleRefresh} />;
}
