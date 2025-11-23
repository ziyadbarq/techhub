/**
 * Asset Dashboard Client Component
 */

"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Package,
  DollarSign,
  ShieldCheck,
  Archive,
  TrendingUp,
  Activity,
} from "lucide-react";
import {
  getAssetSummaryStatsAction,
  getAssetsByCategoryAction,
  getAssetsByLifecycleStateAction,
  getWarrantyStatusBreakdownAction,
  getAssetsByLocationAction,
  getRecentActivityAction,
  type AssetSummaryStats,
  type CategoryBreakdown,
  type LifecycleStateBreakdown,
  type WarrantyStatusBreakdown,
  type LocationBreakdown,
  type RecentActivity,
} from "@/interface-adapters/controllers/asset-dashboard.controller";
import { toast } from "sonner";
import { formatDistance } from "date-fns";
import { formatSAR } from "@/lib/utils";

const COLORS = {
  primary: "#FFCF52",
  success: "#10b981",
  warning: "#f59e0b",
  danger: "#ef4444",
  info: "#3b82f6",
  neutral: "#6b7280",
};

interface SummaryCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  description?: string;
  trend?: string;
  color?: string;
}

function SummaryCard({
  title,
  value,
  icon,
  description,
  trend,
  color = "text-primary",
}: SummaryCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className={color}>{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-muted-foreground text-xs">{description}</p>
        )}
        {trend && (
          <p className="text-muted-foreground flex items-center gap-1 text-xs">
            <TrendingUp className="h-3 w-3" />
            {trend}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export function AssetDashboardClient() {
  const [summaryStats, setSummaryStats] = useState<AssetSummaryStats | null>(
    null,
  );
  const [categoryData, setCategoryData] = useState<CategoryBreakdown[]>([]);
  const [lifecycleData, setLifecycleData] = useState<LifecycleStateBreakdown[]>(
    [],
  );
  const [warrantyData, setWarrantyData] =
    useState<WarrantyStatusBreakdown | null>(null);
  const [locationData, setLocationData] = useState<LocationBreakdown[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        setLoading(true);

        const [
          summaryResult,
          categoryResult,
          lifecycleResult,
          warrantyResult,
          locationResult,
          activityResult,
        ] = await Promise.all([
          getAssetSummaryStatsAction(),
          getAssetsByCategoryAction(),
          getAssetsByLifecycleStateAction(),
          getWarrantyStatusBreakdownAction(),
          getAssetsByLocationAction(),
          getRecentActivityAction(),
        ]);

        if (summaryResult.success && summaryResult.data) {
          setSummaryStats(summaryResult.data);
        }
        if (categoryResult.success && categoryResult.data) {
          setCategoryData(categoryResult.data);
        }
        if (lifecycleResult.success && lifecycleResult.data) {
          setLifecycleData(lifecycleResult.data);
        }
        if (warrantyResult.success && warrantyResult.data) {
          setWarrantyData(warrantyResult.data);
        }
        if (locationResult.success && locationResult.data) {
          setLocationData(locationResult.data);
        }
        if (activityResult.success && activityResult.data) {
          setRecentActivity(activityResult.data);
        }
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
        toast.error("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, []);

  if (loading || !summaryStats) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-muted-foreground">Loading dashboard...</div>
      </div>
    );
  }

  // Prepare warranty pie chart data
  const warrantyChartData = warrantyData
    ? [
        { name: "Active", value: warrantyData.active, color: COLORS.success },
        {
          name: "Expiring Soon",
          value: warrantyData.expiringSoon,
          color: COLORS.warning,
        },
        { name: "Expired", value: warrantyData.expired, color: COLORS.danger },
        {
          name: "No Warranty",
          value: warrantyData.none,
          color: COLORS.neutral,
        },
      ]
    : [];

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          title="Total Assets"
          value={summaryStats.totalAssets.toLocaleString()}
          icon={<Package className="h-4 w-4" />}
          description="Total assets in inventory"
          color="text-blue-500"
        />
        <SummaryCard
          title="Total Value"
          value={formatSAR(summaryStats.totalValue)}
          icon={<DollarSign className="h-4 w-4" />}
          description="Total asset value (in SAR)"
          color="text-green-500"
        />
        <SummaryCard
          title="Under Warranty"
          value={summaryStats.assetsUnderWarranty.toLocaleString()}
          icon={<ShieldCheck className="h-4 w-4" />}
          description="Assets with active warranty"
          color="text-purple-500"
        />
        <SummaryCard
          title="Unassigned"
          value={summaryStats.unassignedAssets.toLocaleString()}
          icon={<Archive className="h-4 w-4" />}
          description="Assets not assigned"
          color="text-orange-500"
        />
      </div>

      {/* Charts Section */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Assets by Category */}
        <Card>
          <CardHeader>
            <CardTitle>Assets by Category</CardTitle>
            <CardDescription>
              Distribution of assets across categories
            </CardDescription>
          </CardHeader>
          <CardContent>
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={categoryData.slice(0, 8)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="categoryName"
                    angle={-45}
                    textAnchor="end"
                    height={100}
                    fontSize={12}
                  />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill={COLORS.primary} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-muted-foreground flex h-[300px] items-center justify-center">
                No category data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Assets by Lifecycle State */}
        <Card>
          <CardHeader>
            <CardTitle>Assets by Lifecycle State</CardTitle>
            <CardDescription>Asset lifecycle distribution</CardDescription>
          </CardHeader>
          <CardContent>
            {lifecycleData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={lifecycleData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="stateName"
                    angle={-45}
                    textAnchor="end"
                    height={100}
                    fontSize={12}
                  />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill={COLORS.info} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-muted-foreground flex h-[300px] items-center justify-center">
                No lifecycle data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Warranty Status */}
        <Card>
          <CardHeader>
            <CardTitle>Warranty Status</CardTitle>
            <CardDescription>Warranty coverage breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            {warrantyChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={warrantyChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) =>
                      `${name}: ${((percent || 0) * 100).toFixed(0)}%`
                    }
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {warrantyChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-muted-foreground flex h-[300px] items-center justify-center">
                No warranty data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Assets by Location */}
        <Card>
          <CardHeader>
            <CardTitle>Assets by Location</CardTitle>
            <CardDescription>Top 5 locations by asset count</CardDescription>
          </CardHeader>
          <CardContent>
            {locationData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={locationData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="locationName" type="category" width={100} />
                  <Tooltip />
                  <Bar dataKey="count" fill={COLORS.success} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-muted-foreground flex h-[300px] items-center justify-center">
                No location data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Recent Activity
          </CardTitle>
          <CardDescription>
            Latest assignments and stock movements
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recentActivity.length > 0 ? (
            <div className="space-y-4">
              {recentActivity.slice(0, 10).map((activity) => (
                <div
                  key={`${activity.type}-${activity.id}`}
                  className="flex items-start gap-4 border-b pb-3 last:border-0"
                >
                  <div
                    className={`rounded-full p-2 ${activity.type === "assignment" ? "bg-blue-100 text-blue-600" : "bg-green-100 text-green-600"}`}
                  >
                    {activity.type === "assignment" ? (
                      <Package className="h-4 w-4" />
                    ) : (
                      <TrendingUp className="h-4 w-4" />
                    )}
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium">
                      {activity.assetTag}
                      <span className="text-muted-foreground ml-2 font-normal">
                        {activity.description}
                      </span>
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {formatDistance(
                        new Date(activity.timestamp),
                        new Date(),
                        {
                          addSuffix: true,
                        },
                      )}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-muted-foreground flex h-32 items-center justify-center">
              No recent activity
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
