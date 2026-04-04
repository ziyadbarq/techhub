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
import { Download, FileText } from "lucide-react";
import { getContractExpirationReportAction } from "@/interface-adapters/controllers/reports.controller";
import { toast } from "sonner";
import { arrayToCSV, downloadCSV } from "@/lib/csv-export";
import { formatDate, formatDateISO } from "@/lib/utils/date-format";

interface ContractExpirationItem {
  [key: string]: string | number | boolean | null | undefined;
  contractName: string;
  contractNumber: string | null;
  startDate: string;
  endDate: string | null;
  daysUntilExpiry: number | null;
  autoRenew: boolean;
  totalValueSar: number | null;
  status: string;
}

interface ReportData {
  items: ContractExpirationItem[];
  totalContracts: number;
  activeCount: number;
  expiring30Count: number;
  expiring60Count: number;
  expiring90Count: number;
  expiredCount: number;
  totalValueAtRiskSar: number;
}

export function ContractExpirationReport() {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);
        const result = await getContractExpirationReportAction();
        if (result.success) {
          setData(result.data);
        } else {
          setData(null);
          setError(
            result.error ?? "Unable to load contract expiration report.",
          );
        }
      } catch {
        toast.error("Failed to load contract expiration report");
        setData(null);
        setError("Failed to load contract expiration report.");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const handleExport = () => {
    if (!data) return;
    const csv = arrayToCSV(data.items, [
      { key: "contractName", label: "Contract" },
      { key: "contractNumber", label: "Number" },
      { key: "startDate", label: "Start Date" },
      { key: "endDate", label: "End Date" },
      { key: "daysUntilExpiry", label: "Days Until Expiry" },
      { key: "autoRenew", label: "Auto-Renew" },
      { key: "totalValueSar", label: "Value (SAR)" },
      { key: "status", label: "Status" },
    ]);
    downloadCSV(csv, `contract-expiration-${formatDateISO(new Date())}.csv`);
    toast.success("Report exported successfully");
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      active:
        "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      expiring_30: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
      expiring_60:
        "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
      expiring_90:
        "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      expired: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    };
    const labels: Record<string, string> = {
      active: "Active",
      expiring_30: "< 30 Days",
      expiring_60: "< 60 Days",
      expiring_90: "< 90 Days",
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
          <CardTitle>Contract Expiration</CardTitle>
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
            <FileText className="h-5 w-5 text-purple-500" />
            Contract Expiration
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
              <FileText className="h-5 w-5 text-purple-500" />
              Contract Expiration
            </CardTitle>
            <CardDescription>
              Contract renewal timeline and value at risk
            </CardDescription>
          </div>
          <Button onClick={handleExport} variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>
        {data && (
          <div className="mt-4 grid grid-cols-2 gap-2 text-sm md:grid-cols-4">
            <div className="rounded-md bg-green-50 p-2 text-center dark:bg-green-950">
              <div className="font-semibold text-green-700 dark:text-green-300">
                {data.activeCount}
              </div>
              <div className="text-muted-foreground text-xs">Active</div>
            </div>
            <div className="rounded-md bg-orange-50 p-2 text-center dark:bg-orange-950">
              <div className="font-semibold text-orange-700 dark:text-orange-300">
                {data.expiring30Count +
                  data.expiring60Count +
                  data.expiring90Count}
              </div>
              <div className="text-muted-foreground text-xs">Expiring</div>
            </div>
            <div className="rounded-md bg-red-50 p-2 text-center dark:bg-red-950">
              <div className="font-semibold text-red-700 dark:text-red-300">
                {data.expiredCount}
              </div>
              <div className="text-muted-foreground text-xs">Expired</div>
            </div>
            <div className="rounded-md bg-blue-50 p-2 text-center dark:bg-blue-950">
              <div className="font-semibold text-blue-700 dark:text-blue-300">
                {data.totalValueAtRiskSar.toLocaleString()}
              </div>
              <div className="text-muted-foreground text-xs">SAR at Risk</div>
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
                  <th className="p-2 text-left font-medium">Contract</th>
                  <th className="p-2 text-left font-medium">Number</th>
                  <th className="p-2 text-left font-medium">Start</th>
                  <th className="p-2 text-left font-medium">End</th>
                  <th className="p-2 text-right font-medium">Expiry</th>
                  <th className="p-2 text-center font-medium">Renewal</th>
                  <th className="p-2 text-right font-medium">Value (SAR)</th>
                  <th className="p-2 text-center font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((item, index) => (
                  <tr key={index} className="border-b last:border-0">
                    <td className="p-2 font-medium">{item.contractName}</td>
                    <td className="p-2 font-mono text-sm">
                      {item.contractNumber ?? "-"}
                    </td>
                    <td className="p-2">{formatDate(item.startDate)}</td>
                    <td className="p-2">
                      {item.endDate ? formatDate(item.endDate) : "No end date"}
                    </td>
                    <td className="p-2 text-right">
                      {item.daysUntilExpiry !== null
                        ? item.daysUntilExpiry < 0
                          ? `${Math.abs(item.daysUntilExpiry)}d ago`
                          : `${item.daysUntilExpiry}d`
                        : "-"}
                    </td>
                    <td className="p-2 text-center">
                      {item.autoRenew ? (
                        <span className="text-xs text-green-600 dark:text-green-400">
                          Auto
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-xs">
                          Manual
                        </span>
                      )}
                    </td>
                    <td className="p-2 text-right">
                      {item.totalValueSar !== null
                        ? item.totalValueSar.toLocaleString()
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
            No contracts found
          </div>
        )}
      </CardContent>
    </Card>
  );
}
