/**
 * Permissions Page Client Component
 *
 * Client-side wrapper for the permissions table.
 */

"use client";

import { useState } from "react";
import { PermissionTable } from "@/components/permissions/PermissionTable";
import type { PermissionDTO } from "@/interface-adapters/presenters/permission.presenter";

interface PermissionsPageClientProps {
  initialData: PermissionDTO[];
}

export function PermissionsPageClient({
  initialData,
}: PermissionsPageClientProps) {
  const [data] = useState(initialData);

  return <PermissionTable data={data} />;
}
