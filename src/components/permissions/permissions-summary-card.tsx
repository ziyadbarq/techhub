"use client";

/**
 * Permissions Summary Card
 * Displays key statistics about permissions: total, system, active, inactive
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Database, ShieldCheck, Shield, ShieldOff } from "lucide-react";
import type { PermissionDTO } from "@/interface-adapters/presenters/permission.presenter";

interface PermissionsSummaryCardProps {
  permissions: PermissionDTO[];
  loading?: boolean;
}

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  description?: string;
  color?: string;
}

function StatCard({
  title,
  value,
  icon,
  description,
  color = "text-barq-yellow",
}: StatCardProps) {
  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className={color}>{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value.toLocaleString()}</div>
        {description && (
          <p className="text-muted-foreground mt-1 text-xs">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}

function StatCardSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-4" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-16" />
        <Skeleton className="mt-1 h-3 w-32" />
      </CardContent>
    </Card>
  );
}

export function PermissionsSummaryCard({
  permissions,
  loading,
}: PermissionsSummaryCardProps) {
  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>
    );
  }

  const stats = {
    total: permissions.length,
    system: permissions.filter((p) => p.isSystem).length,
    active: permissions.filter((p) => p.isActive && !p.isSystem).length,
    inactive: permissions.filter((p) => !p.isActive).length,
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Total Permissions"
        value={stats.total}
        icon={<Database className="h-[30px] w-[30px]" />}
        description="All permissions in system"
        color="text-blue-500"
      />
      <StatCard
        title="System Permissions"
        value={stats.system}
        icon={<ShieldCheck className="h-[30px] w-[30px]" />}
        description="Built-in system permissions"
        color="text-barq-yellow"
      />
      <StatCard
        title="Active Permissions"
        value={stats.active}
        icon={<Shield className="h-[30px] w-[30px]" />}
        description="Custom active permissions"
        color="text-green-500"
      />
      <StatCard
        title="Inactive Permissions"
        value={stats.inactive}
        icon={<ShieldOff className="h-[30px] w-[30px]" />}
        description="Disabled permissions"
        color="text-gray-500"
      />
    </div>
  );
}
