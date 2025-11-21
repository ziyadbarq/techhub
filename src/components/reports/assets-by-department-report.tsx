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
import { listAssetsAction } from "@/interface-adapters/controllers/asset.controller";
import { listAssetAssignmentsAction } from "@/interface-adapters/controllers/asset-assignment.controller";
import { toast } from "sonner";
import { format } from "date-fns";
import { arrayToCSV, downloadCSV } from "@/lib/csv-export";

interface DepartmentAssets {
  [key: string]: string | number | boolean | null | undefined;
  departmentId: string;
  departmentName: string;
  assetCount: number;
  totalValue: number;
  currency: string;
}

export function AssetsByDepartmentReport() {
  const [departments, setDepartments] = useState<DepartmentAssets[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);

        const [assetsResult, assignmentsResult] = await Promise.all([
          listAssetsAction(),
          listAssetAssignmentsAction(),
        ]);

        if (assetsResult.success && assignmentsResult.success) {
          const now = new Date();
          const assets = assetsResult.data || [];
          const assignments = assignmentsResult.data || [];

          // Get active assignments
          const activeAssignments = assignments.filter(
            (a) =>
              !a.endDate || new Date(a.endDate) > now || a.endDate === null,
          );

          // Build asset map
          const assetMap = new Map(assets.map((a) => [a.id, a]));

          // Group by assignee (using assigneeId as department proxy)
          const departmentMap = new Map<
            string,
            { count: number; value: number; currency: string }
          >();

          for (const assignment of activeAssignments) {
            const asset = assetMap.get(assignment.assetId);
            if (!asset) continue;

            // Use assigneeId as department identifier
            const deptId = assignment.assigneeId;
            const existing = departmentMap.get(deptId) || {
              count: 0,
              value: 0,
              currency: asset.currency || "USD",
            };

            departmentMap.set(deptId, {
              count: existing.count + 1,
              value: existing.value + (asset.purchaseCost || 0),
              currency: existing.currency,
            });
          }

          // Convert to array
          const deptData: DepartmentAssets[] = Array.from(
            departmentMap.entries(),
          )
            .map(([deptId, data]) => ({
              departmentId: deptId,
              departmentName: deptId, // In real scenario, fetch org unit name
              assetCount: data.count,
              totalValue: data.value,
              currency: data.currency,
            }))
            .sort((a, b) => b.assetCount - a.assetCount);

          setDepartments(deptData);
        }
      } catch (error) {
        console.error("Failed to fetch department assets:", error);
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
      { key: "totalValue", label: "Total Value" },
      { key: "currency", label: "Currency" },
    ]);

    downloadCSV(
      csv,
      `assets-by-department-${format(new Date(), "yyyy-MM-dd")}.csv`,
    );
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
                      {dept.currency}{" "}
                      {dept.totalValue.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                    <td className="p-2 text-right">
                      {dept.currency}{" "}
                      {(dept.totalValue / dept.assetCount).toLocaleString(
                        undefined,
                        {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        },
                      )}
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
                    {departments.length > 0 && departments[0].currency}{" "}
                    {departments
                      .reduce((sum, d) => sum + d.totalValue, 0)
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
