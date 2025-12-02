/**
 * Role Hierarchy Tab
 *
 * Displays role hierarchy (parent and children).
 * Simple card-based view (org-chart visualization is TODO).
 */

"use client";

import { Briefcase } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { RoleHierarchyDTO } from "@/interface-adapters/queries/role-detail.query";

interface RoleHierarchyTabProps {
  hierarchy: RoleHierarchyDTO | null;
}

export function RoleHierarchyTab({ hierarchy }: RoleHierarchyTabProps) {
  const hasParent = !!hierarchy?.parent;
  const hasChildren = (hierarchy?.children.length ?? 0) > 0;

  return (
    <div className="space-y-6">
      {/* Info Banner */}
      <div className="border-muted bg-muted/50 rounded-lg border p-4">
        <p className="text-muted-foreground text-sm">
          📊 <strong>Coming Soon:</strong> Interactive org-chart visualization
          will be available in a future update. For now, view parent and child
          roles below.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Parent Role */}
        <Card>
          <CardHeader>
            <CardTitle>Parent Role</CardTitle>
          </CardHeader>
          <CardContent>
            {hasParent && hierarchy?.parent ? (
              <Link
                href={`/roles/${hierarchy.parent.id}`}
                className="bg-muted hover:bg-muted/80 block rounded-lg border p-4 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-full">
                    <Briefcase className="text-primary h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">
                      {hierarchy.parent.displayName}
                    </p>
                    <p className="text-muted-foreground text-sm">
                      {hierarchy.parent.name}
                    </p>
                  </div>
                  {hierarchy.parent.isSystem && (
                    <Badge
                      variant="outline"
                      className="border-barq-yellow text-barq-yellow"
                    >
                      System
                    </Badge>
                  )}
                </div>
                {hierarchy.parent.description && (
                  <p className="text-muted-foreground mt-2 line-clamp-2 text-sm">
                    {hierarchy.parent.description}
                  </p>
                )}
              </Link>
            ) : (
              <div className="text-muted-foreground border-muted rounded-lg border p-6 text-center">
                <p className="font-medium">No Parent Role</p>
                <p className="mt-1 text-sm">This is a top-level role.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Child Roles Count */}
        <Card>
          <CardHeader>
            <CardTitle>
              Child Roles ({hierarchy?.children.length ?? 0})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-muted-foreground text-center">
              <p className="text-sm">
                {hasChildren
                  ? "Child roles are listed below"
                  : "No child roles report to this role"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Child Roles List */}
      {hasChildren && (
        <Card>
          <CardHeader>
            <CardTitle>Child Roles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2">
              {hierarchy?.children.map((child) => (
                <Link
                  key={child.id}
                  href={`/roles/${child.id}`}
                  className="bg-muted hover:bg-muted/80 block rounded-lg border p-4 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-full">
                      <Briefcase className="text-primary h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{child.displayName}</p>
                      <p className="text-muted-foreground text-sm">
                        {child.name}
                      </p>
                    </div>
                    {child.isSystem && (
                      <Badge
                        variant="outline"
                        className="border-barq-yellow text-barq-yellow"
                      >
                        System
                      </Badge>
                    )}
                  </div>
                  {child.description && (
                    <p className="text-muted-foreground mt-2 line-clamp-2 text-sm">
                      {child.description}
                    </p>
                  )}
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
