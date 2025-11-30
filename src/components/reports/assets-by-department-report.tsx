/**
 * Assets by Department Report
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
import { Download, Building2 } from "lucide-react";
import { getAssetsByDepartmentReportAction } from "@/interface-adapters/controllers/asset.controller";
import { toast } from "sonner";
import { arrayToCSV, downloadCSV } from "@/lib/csv-export";
import { formatDateISO } from "@/lib/utils/date-format";

interface DepartmentAssets {
  [key: string]: string | number | boolean | null | undefined;
  departmentId: string;
  departmentName: string;
  assetCount: number;
  totalValueSar: number;
  avgPurchaseCostSar: number;
}

export function AssetsByDepartmentReport() {
  const [departments, setDepartments] = useState<DepartmentAssets[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);

        const result = await getAssetsByDepartmentReportAction();

        if (result.success && result.data) {
          const deptData: DepartmentAssets[] = result.data.map((item) => ({
            departmentId: item.departmentId,
            departmentName: item.departmentName,
            assetCount: item.assetCount,
            totalValueSar: item.totalValueSar,
            avgPurchaseCostSar: item.avgPurchaseCostSar,
          }));

          setDepartments(deptData);
        }
      } catch (_error) {
        toast.error("Failed to load department report");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const handleExport = () => {
    const csv = arrayToCSV(departments, [
      { key: "departmentName", label: "Department" },
      { key: "assetCount", label: "Asset Count" },
      { key: "totalValueSar", label: "Total Value (SAR)" },
      { key: "avgPurchaseCostSar", label: "Avg. Purchase Cost (SAR)" },
    ]);

    downloadCSV(csv, `assets-by-department-${formatDateISO(new Date())}.csv`);
    toast.success("Report exported successfully");
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Assets by Department</CardTitle>
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
              <Building2 className="h-5 w-5 text-purple-500" />
              Assets by Department
            </CardTitle>
            <CardDescription>
              Asset distribution and value by department
            </CardDescription>
          </div>
          <Button onClick={handleExport} variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {departments.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="p-2 text-left font-medium">Department</th>
                  <th className="p-2 text-right font-medium">Asset Count</th>
                  <th className="p-2 text-right font-medium">Total Value</th>
                  <th className="p-2 text-right font-medium">Avg Value</th>
                </tr>
              </thead>
              <tbody>
                {departments.map((dept, index) => (
                  <tr key={index} className="border-b last:border-0">
                    <td className="p-2">{dept.departmentName}</td>
                    <td className="p-2 text-right">{dept.assetCount}</td>
                    <td className="p-2 text-right">
                      {dept.totalValueSar.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                    <td className="p-2 text-right">
                      {dept.avgPurchaseCostSar.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 font-semibold">
                  <td className="p-2">Total</td>
                  <td className="p-2 text-right">
                    {departments.reduce((sum, d) => sum + d.assetCount, 0)}
                  </td>
                  <td className="p-2 text-right">
                    {departments
                      .reduce((sum, d) => sum + d.totalValueSar, 0)
                      .toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                  </td>
                  <td className="p-2"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        ) : (
          <div className="text-muted-foreground flex h-32 items-center justify-center">
            No department data available
          </div>
        )}
      </CardContent>
    </Card>
  );
}
