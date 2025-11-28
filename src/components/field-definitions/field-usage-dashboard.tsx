/**
 * Field Usage Dashboard Component
 * Displays usage statistics and analytics for field definitions
 */

"use client";

import * as React from "react";
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
  Database,
  Layers,
  Box,
  FileKey,
  Archive,
  AlertCircle,
  CheckCircle2,
  BarChart3,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type {
  FieldUsageDashboardDTO,
  FieldWithUsageDTO,
  DataTypeDistributionDTO,
  FieldDefinitionDTO,
} from "@/interface-adapters/presenters/field-definition.presenter";
import { getFieldUsageDashboardAction } from "@/interface-adapters/controllers/field-definition.controller";

interface FieldUsageDashboardProps {
  onViewField?: (field: FieldDefinitionDTO) => void;
}

export function FieldUsageDashboard({ onViewField }: FieldUsageDashboardProps) {
  const [dashboardData, setDashboardData] =
    React.useState<FieldUsageDashboardDTO | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  const loadDashboard = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await getFieldUsageDashboardAction();
      if (result.success) {
        setDashboardData(result.data);
      } else {
        toast.error(result.error || "Failed to load dashboard");
      }
    } catch {
      toast.error("Failed to load dashboard");
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (!dashboardData) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-10">
          <AlertCircle className="text-muted-foreground mb-4 h-12 w-12" />
          <p className="text-muted-foreground">Failed to load dashboard data</p>
          <Button onClick={loadDashboard} variant="outline" className="mt-4">
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  const usagePercentage =
    dashboardData.totalFields > 0
      ? (dashboardData.fieldsInUse / dashboardData.totalFields) * 100
      : 0;

  return (
    <div className="space-y-6">
      {/* Header with refresh */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Field Usage Analytics</h3>
          <p className="text-muted-foreground text-sm">
            Overview of custom field definitions and their usage across the
            system
          </p>
        </div>
        <Button onClick={loadDashboard} variant="outline" size="sm">
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          title="Total Fields"
          value={dashboardData.totalFields}
          description={`${dashboardData.fieldsInUse} in use`}
          icon={<Database className="h-4 w-4" />}
        />
        <SummaryCard
          title="Usage Rate"
          value={`${usagePercentage.toFixed(1)}%`}
          description={`${dashboardData.unusedFields} unused fields`}
          icon={<BarChart3 className="h-4 w-4" />}
          trend={
            usagePercentage >= 80
              ? "positive"
              : usagePercentage >= 50
                ? "neutral"
                : "warning"
          }
        />
        <SummaryCard
          title="Asset Categories"
          value={dashboardData.totalAssetCategoriesWithFields}
          description={`${dashboardData.totalAssetsWithValues.toLocaleString()} assets with values`}
          icon={<Layers className="h-4 w-4" />}
        />
        <SummaryCard
          title="CI Classes"
          value={dashboardData.totalCIClassesWithFields}
          description={`${dashboardData.totalCIsWithValues.toLocaleString()} CIs with values`}
          icon={<Box className="h-4 w-4" />}
        />
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Data Type Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FileKey className="h-4 w-4" />
              Data Type Distribution
            </CardTitle>
            <CardDescription>Fields by data type</CardDescription>
          </CardHeader>
          <CardContent>
            <DataTypeChart distribution={dashboardData.dataTypeDistribution} />
          </CardContent>
        </Card>

        {/* Usage Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart3 className="h-4 w-4" />
              Field Usage Status
            </CardTitle>
            <CardDescription>Active vs unused fields</CardDescription>
          </CardHeader>
          <CardContent>
            <UsagePieChart
              inUse={dashboardData.fieldsInUse}
              unused={dashboardData.unusedFields}
              archived={dashboardData.archivedFields.length}
            />
          </CardContent>
        </Card>
      </div>

      {/* Top Used Fields */}
      {dashboardData.topUsedFields.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CheckCircle2 className="h-4 w-4" />
              Most Used Fields
            </CardTitle>
            <CardDescription>
              Top 10 field definitions by usage count
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TopFieldsTable
              fields={dashboardData.topUsedFields}
              onViewField={onViewField}
            />
          </CardContent>
        </Card>
      )}

      {/* Unused Fields Warning */}
      {dashboardData.unusedFieldsList.length > 0 && (
        <Card className="border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base text-amber-700 dark:text-amber-400">
              <AlertCircle className="h-4 w-4" />
              Unused Fields ({dashboardData.unusedFieldsList.length})
            </CardTitle>
            <CardDescription className="text-amber-600 dark:text-amber-500">
              These field definitions are not assigned to any category, class,
              or product
            </CardDescription>
          </CardHeader>
          <CardContent>
            <UnusedFieldsList
              fields={dashboardData.unusedFieldsList}
              onViewField={onViewField}
            />
          </CardContent>
        </Card>
      )}

      {/* Archived Fields */}
      {dashboardData.archivedFields.length > 0 && (
        <Card className="border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base text-slate-600 dark:text-slate-400">
              <Archive className="h-4 w-4" />
              Archived Fields ({dashboardData.archivedFields.length})
            </CardTitle>
            <CardDescription>
              Preserved but no longer active field definitions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {dashboardData.archivedFields.map((field) => (
                <Badge
                  key={field.id}
                  variant="secondary"
                  className="cursor-pointer"
                  onClick={() => onViewField?.(field)}
                >
                  {field.label}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ==========================================
// Sub-components
// ==========================================

function SummaryCard({
  title,
  value,
  description,
  icon,
  trend,
}: {
  title: string;
  value: string | number;
  description: string;
  icon: React.ReactNode;
  trend?: "positive" | "neutral" | "warning";
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="text-muted-foreground">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p
          className={`text-xs ${
            trend === "positive"
              ? "text-green-600"
              : trend === "warning"
                ? "text-amber-600"
                : "text-muted-foreground"
          }`}
        >
          {description}
        </p>
      </CardContent>
    </Card>
  );
}

function DataTypeChart({
  distribution,
}: {
  distribution: DataTypeDistributionDTO[];
}) {
  const data = distribution.map((item) => ({
    name: formatDataType(item.dataType),
    total: item.count,
    inUse: item.inUseCount,
  }));

  if (data.length === 0) {
    return (
      <div className="text-muted-foreground flex h-[300px] items-center justify-center">
        No data available
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} layout="vertical">
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis type="number" />
        <YAxis dataKey="name" type="category" width={100} />
        <Tooltip />
        <Legend />
        <Bar dataKey="total" fill="#8884d8" name="Total" />
        <Bar dataKey="inUse" fill="#82ca9d" name="In Use" />
      </BarChart>
    </ResponsiveContainer>
  );
}

function UsagePieChart({
  inUse,
  unused,
  archived,
}: {
  inUse: number;
  unused: number;
  archived: number;
}) {
  const data = [
    { name: "In Use", value: inUse, color: "#22c55e" },
    { name: "Unused", value: unused, color: "#f59e0b" },
    { name: "Archived", value: archived, color: "#94a3b8" },
  ].filter((item) => item.value > 0);

  if (data.length === 0) {
    return (
      <div className="text-muted-foreground flex h-[300px] items-center justify-center">
        No data available
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
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
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip />
      </PieChart>
    </ResponsiveContainer>
  );
}

function TopFieldsTable({
  fields,
  onViewField,
}: {
  fields: FieldWithUsageDTO[];
  onViewField?: (field: FieldDefinitionDTO) => void;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b text-sm">
            <th className="pb-2 text-left font-medium">#</th>
            <th className="pb-2 text-left font-medium">Field</th>
            <th className="pb-2 text-left font-medium">Type</th>
            <th className="pb-2 text-right font-medium">Categories</th>
            <th className="pb-2 text-right font-medium">CI Classes</th>
            <th className="pb-2 text-right font-medium">Assets</th>
            <th className="pb-2 text-right font-medium">Total Usage</th>
          </tr>
        </thead>
        <tbody>
          {fields.map((item, index) => (
            <tr key={item.field.id} className="border-b">
              <td className="text-muted-foreground py-2 text-sm">
                {index + 1}
              </td>
              <td className="py-2">
                <button
                  onClick={() => onViewField?.(item.field)}
                  className="text-primary text-left font-medium hover:underline"
                >
                  {item.field.label}
                </button>
                <p className="text-muted-foreground text-xs">
                  {item.field.name}
                </p>
              </td>
              <td className="py-2">
                <Badge variant="outline" className="text-xs">
                  {formatDataType(item.field.dataType)}
                </Badge>
              </td>
              <td className="py-2 text-right tabular-nums">
                {item.usage.assetCategoryCount}
              </td>
              <td className="py-2 text-right tabular-nums">
                {item.usage.ciClassCount}
              </td>
              <td className="py-2 text-right tabular-nums">
                {item.usage.assetValueCount.toLocaleString()}
              </td>
              <td className="py-2 text-right">
                <Badge>{item.usage.totalUsageCount.toLocaleString()}</Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function UnusedFieldsList({
  fields,
  onViewField,
}: {
  fields: FieldDefinitionDTO[];
  onViewField?: (field: FieldDefinitionDTO) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {fields.map((field) => (
        <Badge
          key={field.id}
          variant="outline"
          className="cursor-pointer border-amber-300 hover:bg-amber-100 dark:border-amber-700 dark:hover:bg-amber-900/20"
          onClick={() => onViewField?.(field)}
        >
          {field.label}
          <span className="text-muted-foreground ml-1 text-xs">
            ({formatDataType(field.dataType)})
          </span>
        </Badge>
      ))}
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="mt-1 h-4 w-72" />
        </div>
        <Skeleton className="h-9 w-24" />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-20" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16" />
              <Skeleton className="mt-1 h-3 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-40" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[300px] w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-40" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[300px] w-full" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ==========================================
// Helpers
// ==========================================

function formatDataType(dataType: string): string {
  return dataType
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
