/**
 * Asset Value by Category Report
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
import { Button } from "@/components/ui/button";
import { Download, PieChart } from "lucide-react";
import { listAssetsAction } from "@/interface-adapters/controllers/asset.controller";
import { toast } from "sonner";
import { format } from "date-fns";
import { arrayToCSV, downloadCSV } from "@/lib/csv-export";

interface CategoryValue {
  [key: string]: string | number | boolean | null | undefined;
  categoryId: string;
  categoryName: string;
  assetCount: number;
  totalValue: number;
  avgValue: number;
  currency: string;
  percentage: number;
}

export function AssetValueByCategoryReport() {
  const [categories, setCategories] = useState<CategoryValue[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const result = await listAssetsAction();

        if (result.success && result.data) {
          const assets = result.data;

          // Group by category
          const categoryMap = new Map<
            string,
            {
              name: string;
              count: number;
              value: number;
              currency: string;
            }
          >();

          for (const asset of assets) {
            const catId = asset.assetCategoryId;
            const existing = categoryMap.get(catId) || {
              name: asset.categoryName || "Unknown",
              count: 0,
              value: 0,
              currency: asset.currency || "USD",
            };

            categoryMap.set(catId, {
              name: existing.name,
              count: existing.count + 1,
              value: existing.value + (asset.purchaseCost || 0),
              currency: existing.currency,
            });
          }

          // Calculate total value for percentages
          const totalValue = Array.from(categoryMap.values()).reduce(
            (sum, cat) => sum + cat.value,
            0,
          );

          // Convert to array
          const categoryData: CategoryValue[] = Array.from(
            categoryMap.entries(),
          )
            .map(([catId, data]) => ({
              categoryId: catId,
              categoryName: data.name,
              assetCount: data.count,
              totalValue: data.value,
              avgValue: data.count > 0 ? data.value / data.count : 0,
              currency: data.currency,
              percentage: totalValue > 0 ? (data.value / totalValue) * 100 : 0,
            }))
            .sort((a, b) => b.totalValue - a.totalValue);

          setCategories(categoryData);
        }
      } catch (error) {
        console.error("Failed to fetch category values:", error);
        toast.error("Failed to load category value report");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const handleExport = () => {
    const csv = arrayToCSV(categories, [
      { key: "categoryName", label: "Category" },
      { key: "assetCount", label: "Asset Count" },
      { key: "totalValue", label: "Total Value" },
      { key: "avgValue", label: "Average Value" },
      { key: "percentage", label: "Percentage of Total" },
      { key: "currency", label: "Currency" },
    ]);

    downloadCSV(
      csv,
      `asset-value-by-category-${format(new Date(), "yyyy-MM-dd")}.csv`,
    );
    toast.success("Report exported successfully");
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Asset Value by Category</CardTitle>
          <CardDescription>Loading report...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5 text-green-500" />
              Asset Value by Category
            </CardTitle>
            <CardDescription>
              Asset value distribution across categories
            </CardDescription>
          </div>
          <Button onClick={handleExport} variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {categories.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="p-2 text-left font-medium">Category</th>
                  <th className="p-2 text-right font-medium">Count</th>
                  <th className="p-2 text-right font-medium">Total Value</th>
                  <th className="p-2 text-right font-medium">Avg Value</th>
                  <th className="p-2 text-right font-medium">% of Total</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((cat, index) => (
                  <tr key={index} className="border-b last:border-0">
                    <td className="p-2">{cat.categoryName}</td>
                    <td className="p-2 text-right">{cat.assetCount}</td>
                    <td className="p-2 text-right">
                      {cat.currency}{" "}
                      {cat.totalValue.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                    <td className="p-2 text-right">
                      {cat.currency}{" "}
                      {cat.avgValue.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                    <td className="p-2 text-right">
                      {cat.percentage.toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 font-semibold">
                  <td className="p-2">Total</td>
                  <td className="p-2 text-right">
                    {categories.reduce((sum, c) => sum + c.assetCount, 0)}
                  </td>
                  <td className="p-2 text-right">
                    {categories.length > 0 && categories[0].currency}{" "}
                    {categories
                      .reduce((sum, c) => sum + c.totalValue, 0)
                      .toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                  </td>
                  <td className="p-2"></td>
                  <td className="p-2 text-right">100.0%</td>
                </tr>
              </tfoot>
            </table>
          </div>
        ) : (
          <div className="text-muted-foreground flex h-32 items-center justify-center">
            No category data available
          </div>
        )}
      </CardContent>
    </Card>
  );
}
