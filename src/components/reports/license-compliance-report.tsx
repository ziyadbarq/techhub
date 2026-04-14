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
import { Download, ShieldCheck } from "lucide-react";
import { getLicenseComplianceReportAction } from "@/interface-adapters/controllers/reports.controller";
import { toast } from "sonner";
import { arrayToCSV, downloadCSV } from "@/lib/csv-export";
import { formatDateISO } from "@/lib/utils/date-format";

interface LicenseComplianceItem {
  [key: string]: string | number | boolean | null | undefined;
  productName: string;
  productCode: string;
  purchasedQuantity: number;
  allocatedQuantity: number;
  utilizationPercent: number;
  status: string;
  effectiveStart: string;
  effectiveEnd: string | null;
  daysUntilExpiry: number | null;
  unitCost: number | null;
  currency: string | null;
  totalCost: number | null;
}

interface ReportData {
  items: LicenseComplianceItem[];
  totalEntitlements: number;
  compliantCount: number;
  overAllocatedCount: number;
  underUtilizedCount: number;
  expiringCount: number;
  expiredCount: number;
}

export function LicenseComplianceReport() {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);
        const result = await getLicenseComplianceReportAction();
        if (result.success) {
          setData(result.data);
        } else {
          setData(null);
          setError(result.error ?? "Unable to load license compliance report.");
        }
      } catch {
        toast.error("Failed to load license compliance report");
        setData(null);
        setError("Failed to load license compliance report.");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const handleExport = () => {
    if (!data) return;
    const csv = arrayToCSV(data.items, [
      { key: "productName", label: "Product" },
      { key: "productCode", label: "Code" },
      { key: "purchasedQuantity", label: "Purchased" },
      { key: "allocatedQuantity", label: "Allocated" },
      { key: "utilizationPercent", label: "Utilization %" },
      { key: "status", label: "Status" },
      { key: "daysUntilExpiry", label: "Days Until Expiry" },
      { key: "totalCost", label: "Total Cost" },
      { key: "currency", label: "Currency" },
    ]);
    downloadCSV(csv, `license-compliance-${formatDateISO(new Date())}.csv`);
    toast.success("Report exported successfully");
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      compliant:
        "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      over_allocated:
        "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
      under_utilized:
        "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      expiring:
        "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
      expired: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    };
    const labels: Record<string, string> = {
      compliant: "Compliant",
      over_allocated: "Over-Allocated",
      under_utilized: "Under-Utilized",
      expiring: "Expiring",
      expired: "Expired",
    };
    return (
      <span
        className={`rounded-full px-2 py-1 text-xs font-medium ${styles[status] ?? ""}`}
      >
        {labels[status] ?? status}
      </span>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>License Compliance</CardTitle>
          <CardDescription>Loading report...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-blue-500" />
            License Compliance
          </CardTitle>
          <CardDescription className="text-destructive">
            {error}
          </CardDescription>
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
              <ShieldCheck className="h-5 w-5 text-blue-500" />
              License Compliance
            </CardTitle>
            <CardDescription>
              License utilization and compliance status across all entitlements
            </CardDescription>
          </div>
          <Button onClick={handleExport} variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>
        {data && (
          <div className="mt-4 grid grid-cols-2 gap-2 text-sm md:grid-cols-5">
            <div className="rounded-md bg-green-50 p-2 text-center dark:bg-green-950">
              <div className="font-semibold text-green-700 dark:text-green-300">
                {data.compliantCount}
              </div>
              <div className="text-muted-foreground text-xs">Compliant</div>
            </div>
            <div className="rounded-md bg-red-50 p-2 text-center dark:bg-red-950">
              <div className="font-semibold text-red-700 dark:text-red-300">
                {data.overAllocatedCount}
              </div>
              <div className="text-muted-foreground text-xs">
                Over-Allocated
              </div>
            </div>
            <div className="rounded-md bg-yellow-50 p-2 text-center dark:bg-yellow-950">
              <div className="font-semibold text-yellow-700 dark:text-yellow-300">
                {data.underUtilizedCount}
              </div>
              <div className="text-muted-foreground text-xs">
                Under-Utilized
              </div>
            </div>
            <div className="rounded-md bg-orange-50 p-2 text-center dark:bg-orange-950">
              <div className="font-semibold text-orange-700 dark:text-orange-300">
                {data.expiringCount}
              </div>
              <div className="text-muted-foreground text-xs">Expiring</div>
            </div>
            <div className="rounded-md bg-red-50 p-2 text-center dark:bg-red-950">
              <div className="font-semibold text-red-700 dark:text-red-300">
                {data.expiredCount}
              </div>
              <div className="text-muted-foreground text-xs">Expired</div>
            </div>
          </div>
        )}
      </CardHeader>
      <CardContent>
        {data && data.items.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="p-2 text-left font-medium">Product</th>
                  <th className="p-2 text-right font-medium">Purchased</th>
                  <th className="p-2 text-right font-medium">Allocated</th>
                  <th className="p-2 text-right font-medium">Utilization</th>
                  <th className="p-2 text-right font-medium">Expiry</th>
                  <th className="p-2 text-right font-medium">Cost</th>
                  <th className="p-2 text-center font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((item, index) => (
                  <tr key={index} className="border-b last:border-0">
                    <td className="p-2">
                      <div className="font-medium">{item.productName}</div>
                      <div className="text-muted-foreground text-xs">
                        {item.productCode}
                      </div>
                    </td>
                    <td className="p-2 text-right">{item.purchasedQuantity}</td>
                    <td className="p-2 text-right">{item.allocatedQuantity}</td>
                    <td className="p-2 text-right">
                      {item.utilizationPercent}%
                    </td>
                    <td className="p-2 text-right">
                      {item.daysUntilExpiry !== null
                        ? item.daysUntilExpiry < 0
                          ? `${Math.abs(item.daysUntilExpiry)}d ago`
                          : `${item.daysUntilExpiry}d`
                        : "No expiry"}
                    </td>
                    <td className="p-2 text-right">
                      {item.totalCost !== null
                        ? `${item.totalCost.toLocaleString()} ${item.currency ?? ""}`
                        : "-"}
                    </td>
                    <td className="p-2 text-center">
                      {getStatusBadge(item.status)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-muted-foreground flex h-32 items-center justify-center">
            No license entitlements found
          </div>
        )}
      </CardContent>
    </Card>
  );
}
