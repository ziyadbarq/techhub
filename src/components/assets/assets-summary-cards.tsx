"use client";

/**
 * Assets Summary Cards
 * Displays key statistics about assets: total, assigned, available
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Package, UserCheck, PackageOpen } from "lucide-react";
import type { AssetStatistics } from "@/core/repositories/asset.repository.interface";

interface AssetsSummaryCardsProps {
  statistics: AssetStatistics | null;
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

export function AssetsSummaryCards({
  statistics,
  loading,
}: AssetsSummaryCardsProps) {
  if (loading || !statistics) {
    return (
      <div className="grid gap-4 md:grid-cols-3">
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <StatCard
        title="Total Assets"
        value={statistics.total}
        icon={<Package className="h-4 w-4" />}
        description="All assets in system"
        color="text-blue-500"
      />
      <StatCard
        title="Assigned"
        value={statistics.assigned}
        icon={<UserCheck className="h-4 w-4" />}
        description="Currently assigned to employees"
        color="text-purple-500"
      />
      <StatCard
        title="Available"
        value={statistics.available}
        icon={<PackageOpen className="h-4 w-4" />}
        description="In stock, ready to assign"
        color="text-amber-500"
      />
    </div>
  );
}
