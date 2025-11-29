/**
 * Model Statistics Tab
 * Displays usage analytics and statistics for assets using this model
 */

"use client";

import { useMemo } from "react";
import { Package, MapPin, Activity, DollarSign, Calendar } from "lucide-react";
import { differenceInMonths } from "date-fns";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import type { AssetDTO } from "@/interface-adapters/presenters/asset.presenter";
import type { AssetModelDTO } from "@/interface-adapters/presenters/asset-model.presenter";

interface ModelStatisticsTabProps {
  assets: AssetDTO[];
  model: AssetModelDTO;
}

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: React.ElementType;
}

function StatCard({ title, value, description, icon: Icon }: StatCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="text-muted-foreground h-4 w-4" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-muted-foreground mt-1 text-xs">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}

export function ModelStatisticsTab({ assets, model }: ModelStatisticsTabProps) {
  const statistics = useMemo(() => {
    // Count by condition
    const conditionCounts: Record<string, number> = {
      NEW: 0,
      GOOD: 0,
      FAIR: 0,
      POOR: 0,
      UNKNOWN: 0,
    };
    assets.forEach((asset) => {
      const condition = asset.condition || "UNKNOWN";
      conditionCounts[condition] = (conditionCounts[condition] || 0) + 1;
    });

    // Count by lifecycle state
    const lifecycleStateCounts: Record<string, number> = {};
    assets.forEach((asset) => {
      const state = asset.lifecycleStateName || "Not Set";
      lifecycleStateCounts[state] = (lifecycleStateCounts[state] || 0) + 1;
    });

    // Count by location
    const locationCounts: Record<string, number> = {};
    assets.forEach((asset) => {
      const location = asset.stockLocationName || "Unassigned";
      locationCounts[location] = (locationCounts[location] || 0) + 1;
    });

    // Value statistics
    const assetsWithCost = assets.filter(
      (a) => a.purchaseCostSar !== null && a.purchaseCostSar !== undefined,
    );
    const totalValueSAR = assetsWithCost.reduce(
      (sum, a) => sum + (a.purchaseCostSar || 0),
      0,
    );
    const averageValueSAR =
      assetsWithCost.length > 0 ? totalValueSAR / assetsWithCost.length : 0;

    // Age statistics
    const assetsWithPurchaseDate = assets.filter((a) => a.purchaseDate);
    const averageAgeMonths =
      assetsWithPurchaseDate.length > 0
        ? assetsWithPurchaseDate.reduce((sum, a) => {
            return (
              sum + differenceInMonths(new Date(), new Date(a.purchaseDate!))
            );
          }, 0) / assetsWithPurchaseDate.length
        : 0;

    // Find most common location
    const sortedLocations = Object.entries(locationCounts).sort(
      ([, a], [, b]) => b - a,
    );
    const mostCommonLocation =
      sortedLocations.length > 0 ? sortedLocations[0][0] : "None";

    return {
      totalAssets: assets.length,
      conditionCounts,
      lifecycleStateCounts,
      locationCounts,
      totalValueSAR,
      averageValueSAR,
      averageAgeMonths: Math.round(averageAgeMonths),
      mostCommonLocation,
    };
  }, [assets]);

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-SA", {
      style: "currency",
      currency: "SAR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Format age
  const formatAge = (months: number) => {
    if (months === 0) return "N/A";
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;
    if (years === 0) return `${remainingMonths}m`;
    if (remainingMonths === 0) return `${years}y`;
    return `${years}y ${remainingMonths}m`;
  };

  if (assets.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Activity className="text-muted-foreground mb-4 h-12 w-12" />
          <p className="text-muted-foreground text-center">
            No assets to analyze. Statistics will appear when assets use this
            model.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Total Assets"
          value={statistics.totalAssets}
          description={`Using ${model.name}`}
          icon={Package}
        />
        <StatCard
          title="Total Value"
          value={formatCurrency(statistics.totalValueSAR)}
          description={`Avg: ${formatCurrency(statistics.averageValueSAR)}`}
          icon={DollarSign}
        />
        <StatCard
          title="Average Age"
          value={formatAge(statistics.averageAgeMonths)}
          description="Based on purchase date"
          icon={Calendar}
        />
      </div>

      {/* Detailed Breakdowns */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Condition Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Condition Distribution</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(statistics.conditionCounts)
              .filter(([, count]) => count > 0)
              .sort(([, a], [, b]) => b - a)
              .map(([condition, count]) => {
                const percentage = Math.round(
                  (count / statistics.totalAssets) * 100,
                );
                const indicatorColorClass: Record<string, string> = {
                  NEW: "[&>*]:bg-green-500",
                  GOOD: "[&>*]:bg-blue-500",
                  FAIR: "[&>*]:bg-yellow-500",
                  POOR: "[&>*]:bg-red-500",
                  UNKNOWN: "[&>*]:bg-gray-400",
                };

                return (
                  <div key={condition} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{condition}</span>
                      <span className="text-muted-foreground">
                        {count} ({percentage}%)
                      </span>
                    </div>
                    <Progress
                      value={percentage}
                      className={`h-2 ${indicatorColorClass[condition] || "[&>*]:bg-gray-400"}`}
                    />
                  </div>
                );
              })}
            {Object.values(statistics.conditionCounts).every(
              (c) => c === 0,
            ) && (
              <p className="text-muted-foreground text-sm">
                No condition data available
              </p>
            )}
          </CardContent>
        </Card>

        {/* Location Breakdown */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Location Distribution</CardTitle>
              <Badge variant="outline" className="text-xs">
                <MapPin className="mr-1 h-3 w-3" />
                {Object.keys(statistics.locationCounts).length} locations
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(statistics.locationCounts)
              .sort(([, a], [, b]) => b - a)
              .slice(0, 5)
              .map(([location, count]) => {
                const percentage = Math.round(
                  (count / statistics.totalAssets) * 100,
                );

                return (
                  <div key={location} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="max-w-[200px] truncate font-medium">
                        {location}
                      </span>
                      <span className="text-muted-foreground">
                        {count} ({percentage}%)
                      </span>
                    </div>
                    <Progress
                      value={percentage}
                      className="h-2 [&>*]:bg-indigo-500"
                    />
                  </div>
                );
              })}
            {Object.keys(statistics.locationCounts).length > 5 && (
              <p className="text-muted-foreground mt-2 text-xs">
                +{Object.keys(statistics.locationCounts).length - 5} more
                locations
              </p>
            )}
          </CardContent>
        </Card>

        {/* Lifecycle State Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Lifecycle State Distribution
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(statistics.lifecycleStateCounts)
              .sort(([, a], [, b]) => b - a)
              .map(([state, count]) => {
                const percentage = Math.round(
                  (count / statistics.totalAssets) * 100,
                );

                return (
                  <div key={state} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{state}</span>
                      <span className="text-muted-foreground">
                        {count} ({percentage}%)
                      </span>
                    </div>
                    <Progress
                      value={percentage}
                      className="h-2 [&>*]:bg-violet-500"
                    />
                  </div>
                );
              })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
