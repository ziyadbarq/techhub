"use client";

/**
 * CMDB Health Dashboard
 *
 * Client component that displays CMDB data quality metrics including
 * completeness, freshness, orphan rate, and ownership compliance.
 */

import { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Database,
  Link2,
  Network,
  RefreshCw,
  Shield,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { getCMDBHealthMetricsAction } from "@/interface-adapters/controllers/cmdb-health.controller";
import type { CMDBHealthMetrics } from "@/core/use-cases/cmdb/data-quality";

function getScoreColor(score: number): string {
  if (score >= 80) return "text-green-600 dark:text-green-400";
  if (score >= 60) return "text-yellow-600 dark:text-yellow-400";
  return "text-red-600 dark:text-red-400";
}

function getScoreBadgeVariant(
  score: number,
): "default" | "secondary" | "destructive" | "outline" {
  if (score >= 80) return "default";
  if (score >= 60) return "secondary";
  return "destructive";
}

function getProgressColor(score: number): string {
  if (score >= 80) return "[&>div]:bg-green-600";
  if (score >= 60) return "[&>div]:bg-yellow-500";
  return "[&>div]:bg-red-500";
}

function ScoreCard({
  title,
  description,
  score,
  icon: Icon,
  details,
}: {
  title: string;
  description: string;
  score: number;
  icon: React.ComponentType<{ className?: string }>;
  details: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          <CardDescription className="text-xs">{description}</CardDescription>
        </div>
        <Icon className="text-muted-foreground h-4 w-4" />
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline gap-2">
          <span className={`text-2xl font-bold ${getScoreColor(score)}`}>
            {score}%
          </span>
          <Badge variant={getScoreBadgeVariant(score)} className="text-xs">
            {score >= 80 ? "Healthy" : score >= 60 ? "Fair" : "Needs Attention"}
          </Badge>
        </div>
        <Progress
          value={score}
          className={`mt-2 h-2 ${getProgressColor(score)}`}
        />
        <div className="text-muted-foreground mt-3 text-xs">{details}</div>
      </CardContent>
    </Card>
  );
}

function StatCard({
  title,
  value,
  icon: Icon,
  description,
}: {
  title: string;
  value: number | string;
  icon: React.ComponentType<{ className?: string }>;
  description?: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="text-muted-foreground h-4 w-4" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-muted-foreground text-xs">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}

function BreakdownList({
  title,
  items,
  labelKey,
  valueKey,
  emptyLabel,
}: {
  title: string;
  items: Array<Record<string, unknown>>;
  labelKey: string;
  valueKey: string;
  emptyLabel?: string;
}) {
  const total = items.reduce(
    (sum, item) => sum + (Number(item[valueKey]) || 0),
    0,
  );

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-muted-foreground text-sm">No data available</p>
        ) : (
          <div className="space-y-3">
            {items.map((item, idx) => {
              const label = (item[labelKey] as string) || emptyLabel || "N/A";
              const count = Number(item[valueKey]) || 0;
              const pct = total > 0 ? Math.round((count / total) * 100) : 0;
              return (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="truncate">{label}</span>
                    <span className="font-medium">
                      {count} ({pct}%)
                    </span>
                  </div>
                  <Progress value={pct} className="h-1.5" />
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16" />
              <Skeleton className="mt-2 h-2 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function CMDBHealthDashboard() {
  const [metrics, setMetrics] = useState<CMDBHealthMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadMetrics = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const result = await getCMDBHealthMetricsAction();

    if (result.success) {
      setMetrics(result.data);
    } else {
      setError(result.error);
      toast.error(result.error);
    }

    setIsLoading(false);
  }, []);

  useEffect(() => {
    // Intentionally calling async function in effect for data fetching on mount
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadMetrics();
  }, [loadMetrics]);

  if (isLoading && !metrics) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              CMDB Health Dashboard
            </h1>
            <p className="text-muted-foreground">Loading metrics...</p>
          </div>
        </div>
        <DashboardSkeleton />
      </div>
    );
  }

  if (error && !metrics) {
    return (
      <div className="space-y-6 p-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            CMDB Health Dashboard
          </h1>
          <p className="text-destructive text-sm">{error}</p>
        </div>
        <Button onClick={loadMetrics} variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" />
          Retry
        </Button>
      </div>
    );
  }

  if (!metrics) return null;

  const overallScore = Math.round(
    (metrics.completenessScore + metrics.freshnessScore) / 2,
  );

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            CMDB Health Dashboard
          </h1>
          <p className="text-muted-foreground">
            Data quality metrics computed at{" "}
            {new Date(metrics.computedAt).toLocaleString()}
          </p>
        </div>
        <Button
          onClick={loadMetrics}
          variant="outline"
          size="sm"
          disabled={isLoading}
        >
          <RefreshCw
            className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>

      {/* Overall Health + Score Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <ScoreCard
          title="Overall Health"
          description="Average of completeness and freshness"
          score={overallScore}
          icon={Activity}
          details={
            <span>
              Completeness: {metrics.completenessScore}% | Freshness:{" "}
              {metrics.freshnessScore}%
            </span>
          }
        />

        <ScoreCard
          title="Completeness"
          description="Owner, lifecycle, criticality, required fields"
          score={metrics.completenessScore}
          icon={CheckCircle2}
          details={
            <div className="space-y-0.5">
              <div>Missing owner: {metrics.cisWithoutOwner}</div>
              <div>Missing lifecycle: {metrics.cisWithoutLifecycleState}</div>
              <div>Missing criticality: {metrics.cisWithoutCriticality}</div>
              <div>
                Missing required fields: {metrics.cisMissingRequiredFields}
              </div>
            </div>
          }
        />

        <ScoreCard
          title="Freshness"
          description="CIs updated within 30 days"
          score={metrics.freshnessScore}
          icon={Clock}
          details={
            <div className="space-y-0.5">
              <div>Stale 30+ days: {metrics.staleOver30Days}</div>
              <div>Stale 60+ days: {metrics.staleOver60Days}</div>
              <div>Stale 90+ days: {metrics.staleOver90Days}</div>
            </div>
          }
        />

        <ScoreCard
          title="Ownership Compliance"
          description="CIs with assigned owner"
          score={metrics.ownershipComplianceRate}
          icon={Users}
          details={
            <span>
              {metrics.totalCIs - metrics.cisWithoutOwner} of {metrics.totalCIs}{" "}
              CIs have an owner
            </span>
          }
        />
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total CIs"
          value={metrics.totalCIs.toLocaleString()}
          icon={Database}
          description="Active configuration items"
        />

        <StatCard
          title="Relationships"
          value={metrics.totalRelationships.toLocaleString()}
          icon={Network}
          description="Active CI relationships"
        />

        <StatCard
          title="CI Classes"
          value={metrics.totalCIClasses}
          icon={Shield}
          description="Defined CI class types"
        />

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Orphan Rate</CardTitle>
            {metrics.orphanRate > 20 ? (
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
            ) : (
              <Link2 className="text-muted-foreground h-4 w-4" />
            )}
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span
                className={`text-2xl font-bold ${
                  metrics.orphanRate <= 20
                    ? "text-green-600 dark:text-green-400"
                    : metrics.orphanRate <= 40
                      ? "text-yellow-600 dark:text-yellow-400"
                      : "text-red-600 dark:text-red-400"
                }`}
              >
                {metrics.orphanRate}%
              </span>
              <Badge
                variant={
                  metrics.orphanRate <= 20
                    ? "default"
                    : metrics.orphanRate <= 40
                      ? "secondary"
                      : "destructive"
                }
                className="text-xs"
              >
                {metrics.orphanCIs} orphan CIs
              </Badge>
            </div>
            <p className="text-muted-foreground mt-1 text-xs">
              CIs with zero relationships
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Breakdowns */}
      <div className="grid gap-4 md:grid-cols-3">
        <BreakdownList
          title="CIs by Class"
          items={metrics.cisByClass}
          labelKey="ciClassName"
          valueKey="count"
        />

        <BreakdownList
          title="CIs by Criticality"
          items={metrics.cisByCriticality}
          labelKey="criticality"
          valueKey="count"
          emptyLabel="Not Set"
        />

        <BreakdownList
          title="CIs by Environment"
          items={metrics.cisByEnvironment}
          labelKey="environment"
          valueKey="count"
          emptyLabel="Not Set"
        />
      </div>
    </div>
  );
}
