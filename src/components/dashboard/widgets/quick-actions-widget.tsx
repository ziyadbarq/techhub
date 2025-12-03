"use client";

/**
 * Quick Actions Widget
 * Shortcut buttons for common tasks, filtered by feature flags and permissions
 */

import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Plus,
  Package,
  TrendingUp,
  Wrench,
  ShieldCheck,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { useIsFeatureEnabled } from "@/hooks/use-feature-flags";
import { usePermissions } from "@/hooks/use-permissions";
import type { PermissionKey } from "@/core/domain/value-objects/permission-key";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";

interface QuickAction {
  label: string;
  href: string;
  icon: LucideIcon;
  description: string;
  color: string;
  featureFlag?: string;
  permission?: PermissionKey;
}

const quickActions: QuickAction[] = [
  {
    label: "Add Asset",
    href: "/assets?action=create",
    icon: Plus,
    description: "Add new asset",
    color: "bg-blue-500 hover:bg-blue-600",
    featureFlag: "ASSETS",
    permission: PERMISSIONS.ASSETS_CREATE,
  },
  {
    label: "Assign Asset",
    href: "/asset-assignments?action=create",
    icon: Package,
    description: "Assign to employee",
    color: "bg-green-500 hover:bg-green-600",
    featureFlag: "ASSETS",
    permission: PERMISSIONS.ASSET_ASSIGNMENTS_CREATE,
  },
  {
    label: "Stock Movement",
    href: "/stock-movements?action=create",
    icon: TrendingUp,
    description: "Record movement",
    color: "bg-purple-500 hover:bg-purple-600",
    featureFlag: "INVENTORY",
    permission: PERMISSIONS.STOCK_MOVEMENTS_CREATE,
  },
  {
    label: "Schedule Maintenance",
    href: "/maintenance/schedules?action=create",
    icon: Wrench,
    description: "Create schedule",
    color: "bg-orange-500 hover:bg-orange-600",
    featureFlag: "MAINTENANCE",
    permission: PERMISSIONS.MAINTENANCE_SCHEDULES_CREATE,
  },
  {
    label: "Add Warranty",
    href: "/warranties?action=create",
    icon: ShieldCheck,
    description: "Register warranty",
    color: "bg-indigo-500 hover:bg-indigo-600",
    featureFlag: "WARRANTIES",
    permission: PERMISSIONS.WARRANTIES_CREATE,
  },
];

function QuickActionButton({ action }: { action: QuickAction }) {
  const isFeatureEnabled = useIsFeatureEnabled(action.featureFlag ?? "");
  const { hasPermission, isLoading } = usePermissions();

  // Skip if feature flag is specified and disabled
  if (action.featureFlag && !isFeatureEnabled) {
    return null;
  }

  // Skip if permission is specified and user doesn't have it (after loading)
  if (action.permission && !isLoading && !hasPermission(action.permission)) {
    return null;
  }

  const Icon = action.icon;

  return (
    <Button
      variant="outline"
      className="hover:bg-accent h-auto justify-start gap-3 p-3 text-left transition-colors"
      asChild
    >
      <Link href={action.href}>
        <div className={`rounded-md p-2 text-white ${action.color}`}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium">{action.label}</p>
          <p className="text-muted-foreground text-xs">{action.description}</p>
        </div>
      </Link>
    </Button>
  );
}

export function QuickActionsWidget() {
  const { isLoading } = usePermissions();

  // Show loading skeleton while permissions are loading
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="text-barq-yellow h-5 w-5" />
            Quick Actions
          </CardTitle>
          <CardDescription>Shortcuts to common tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-muted h-16 animate-pulse rounded-md" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="text-barq-yellow h-5 w-5" />
          Quick Actions
        </CardTitle>
        <CardDescription>Shortcuts to common tasks</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
          {quickActions.map((action) => (
            <QuickActionButton key={action.href} action={action} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
