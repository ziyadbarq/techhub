/**
 * Role Detail Page Client
 *
 * Client component for displaying a role's 360-degree view.
 * Includes quick stats, tabs for different data categories.
 * Read-only interface (no edit/delete buttons).
 */

"use client";

import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Briefcase,
  Users,
  CheckCircle2,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { RoleDTO } from "@/interface-adapters/presenters/role.presenter";
import type {
  PersonAssignmentDTO,
  RoleHierarchyDTO,
  RoleStatsDTO,
} from "@/interface-adapters/queries/role-detail.query";
import {
  CountedTabs,
  type CountedTabConfig,
} from "@/components/ui/counted-tabs";
import { RoleOverviewTab } from "./tabs/role-overview-tab";
import { RolePeopleTab } from "./tabs/role-people-tab";
import { RoleHierarchyTab } from "./tabs/role-hierarchy-tab";

interface RoleDetailPageClientProps {
  role: RoleDTO;
  peopleAssigned: PersonAssignmentDTO[];
  hierarchy: RoleHierarchyDTO | null;
  stats: RoleStatsDTO | null;
}

export function RoleDetailPageClient({
  role,
  peopleAssigned,
  hierarchy,
  stats,
}: RoleDetailPageClientProps) {
  const router = useRouter();

  const isStatsLoading = !stats;
  const tabCount = (value: number | undefined) =>
    isStatsLoading ? undefined : (value ?? 0);

  const tabs: CountedTabConfig[] = [
    {
      value: "overview",
      label: "Overview",
      content: <RoleOverviewTab role={role} hierarchy={hierarchy} />,
      showWhenZero: true,
    },
    {
      value: "people",
      label: "People",
      count: tabCount(stats?.peopleCount),
      content: <RolePeopleTab people={peopleAssigned} />,
    },
    {
      value: "hierarchy",
      label: "Hierarchy",
      count: tabCount(stats?.childrenCount),
      content: <RoleHierarchyTab hierarchy={hierarchy} />,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/roles")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Roles
          </Button>
          <div className="flex items-center gap-4">
            <div className="bg-primary/10 flex h-14 w-14 items-center justify-center rounded-full">
              <Briefcase className="text-primary h-7 w-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                {role.displayName}
              </h1>
              <p className="text-muted-foreground font-mono text-sm">
                {role.name}
              </p>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                {role.isSystem && (
                  <Badge
                    variant="outline"
                    className="border-barq-yellow text-barq-yellow"
                  >
                    System Role
                  </Badge>
                )}
                {role.isActive ? (
                  <Badge
                    variant="default"
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle2 className="mr-1 h-3 w-3" />
                    Active
                  </Badge>
                ) : (
                  <Badge variant="secondary">Inactive</Badge>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        {/* People Assigned */}
        <Card>
          <CardContent className="flex items-center gap-3 pt-4">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-full ${
                (stats?.activeAssignmentsCount ?? 0) > 0
                  ? "bg-blue-100 dark:bg-blue-900"
                  : "bg-muted"
              }`}
            >
              <Users
                className={`h-5 w-5 ${
                  (stats?.activeAssignmentsCount ?? 0) > 0
                    ? "text-blue-600 dark:text-blue-400"
                    : "text-muted-foreground"
                }`}
              />
            </div>
            <div>
              <p className="text-muted-foreground text-xs">People Assigned</p>
              <p className="font-semibold">
                {stats?.activeAssignmentsCount ?? 0} active
              </p>
              <p className="text-muted-foreground text-xs">
                {stats?.peopleCount ?? 0} total
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Parent Role */}
        <Card>
          <CardContent className="flex items-center gap-3 pt-4">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-full ${
                hierarchy?.parent
                  ? "bg-purple-100 dark:bg-purple-900"
                  : "bg-muted"
              }`}
            >
              <Briefcase
                className={`h-5 w-5 ${
                  hierarchy?.parent
                    ? "text-purple-600 dark:text-purple-400"
                    : "text-muted-foreground"
                }`}
              />
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Parent Role</p>
              <p className="font-semibold">
                {hierarchy?.parent ? hierarchy.parent.displayName : "None"}
              </p>
              <p className="text-muted-foreground text-xs">
                {hierarchy?.parent ? "Reports to" : "Top level"}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Child Roles */}
        <Card>
          <CardContent className="flex items-center gap-3 pt-4">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-full ${
                (stats?.childrenCount ?? 0) > 0
                  ? "bg-green-100 dark:bg-green-900"
                  : "bg-muted"
              }`}
            >
              <Briefcase
                className={`h-5 w-5 ${
                  (stats?.childrenCount ?? 0) > 0
                    ? "text-green-600 dark:text-green-400"
                    : "text-muted-foreground"
                }`}
              />
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Child Roles</p>
              <p className="font-semibold">{stats?.childrenCount ?? 0}</p>
              <p className="text-muted-foreground text-xs">
                {stats?.childrenCount === 1 ? "role" : "roles"}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Permissions */}
        <Card>
          <CardContent className="flex items-center gap-3 pt-4">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-full ${
                (stats?.permissionsCount ?? 0) > 0
                  ? "bg-amber-100 dark:bg-amber-900"
                  : "bg-muted"
              }`}
            >
              <Shield
                className={`h-5 w-5 ${
                  (stats?.permissionsCount ?? 0) > 0
                    ? "text-amber-600 dark:text-amber-400"
                    : "text-muted-foreground"
                }`}
              />
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Permissions</p>
              <p className="font-semibold">{stats?.permissionsCount ?? 0}</p>
              <p className="text-muted-foreground text-xs">
                {stats?.permissionsCount === 1 ? "permission" : "permissions"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabbed Content */}
      <CountedTabs
        defaultValue="overview"
        tabs={tabs}
        loading={isStatsLoading}
        tabsClassName="space-y-4"
      />
    </div>
  );
}
