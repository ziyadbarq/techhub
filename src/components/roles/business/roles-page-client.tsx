/**
 * Roles Page Client Component
 *
 * Client component for viewing business roles list.
 * Read-only interface (no create/edit buttons).
 */

"use client";

import type { RoleDTO } from "@/interface-adapters/presenters/role.presenter";
import { RolesListTable } from "./roles-list-table";

interface RolesPageClientProps {
  roles: RoleDTO[];
}

export function RolesPageClient({ roles }: RolesPageClientProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Business Roles</h2>
        <p className="text-muted-foreground">
          {roles.length} role{roles.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Table */}
      <RolesListTable data={roles} />
    </div>
  );
}
