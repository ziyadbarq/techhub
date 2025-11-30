/**
 * Assets Nearing End of Life Report
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
import { Download, AlertTriangle } from "lucide-react";
import { getAssetsNearingEolReportAction } from "@/interface-adapters/controllers/asset.controller";
import { toast } from "sonner";
import { arrayToCSV, downloadCSV } from "@/lib/csv-export";
import { formatDate, formatDateISO } from "@/lib/utils/date-format";

interface EOLAsset {
  [key: string]: string | number | boolean | null | undefined;
  assetTag: string;
  categoryName: string;
  purchaseDate: string | null;
  depreciationEnd: string | null;
  daysUntilEOL: number;
  status: "expired" | "critical" | "warning";
}

export function AssetsNearingEOLReport() {
  const [assets, setAssets] = useState<EOLAsset[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAssets() {
      try {
        setLoading(true);
        const result = await getAssetsNearingEolReportAction();

        if (result.success && result.data) {
          setAssets(
            result.data.map((asset) => ({
              ...asset,
              categoryName: asset.categoryName ?? "Uncategorized",
              purchaseDate: asset.purchaseDate,
              depreciationEnd: asset.depreciationEnd,
              daysUntilEOL: asset.daysUntilEOL,
            })),
          );
        }
      } catch (_error) {
        toast.error("Failed to load EOL report");
      } finally {
        setLoading(false);
      }
    }

    fetchAssets();
  }, []);

  const handleExport = () => {
    const csv = arrayToCSV(assets, [
      { key: "assetTag", label: "Asset Tag" },
      { key: "categoryName", label: "Category" },
      { key: "purchaseDate", label: "Purchase Date" },
      { key: "depreciationEnd", label: "Depreciation End" },
      { key: "daysUntilEOL", label: "Days Until EOL" },
      { key: "status", label: "Status" },
    ]);

    downloadCSV(csv, `assets-nearing-eol-${formatDateISO(new Date())}.csv`);
    toast.success("Report exported successfully");
  };

  const getStatusBadge = (status: EOLAsset["status"]) => {
    const styles = {
      expired: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
      critical:
        "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
      warning:
        "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    };

    return (
      <span
        className={`rounded-full px-2 py-1 text-xs font-medium ${styles[status]}`}
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Assets Nearing End of Life</CardTitle>
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
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Assets Nearing End of Life
            </CardTitle>
            <CardDescription>
              Assets approaching or past depreciation completion (next 12
              months)
            </CardDescription>
          </div>
          <Button onClick={handleExport} variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {assets.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="p-2 text-left font-medium">Asset Tag</th>
                  <th className="p-2 text-left font-medium">Category</th>
                  <th className="p-2 text-left font-medium">Purchase Date</th>
                  <th className="p-2 text-left font-medium">
                    Depreciation End
                  </th>
                  <th className="p-2 text-right font-medium">Days Until EOL</th>
                  <th className="p-2 text-center font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {assets.map((asset, index) => (
                  <tr key={index} className="border-b last:border-0">
                    <td className="p-2 font-mono text-sm">{asset.assetTag}</td>
                    <td className="p-2">{asset.categoryName}</td>
                    <td className="p-2">
                      {asset.purchaseDate
                        ? formatDate(asset.purchaseDate)
                        : "-"}
                    </td>
                    <td className="p-2">
                      {asset.depreciationEnd
                        ? formatDate(asset.depreciationEnd)
                        : "-"}
                    </td>
                    <td className="p-2 text-right">
                      {asset.daysUntilEOL < 0
                        ? `${Math.abs(asset.daysUntilEOL)} days ago`
                        : `${asset.daysUntilEOL} days`}
                    </td>
                    <td className="p-2 text-center">
                      {getStatusBadge(asset.status)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-muted-foreground flex h-32 items-center justify-center">
            No assets nearing end of life
          </div>
        )}
      </CardContent>
    </Card>
  );
}
