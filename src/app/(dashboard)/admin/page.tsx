/**
 * Admin Dashboard Home Page
 *
 * Displays:
 * - Overview statistics (roles, permissions, users, audit logs)
 * - Quick links to management pages
 * - Recent activity feed
 * - System health indicators
 *
 * This is the landing page for /admin route
 */

"use client";

import Link from "next/link";
import {
  Shield,
  Key,
  Users,
  FileText,
  ArrowRight,
  Activity,
  TrendingUp,
  Clock,
} from "lucide-react";
import { AdminSectionHeader } from "@/components/admin/AdminNav";
import { PermissionGuard } from "@/components/auth/PermissionGuard";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface StatCardProps {
  title: string;
  value: string | number;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  trend?: {
    value: string;
    positive: boolean;
  };
  href: string;
}

function StatCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  href,
}: StatCardProps) {
  return (
    <Card className="transition-all hover:shadow-md">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="text-muted-foreground h-4 w-4" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-muted-foreground text-xs">{description}</p>
        {trend && (
          <div className="mt-2 flex items-center gap-1">
            <TrendingUp
              className={`h-3 w-3 ${trend.positive ? "text-success" : "text-destructive"}`}
            />
            <span
              className={`text-xs font-medium ${trend.positive ? "text-success" : "text-destructive"}`}
            >
              {trend.value}
            </span>
            <span className="text-muted-foreground text-xs">
              from last month
            </span>
          </div>
        )}
        <Button asChild variant="link" className="mt-2 h-auto p-0 text-xs">
          <Link href={href}>
            View details <ArrowRight className="ml-1 h-3 w-3" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

interface QuickLinkProps {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  permission?: string;
}

function QuickLink({ title, description, icon: Icon, href }: QuickLinkProps) {
  return (
    <Link
      href={href}
      className="group hover:border-barq-yellow hover:bg-barq-yellow/5 flex items-start gap-4 rounded-lg border p-4 transition-all"
    >
      <div className="bg-barq-yellow/10 group-hover:bg-barq-yellow/20 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg transition-colors">
        <Icon className="text-barq-yellow h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="group-hover:text-barq-yellow font-medium">{title}</h3>
        <p className="text-muted-foreground mt-1 text-sm">{description}</p>
      </div>
      <ArrowRight className="text-muted-foreground group-hover:text-barq-yellow h-5 w-5 flex-shrink-0 transition-transform group-hover:translate-x-1" />
    </Link>
  );
}

interface ActivityItem {
  id: string;
  user: string;
  action: string;
  target: string;
  timestamp: string;
  type: "create" | "update" | "delete";
}

function ActivityFeed({ activities }: { activities: ActivityItem[] }) {
  const getActivityColor = (type: string) => {
    switch (type) {
      case "create":
        return "text-success";
      case "update":
        return "text-barq-yellow";
      case "delete":
        return "text-destructive";
      default:
        return "text-muted-foreground";
    }
  };

  return (
    <div className="space-y-4">
      {activities.map((activity, index) => (
        <div key={activity.id}>
          <div className="flex items-start gap-4">
            <div
              className={`mt-1 h-2 w-2 flex-shrink-0 rounded-full ${getActivityColor(activity.type)}`}
            />
            <div className="min-w-0 flex-1 space-y-1">
              <p className="text-sm">
                <span className="font-medium">{activity.user}</span>{" "}
                <span className="text-muted-foreground">{activity.action}</span>{" "}
                <span className="font-medium">{activity.target}</span>
              </p>
              <div className="text-muted-foreground flex items-center gap-2 text-xs">
                <Clock className="h-3 w-3" />
                {activity.timestamp}
              </div>
            </div>
            <Badge variant="secondary" className="flex-shrink-0 text-xs">
              {activity.type}
            </Badge>
          </div>
          {index < activities.length - 1 && <Separator className="mt-4" />}
        </div>
      ))}
    </div>
  );
}

export default function AdminDashboardPage() {
  // Mock data - Replace with actual data from your backend
  const stats = [
    {
      title: "Total Roles",
      value: 4,
      description: "Active role definitions",
      icon: Shield,
      trend: { value: "+1", positive: true },
      href: "/admin/roles",
    },
    {
      title: "Permissions",
      value: 16,
      description: "System-wide permissions",
      icon: Key,
      href: "/admin/permissions",
    },
    {
      title: "Active Users",
      value: 1247,
      description: "Registered users",
      icon: Users,
      trend: { value: "+12%", positive: true },
      href: "/admin/users",
    },
    {
      title: "Audit Logs",
      value: "2.4k",
      description: "Last 30 days",
      icon: FileText,
      trend: { value: "+8%", positive: true },
      href: "/admin/audit-logs",
    },
  ];

  const quickLinks = [
    {
      title: "Manage Roles",
      description:
        "Create, edit, and assign user roles with custom permissions",
      icon: Shield,
      href: "/admin/roles",
      permission: "view:roles",
    },
    {
      title: "Configure Permissions",
      description:
        "Define and manage granular access controls for your application",
      icon: Key,
      href: "/admin/permissions",
      permission: "view:permissions",
    },
    {
      title: "User Management",
      description: "View, edit, and manage user accounts and their assignments",
      icon: Users,
      href: "/admin/users",
      permission: "view:users",
    },
    {
      title: "Audit Logs",
      description: "Track and review all system activities and changes",
      icon: FileText,
      href: "/admin/audit-logs",
      permission: "view:audit_logs",
    },
  ];

  // Mock recent activity - Replace with actual data
  const recentActivities: ActivityItem[] = [
    {
      id: "1",
      user: "Aisha Alhazmi",
      action: "created role",
      target: "Content Editor",
      timestamp: "5 minutes ago",
      type: "create",
    },
    {
      id: "2",
      user: "Sara Almutairi",
      action: "updated permissions for",
      target: "Moderator",
      timestamp: "1 hour ago",
      type: "update",
    },
    {
      id: "3",
      user: "Yousef Alqahtani",
      action: "assigned role",
      target: "Admin to user@example.com",
      timestamp: "2 hours ago",
      type: "update",
    },
    {
      id: "4",
      user: "Admin",
      action: "deleted role",
      target: "Guest User",
      timestamp: "3 hours ago",
      type: "delete",
    },
    {
      id: "5",
      user: "System",
      action: "created audit log entry for",
      target: "bulk user import",
      timestamp: "5 hours ago",
      type: "create",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <AdminSectionHeader
        title="Admin Dashboard"
        description="Manage roles, permissions, users, and monitor system activity"
      />

      {/* Statistics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </div>

      {/* Quick Links Section */}
      <div>
        <div className="mb-4 flex items-center gap-2">
          <Activity className="text-muted-foreground h-5 w-5" />
          <h2 className="text-xl font-semibold">Quick Actions</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {quickLinks.map((link) => (
            <QuickLink key={link.href} {...link} />
          ))}
        </div>
      </div>

      {/* Recent Activity Feed */}
      <PermissionGuard permission={PERMISSIONS.AUDIT_LOGS_VIEW}>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>
                  Latest administrative actions and changes
                </CardDescription>
              </div>
              <Button asChild variant="outline" size="sm">
                <Link href="/admin/audit-logs">View all</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <ActivityFeed activities={recentActivities} />
          </CardContent>
        </Card>
      </PermissionGuard>

      {/* System Health Indicators (Optional - can be expanded) */}
      <Card className="bg-barq-yellow/5 border-barq-yellow/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="text-barq-yellow h-5 w-5" />
            System Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <div className="bg-success h-3 w-3 rounded-full" />
            <span className="text-sm font-medium">All systems operational</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
