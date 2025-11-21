/**
 * Assets Without Warranty Report
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
import { Download, ShieldOff } from "lucide-react";
import { listAssetsAction } from "@/interface-adapters/controllers/asset.controller";
import { toast } from "sonner";
import { format } from "date-fns";
import { arrayToCSV, downloadCSV } from "@/lib/csv-export";

interface NoWarrantyAsset {
  [key: string]: string | number | boolean | null | undefined;
  assetTag: string;
  categoryName: string;
  purchaseDate: string | null;
  warrantyEndDate: string | null;
  status: "never" | "expired";
}

export function AssetsWithoutWarrantyReport() {
  const [assets, setAssets] = useState<NoWarrantyAsset[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAssets() {
      try {
        setLoading(true);
        const result = await listAssetsAction();

        if (result.success && result.data) {
          const now = new Date();

          // Filter assets without warranty or with expired warranty
          const noWarrantyAssets: NoWarrantyAsset[] = result.data
            .filter((asset) => {
              if (!asset.warrantyEndDate) return true; // Never had warranty
              return new Date(asset.warrantyEndDate) < now; // Expired warranty
            })
            .map(
              (asset): NoWarrantyAsset => ({
                assetTag: asset.assetTag,
                categoryName: asset.categoryName || "Unknown",
                purchaseDate: asset.purchaseDate,
                warrantyEndDate: asset.warrantyEndDate,
                status: asset.warrantyEndDate ? "expired" : "never",
              }),
            )
            .sort((a, b) => a.assetTag.localeCompare(b.assetTag));

          setAssets(noWarrantyAssets);
        }
      } catch (error) {
        console.error("Failed to fetch no-warranty assets:", error);
        toast.error("Failed to load warranty report");
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
      { key: "warrantyEndDate", label: "Warranty End Date" },
      { key: "status", label: "Status" },
    ]);

    downloadCSV(
      csv,
      `assets-without-warranty-${format(new Date(), "yyyy-MM-dd")}.csv`,
    );
    toast.success("Report exported successfully");
  };

  const getStatusBadge = (status: NoWarrantyAsset["status"]) => {
    if (status === "never") {
      return (
        <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-800 dark:bg-gray-800 dark:text-gray-200">
          Never Had Warranty
        </span>
      );
    }
    return (
      <span className="rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-800 dark:bg-red-900 dark:text-red-200">
        Expired
      </span>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Assets Without Warranty</CardTitle>
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
              <ShieldOff className="h-5 w-5 text-red-500" />
              Assets Without Warranty
            </CardTitle>
            <CardDescription>
              Assets with no warranty or expired warranty coverage
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
                  <th className="p-2 text-left font-medium">Warranty End</th>
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
                        ? format(new Date(asset.purchaseDate), "MMM d, yyyy")
                        : "-"}
                    </td>
                    <td className="p-2">
                      {asset.warrantyEndDate
                        ? format(new Date(asset.warrantyEndDate), "MMM d, yyyy")
                        : "-"}
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
            All assets have active warranty coverage
          </div>
        )}
      </CardContent>
    </Card>
  );
}
