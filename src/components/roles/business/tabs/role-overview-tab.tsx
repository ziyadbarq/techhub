/**
 * Role Overview Tab
 *
 * Displays role metadata and general information.
 */

"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { RoleDTO } from "@/interface-adapters/presenters/role.presenter";
import type { RoleHierarchyDTO } from "@/interface-adapters/queries/role-detail.query";
import { formatDate } from "@/lib/utils/date-format";
import Link from "next/link";

interface RoleOverviewTabProps {
  role: RoleDTO;
  hierarchy: RoleHierarchyDTO | null;
}

export function RoleOverviewTab({ role, hierarchy }: RoleOverviewTabProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Role Information */}
      <Card>
        <CardHeader>
          <CardTitle>Role Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-muted-foreground text-sm">Display Name</p>
            <p className="font-medium">{role.displayName}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-sm">System Name</p>
            <p className="font-mono text-sm">{role.name}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-sm">Description</p>
            <p className="text-sm">
              {role.description || (
                <span className="text-muted-foreground italic">
                  No description provided
                </span>
              )}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground text-sm">Created</p>
            <p className="text-sm">{formatDate(role.createdAt)}</p>
          </div>
        </CardContent>
      </Card>

      {/* Hierarchy & Permissions */}
      <div className="space-y-4">
        {/* Hierarchy */}
        <Card>
          <CardHeader>
            <CardTitle>Hierarchy</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-muted-foreground text-sm">Parent Role</p>
              {hierarchy?.parent ? (
                <Link
                  href={`/roles/${hierarchy.parent.id}`}
                  className="text-primary font-medium hover:underline"
                >
                  {hierarchy.parent.displayName}
                </Link>
              ) : (
                <p className="text-muted-foreground text-sm italic">
                  None (top-level role)
                </p>
              )}
            </div>
            <div>
              <p className="text-muted-foreground text-sm">Child Roles</p>
              <p className="text-sm font-medium">
                {hierarchy?.children.length ?? 0} child{" "}
                {hierarchy?.children.length === 1 ? "role" : "roles"}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Permissions */}
        <Card>
          <CardHeader>
            <CardTitle>Permissions</CardTitle>
          </CardHeader>
          <CardContent>
            <div>
              <p className="text-muted-foreground text-sm">
                Total Permissions Granted
              </p>
              <p className="text-2xl font-bold">
                {role.permissions?.length ?? 0}
              </p>
              {(role.permissions?.length ?? 0) > 0 && (
                <p className="text-muted-foreground mt-1 text-xs">
                  View details in the admin role management interface
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
