/**
 * Asset CMDB Tab Component
 * Displays Configuration Items (CIs) linked to this asset
 */

"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Server, AlertTriangle, Layers } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { ConfigurationItemDTO } from "@/interface-adapters/dtos/generated/configuration-item.dto";
import { listConfigurationItemsAction } from "@/interface-adapters/controllers/configuration-item.controller";

interface AssetCmdbTabProps {
  assetId: string;
}

const criticalityVariants: Record<
  string,
  "default" | "secondary" | "outline" | "destructive"
> = {
  CRITICAL: "destructive",
  HIGH: "default",
  MEDIUM: "secondary",
  LOW: "outline",
};

const environmentVariants: Record<string, string> = {
  PRODUCTION: "bg-red-100 text-red-800",
  STAGING: "bg-yellow-100 text-yellow-800",
  DEVELOPMENT: "bg-blue-100 text-blue-800",
  TEST: "bg-green-100 text-green-800",
};

export function AssetCmdbTab({ assetId }: AssetCmdbTabProps) {
  const [configItems, setConfigItems] = useState<ConfigurationItemDTO[]>([]);
  const [loading, setLoading] = useState(true);

  const loadConfigItems = useCallback(async () => {
    setLoading(true);
    try {
      const result = await listConfigurationItemsAction({
        linkedAssetId: assetId,
      });
      if (result.success) {
        setConfigItems(result.data);
      } else {
        toast.error(result.error);
      }
    } catch (_error) {
      toast.error("Failed to load configuration items");
    } finally {
      setLoading(false);
    }
  }, [assetId]);

  useEffect(() => {
    loadConfigItems();
  }, [assetId, loadConfigItems]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (configItems.length === 0) {
    return (
      <Card>
        <CardContent className="flex min-h-[200px] flex-col items-center justify-center">
          <Server className="text-muted-foreground mb-4 h-12 w-12" />
          <p className="text-muted-foreground">
            No configuration items linked to this asset
          </p>
          <p className="text-muted-foreground mt-1 text-sm">
            Link this asset to a CI in the CMDB module
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Configuration Items</h3>
          <p className="text-muted-foreground text-sm">
            {configItems.length} CI{configItems.length !== 1 ? "s" : ""} linked
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {configItems.map((ci) => (
          <Card key={ci.id} className="transition-shadow hover:shadow-md">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Layers className="h-4 w-4" />
                    <Link
                      href={`/cmdb/configuration-items/${ci.id}`}
                      className="text-primary hover:underline"
                    >
                      {ci.name}
                    </Link>
                  </CardTitle>
                  {ci.ciKey && (
                    <CardDescription className="font-mono text-xs">
                      {ci.ciKey}
                    </CardDescription>
                  )}
                </div>
                <div className="flex gap-2">
                  {ci.criticality && (
                    <Badge
                      variant={criticalityVariants[ci.criticality] || "outline"}
                    >
                      {ci.criticality}
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex flex-wrap gap-2">
                {ci.environment && (
                  <span
                    className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${environmentVariants[ci.environment] || "bg-gray-100 text-gray-800"}`}
                  >
                    {ci.environment}
                  </span>
                )}
                {ci.ciClassName && (
                  <Badge variant="outline" className="text-xs">
                    {ci.ciClassName}
                  </Badge>
                )}
              </div>
              {ci.description && (
                <p className="text-muted-foreground line-clamp-2 text-sm">
                  {ci.description}
                </p>
              )}
              {ci.criticality === "CRITICAL" && (
                <div className="text-destructive flex items-center gap-1 text-xs">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  <span>Critical business impact</span>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
