/**
 * Analytics Dashboard Client Component
 *
 * Client component for rendering charts and interactive visualizations.
 * Uses Recharts for data visualization.
 */

"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type {
  RoleUsageStats,
  PermissionUsageStats,
  UserRoleStatsResult,
} from "@/core/use-cases/rbac/analytics";

const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#8884D8",
  "#82CA9D",
];

interface AnalyticsDashboardClientProps {
  roleUsageStats: RoleUsageStats[];
  permissionUsageStats: PermissionUsageStats[];
  userRoleStats: UserRoleStatsResult | null;
}

export function AnalyticsDashboardClient({
  roleUsageStats,
  permissionUsageStats,
  userRoleStats,
}: AnalyticsDashboardClientProps) {
  // Prepare orphaned roles
  const orphanedRoles = roleUsageStats.filter((r) => r.isOrphaned);

  // Prepare top 10 most used permissions
  const topPermissions = permissionUsageStats.slice(0, 10);

  // Prepare bottom 10 least used permissions (excluding unused)
  const leastPermissions = permissionUsageStats
    .filter((p) => !p.isUnused)
    .slice(-10)
    .reverse();

  // Prepare user role distribution for pie chart
  const userRoleDistribution = userRoleStats
    ? [
        {
          name: "No Roles",
          value: userRoleStats.usersWithoutRoles,
        },
        {
          name: "1 Role",
          value:
            userRoleStats.usersByRoleCount.find((d) => d.roleCount === 1)
              ?.userCount || 0,
        },
        {
          name: "2+ Roles",
          value: userRoleStats.usersWithMultipleRoles,
        },
      ]
    : [];

  // Users with conflicts
  const usersWithConflicts =
    userRoleStats?.topUsersWithMostRoles.filter((u) => u.hasConflicts) || [];

  return (
    <div className="space-y-8">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Roles</CardDescription>
            <CardTitle className="text-3xl">{roleUsageStats.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-xs">
              {orphanedRoles.length} orphaned (
              {(
                (orphanedRoles.length / (roleUsageStats.length || 1)) *
                100
              ).toFixed(1)}
              %)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Users</CardDescription>
            <CardTitle className="text-3xl">
              {userRoleStats?.totalUsers || 0}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-xs">
              {userRoleStats?.usersWithRoles || 0} with roles (
              {(
                ((userRoleStats?.usersWithRoles || 0) /
                  (userRoleStats?.totalUsers || 1)) *
                100
              ).toFixed(1)}
              %)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Avg Roles/User</CardDescription>
            <CardTitle className="text-3xl">
              {userRoleStats?.averageRolesPerUser.toFixed(1) || "0.0"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-xs">
              Max: {userRoleStats?.maxRolesPerUser || 0} roles
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Users with Conflicts</CardDescription>
            <CardTitle className="text-3xl">
              {userRoleStats?.usersWithConflicts || 0}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-xs">
              {(
                ((userRoleStats?.usersWithConflicts || 0) /
                  (userRoleStats?.totalUsers || 1)) *
                100
              ).toFixed(1)}
              % of all users
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Role Usage Bar Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Role Usage Distribution</CardTitle>
          <CardDescription>
            Number of users assigned to each role
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={roleUsageStats}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="roleName"
                angle={-45}
                textAnchor="end"
                height={120}
              />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="userCount" fill="#8884d8" name="Users" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Orphaned Roles Table */}
      {orphanedRoles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Orphaned Roles</CardTitle>
            <CardDescription>
              Roles with no users assigned ({orphanedRoles.length} total)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="pb-2 text-left font-semibold">Role Name</th>
                    <th className="pb-2 text-left font-semibold">
                      Display Name
                    </th>
                    <th className="pb-2 text-left font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {orphanedRoles.map((role) => (
                    <tr key={role.roleId} className="border-b">
                      <td className="py-2">
                        <code className="bg-muted rounded px-2 py-1 text-sm">
                          {role.roleName}
                        </code>
                      </td>
                      <td className="py-2">{role.roleDisplayName}</td>
                      <td className="py-2">
                        <Badge variant="destructive">Orphaned</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Permission Usage Stats */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Top 10 Most Used Permissions</CardTitle>
            <CardDescription>
              Permissions assigned to the most roles
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {topPermissions.map((perm, index) => (
                <div
                  key={perm.permission}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground text-sm font-medium">
                      #{index + 1}
                    </span>
                    <code className="bg-muted rounded px-2 py-1 text-xs">
                      {perm.permission}
                    </code>
                  </div>
                  <Badge>{perm.roleCount} roles</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Least Used Permissions</CardTitle>
            <CardDescription>
              Permissions assigned to the fewest roles
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {leastPermissions.map((perm) => (
                <div
                  key={perm.permission}
                  className="flex items-center justify-between"
                >
                  <code className="bg-muted rounded px-2 py-1 text-xs">
                    {perm.permission}
                  </code>
                  <Badge variant="outline">{perm.roleCount} roles</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* User Role Distribution Pie Chart */}
      <Card>
        <CardHeader>
          <CardTitle>User Role Distribution</CardTitle>
          <CardDescription>
            Distribution of users by number of roles assigned
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={userRoleDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value, percent }) =>
                  `${name}: ${value} (${((percent ?? 0) * 100).toFixed(0)}%)`
                }
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {userRoleDistribution.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Users with Conflicts Table */}
      {usersWithConflicts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Users with Role Conflicts</CardTitle>
            <CardDescription>
              Users with conflicting role assignments (
              {usersWithConflicts.length} total)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="pb-2 text-left font-semibold">User Email</th>
                    <th className="pb-2 text-left font-semibold">Role Count</th>
                    <th className="pb-2 text-left font-semibold">Roles</th>
                    <th className="pb-2 text-left font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {usersWithConflicts.map((user) => (
                    <tr key={user.userId} className="border-b">
                      <td className="py-2 font-medium">{user.userEmail}</td>
                      <td className="py-2">
                        <Badge variant="outline">{user.roleCount}</Badge>
                      </td>
                      <td className="py-2">
                        <div className="flex flex-wrap gap-1">
                          {user.roleNames.map((role) => (
                            <code
                              key={role}
                              className="bg-muted rounded px-2 py-1 text-xs"
                            >
                              {role}
                            </code>
                          ))}
                        </div>
                      </td>
                      <td className="py-2">
                        <Badge variant="destructive">Conflicts</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
