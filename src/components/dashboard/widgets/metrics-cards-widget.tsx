"use client";

/**
 * Metrics Cards Widget
 * Summary metrics for dashboard overview
 */

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Package,
  Wrench,
  ShieldAlert,
  AlertTriangle,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";
import {
  getDashboardMetricsAction,
  type DashboardMetricsDTO,
} from "@/interface-adapters/controllers/my-dashboard.controller";

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  description?: string;
  trend?: string;
  color?: string;
}

function MetricCard({
  title,
  value,
  icon,
  description,
  trend,
  color = "text-barq-yellow",
}: MetricCardProps) {
  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className={color}>{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-muted-foreground mt-1 text-xs">{description}</p>
        )}
        {trend && (
          <p className="text-muted-foreground mt-2 flex items-center gap-1 text-xs">
            <TrendingUp className="h-3 w-3" />
            {trend}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export function MetricsCardsWidget() {
  const [metrics, setMetrics] = useState<DashboardMetricsDTO>({
    totalAssets: 0,
    pendingMaintenance: 0,
    expiringWarranties: 0,
    overdueMaintenance: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMetrics() {
      try {
        setLoading(true);
        const result = await getDashboardMetricsAction();
        if (result.success) {
          setMetrics(result.data);
        } else {
          toast.error(result.error);
        }
      } catch {
        toast.error("Failed to load metrics");
      } finally {
        setLoading(false);
      }
    }

    fetchMetrics();
  }, []);

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="bg-muted h-4 w-24 rounded" />
            </CardHeader>
            <CardContent>
              <div className="bg-muted h-8 w-16 rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <MetricCard
        title="Total Assets"
        value={metrics.totalAssets.toLocaleString()}
        icon={<Package className="h-4 w-4" />}
        description="Active assets in inventory"
        color="text-blue-500"
      />
      <MetricCard
        title="Pending Maintenance"
        value={metrics.pendingMaintenance}
        icon={<Wrench className="h-4 w-4" />}
        description="Tasks due this week"
        color="text-orange-500"
      />
      <MetricCard
        title="Expiring Warranties"
        value={metrics.expiringWarranties}
        icon={<ShieldAlert className="h-4 w-4" />}
        description="Expiring within 30 days"
        color="text-red-500"
      />
      <MetricCard
        title="Overdue Maintenance"
        value={metrics.overdueMaintenance}
        icon={<AlertTriangle className="h-4 w-4" />}
        description="Past due date"
        color="text-amber-600 dark:text-yellow-500"
      />
    </div>
  );
}
