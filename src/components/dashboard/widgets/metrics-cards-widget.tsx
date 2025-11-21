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

interface MetricsData {
  totalAssets: number;
  pendingMaintenance: number;
  expiringWarranties: number;
  stockAlerts: number;
}

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
  const [metrics, setMetrics] = useState<MetricsData>({
    totalAssets: 0,
    pendingMaintenance: 0,
    expiringWarranties: 0,
    stockAlerts: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMetrics() {
      try {
        setLoading(true);
        // TODO: Replace with actual server action
        // For now, using placeholder data
        await new Promise((resolve) => setTimeout(resolve, 500));
        setMetrics({
          totalAssets: 1250,
          pendingMaintenance: 12,
          expiringWarranties: 8,
          stockAlerts: 5,
        });
      } catch (error) {
        console.error("Failed to fetch metrics:", error);
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
        title="Stock Alerts"
        value={metrics.stockAlerts}
        icon={<AlertTriangle className="h-4 w-4" />}
        description="Low stock or issues"
        color="text-yellow-500"
      />
    </div>
  );
}
