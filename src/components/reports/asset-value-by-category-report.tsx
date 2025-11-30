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
import { getAssetValueByCategoryReportAction } from "@/interface-adapters/controllers/asset.controller";
import { toast } from "sonner";
import { arrayToCSV, downloadCSV } from "@/lib/csv-export";
import { formatDateISO } from "@/lib/utils/date-format";

interface CategoryValue {
  [key: string]: string | number | boolean | null | undefined;
  categoryId: string;
  categoryName: string;
  assetCount: number;
  totalValueSar: number;
  avgValueSar: number;
  percentage: number;
}

export function AssetValueByCategoryReport() {
  const [categories, setCategories] = useState<CategoryValue[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const result = await getAssetValueByCategoryReportAction();

        if (result.success && result.data) {
          setCategories(
            result.data.map((item) => ({
              categoryId: item.categoryId,
              categoryName: item.categoryName,
              assetCount: item.assetCount,
              totalValueSar: item.totalValueSar,
              avgValueSar: item.avgValueSar,
              percentage: item.percentage,
            })),
          );
        }
      } catch (_error) {
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
      { key: "totalValueSar", label: "Total Value (SAR)" },
      { key: "avgValueSar", label: "Average Value (SAR)" },
      { key: "percentage", label: "Percentage of Total" },
    ]);

    downloadCSV(
      csv,
      `asset-value-by-category-${formatDateISO(new Date())}.csv`,
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
                  <th className="p-2 text-right font-medium">
                    Total Value (SAR)
                  </th>
                  <th className="p-2 text-right font-medium">
                    Avg Value (SAR)
                  </th>
                  <th className="p-2 text-right font-medium">% of Total</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((cat, index) => (
                  <tr key={index} className="border-b last:border-0">
                    <td className="p-2">{cat.categoryName}</td>
                    <td className="p-2 text-right">{cat.assetCount}</td>
                    <td className="p-2 text-right">
                      {cat.totalValueSar.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                    <td className="p-2 text-right">
                      {cat.avgValueSar.toLocaleString(undefined, {
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
                    {categories
                      .reduce((sum, c) => sum + c.totalValueSar, 0)
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
