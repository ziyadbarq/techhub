/**
 * Roles Page Client Component
 *
 * Client wrapper for the RoleTable component with refresh handling.
 * This is a client component that can handle interactivity.
 */

"use client";

import { RoleTable } from "./RoleTable";
import type { listRolesAction } from "@/interface-adapters/controllers/role.controller";

interface RolesPageClientProps {
  initialData: Awaited<ReturnType<typeof listRolesAction>>;
}

export function RolesPageClient({ initialData }: RolesPageClientProps) {
  const roles = initialData.success ? initialData.data : [];

  const handleRefresh = () => {
    // Trigger server-side refresh using router
    window.location.reload();
  };

  return <RoleTable data={roles} onRefresh={handleRefresh} />;
}
