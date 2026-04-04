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
import { Download, Cloud } from "lucide-react";
import { getOciResourceInventoryReportAction } from "@/interface-adapters/controllers/reports.controller";
import { toast } from "sonner";
import { arrayToCSV, downloadCSV } from "@/lib/csv-export";
import { formatDateISO } from "@/lib/utils/date-format";

interface OciResourceItem {
  [key: string]: string | number | boolean | null | undefined;
  ciName: string;
  ciClassName: string;
  environment: string;
  criticality: string;
  lifecycleState: string;
  region: string | null;
  compartment: string | null;
  lastSyncedAt: string | null;
}

interface ReportData {
  items: OciResourceItem[];
  totalResources: number;
  byType: Array<{ type: string; count: number }>;
  byRegion: Array<{ region: string; count: number }>;
  byLifecycleState: Array<{ state: string; count: number }>;
}

export function OciResourceInventoryReport() {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const result = await getOciResourceInventoryReportAction();
        if (result.success && result.data) {
          setData(result.data);
        }
      } catch {
        toast.error("Failed to load OCI resource inventory report");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const handleExport = () => {
    if (!data) return;
    const csv = arrayToCSV(data.items, [
      { key: "ciName", label: "Resource Name" },
      { key: "ciClassName", label: "Type" },
      { key: "environment", label: "Environment" },
      { key: "criticality", label: "Criticality" },
      { key: "lifecycleState", label: "Lifecycle State" },
      { key: "region", label: "Region" },
      { key: "compartment", label: "Compartment" },
      { key: "lastSyncedAt", label: "Last Synced" },
    ]);
    downloadCSV(csv, `oci-resource-inventory-${formatDateISO(new Date())}.csv`);
    toast.success("Report exported successfully");
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>OCI Resource Inventory</CardTitle>
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
              <Cloud className="h-5 w-5 text-cyan-500" />
              OCI Resource Inventory
            </CardTitle>
            <CardDescription>
              Cloud resources synced from Oracle Cloud Infrastructure
            </CardDescription>
          </div>
          <Button onClick={handleExport} variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>
        {data && (
          <div className="mt-4 space-y-3">
            <div className="grid grid-cols-2 gap-2 text-sm md:grid-cols-4">
              <div className="rounded-md bg-cyan-50 p-2 text-center dark:bg-cyan-950">
                <div className="font-semibold text-cyan-700 dark:text-cyan-300">
                  {data.totalResources}
                </div>
                <div className="text-muted-foreground text-xs">
                  Total Resources
                </div>
              </div>
              {data.byType.slice(0, 3).map((t) => (
                <div
                  key={t.type}
                  className="rounded-md bg-slate-50 p-2 text-center dark:bg-slate-900"
                >
                  <div className="font-semibold">{t.count}</div>
                  <div className="text-muted-foreground truncate text-xs">
                    {t.type}
                  </div>
                </div>
              ))}
            </div>
            {data.byRegion.length > 0 && (
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="text-muted-foreground font-medium">
                  Regions:
                </span>
                {data.byRegion.map((r) => (
                  <span
                    key={r.region}
                    className="rounded bg-slate-100 px-2 py-0.5 dark:bg-slate-800"
                  >
                    {r.region} ({r.count})
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </CardHeader>
      <CardContent>
        {data && data.items.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="p-2 text-left font-medium">Resource</th>
                  <th className="p-2 text-left font-medium">Type</th>
                  <th className="p-2 text-left font-medium">Region</th>
                  <th className="p-2 text-left font-medium">Compartment</th>
                  <th className="p-2 text-center font-medium">Environment</th>
                  <th className="p-2 text-center font-medium">State</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((item, index) => (
                  <tr key={index} className="border-b last:border-0">
                    <td className="p-2 font-medium">{item.ciName}</td>
                    <td className="p-2 text-sm">{item.ciClassName}</td>
                    <td className="p-2 text-sm">{item.region ?? "-"}</td>
                    <td className="p-2 text-sm">{item.compartment ?? "-"}</td>
                    <td className="p-2 text-center">
                      <span className="rounded bg-slate-100 px-2 py-0.5 text-xs dark:bg-slate-800">
                        {item.environment}
                      </span>
                    </td>
                    <td className="p-2 text-center">
                      <span className="rounded bg-slate-100 px-2 py-0.5 text-xs dark:bg-slate-800">
                        {item.lifecycleState}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-muted-foreground flex h-32 items-center justify-center">
            No OCI resources found. Run an OCI sync to populate data.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
