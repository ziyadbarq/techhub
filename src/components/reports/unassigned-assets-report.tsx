/**
 * Unassigned Assets Report
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
import { Download, Archive } from "lucide-react";
import { listAssetsAction } from "@/interface-adapters/controllers/asset.controller";
import { listAssetAssignmentsAction } from "@/interface-adapters/controllers/asset-assignment.controller";
import { toast } from "sonner";
import { format, differenceInDays } from "date-fns";
import { arrayToCSV, downloadCSV } from "@/lib/csv-export";

interface UnassignedAsset {
  [key: string]: string | number | boolean | null | undefined;
  assetTag: string;
  categoryName: string;
  stockLocationName: string;
  purchaseDate: string | null;
  daysInStock: number;
}

export function UnassignedAssetsReport() {
  const [assets, setAssets] = useState<UnassignedAsset[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAssets() {
      try {
        setLoading(true);

        const [assetsResult, assignmentsResult] = await Promise.all([
          listAssetsAction(),
          listAssetAssignmentsAction(),
        ]);

        if (assetsResult.success && assignmentsResult.success) {
          const now = new Date();

          // Get IDs of currently assigned assets
          const assignedAssetIds = new Set(
            assignmentsResult.data
              ?.filter(
                (a) =>
                  !a.endDate || new Date(a.endDate) > now || a.endDate === null,
              )
              .map((a) => a.assetId) || [],
          );

          // Filter unassigned assets
          const unassignedAssets: UnassignedAsset[] = (assetsResult.data || [])
            .filter((asset) => !assignedAssetIds.has(asset.id))
            .map((asset) => {
              const purchaseDate = asset.purchaseDate
                ? new Date(asset.purchaseDate)
                : null;
              const daysInStock = purchaseDate
                ? differenceInDays(now, purchaseDate)
                : 0;

              return {
                assetTag: asset.assetTag,
                categoryName: asset.categoryName || "Unknown",
                stockLocationName: asset.stockLocationName || "Unknown",
                purchaseDate: asset.purchaseDate,
                daysInStock,
              };
            })
            .sort((a, b) => b.daysInStock - a.daysInStock);

          setAssets(unassignedAssets);
        }
      } catch (error) {
        console.error("Failed to fetch unassigned assets:", error);
        toast.error("Failed to load unassigned assets report");
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
      { key: "stockLocationName", label: "Stock Location" },
      { key: "purchaseDate", label: "Purchase Date" },
      { key: "daysInStock", label: "Days in Stock" },
    ]);

    downloadCSV(
      csv,
      `unassigned-assets-${format(new Date(), "yyyy-MM-dd")}.csv`,
    );
    toast.success("Report exported successfully");
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Unassigned Assets</CardTitle>
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
              <Archive className="h-5 w-5 text-blue-500" />
              Unassigned Assets
            </CardTitle>
            <CardDescription>
              Assets in stock not currently assigned to anyone
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
                  <th className="p-2 text-left font-medium">Stock Location</th>
                  <th className="p-2 text-left font-medium">Purchase Date</th>
                  <th className="p-2 text-right font-medium">Days in Stock</th>
                </tr>
              </thead>
              <tbody>
                {assets.map((asset, index) => (
                  <tr key={index} className="border-b last:border-0">
                    <td className="p-2 font-mono text-sm">{asset.assetTag}</td>
                    <td className="p-2">{asset.categoryName}</td>
                    <td className="p-2">{asset.stockLocationName}</td>
                    <td className="p-2">
                      {asset.purchaseDate
                        ? format(new Date(asset.purchaseDate), "MMM d, yyyy")
                        : "-"}
                    </td>
                    <td className="p-2 text-right">{asset.daysInStock}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-muted-foreground flex h-32 items-center justify-center">
            All assets are assigned
          </div>
        )}
      </CardContent>
    </Card>
  );
}
