/**
 * My Assets Widget
 * Displays assets assigned to the current user
 */

"use client";

import { useEffect, useState } from "react";
import { WidgetContainer } from "@/components/dashboard/widget-container";
import { WidgetSkeleton } from "@/components/dashboard/widget-skeleton";
import { WidgetEmpty } from "@/components/dashboard/widget-empty";
import { WidgetError } from "@/components/dashboard/widget-error";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Package, ExternalLink } from "lucide-react";
import Link from "next/link";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import {
  getMyAssetsAction,
  type MyAssetDTO,
} from "@/interface-adapters/controllers/my-dashboard.controller";
import { formatDistanceToNow } from "date-fns";

export function MyAssetsWidget() {
  const [assets, setAssets] = useState<MyAssetDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAssets = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await getMyAssetsAction();
      if (result.success) {
        setAssets(result.data);
      } else {
        setError(result.error);
      }
    } catch {
      setError("Failed to load assets");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAssets();
  }, []);

  if (isLoading) {
    return (
      <WidgetContainer
        title="My Assets"
        icon={<Package className="h-4 w-4" />}
        featureFlag="ASSETS"
        permission={PERMISSIONS.ASSET_ASSIGNMENTS_VIEW}
      >
        <WidgetSkeleton rows={3} />
      </WidgetContainer>
    );
  }

  if (error) {
    return (
      <WidgetContainer
        title="My Assets"
        icon={<Package className="h-4 w-4" />}
        featureFlag="ASSETS"
        permission={PERMISSIONS.ASSET_ASSIGNMENTS_VIEW}
      >
        <WidgetError message={error} onRetry={fetchAssets} />
      </WidgetContainer>
    );
  }

  return (
    <WidgetContainer
      title="My Assets"
      icon={<Package className="h-4 w-4" />}
      featureFlag="ASSETS"
      permission={PERMISSIONS.ASSET_ASSIGNMENTS_VIEW}
      headerAction={
        assets.length > 0 && (
          <Button variant="ghost" size="sm" asChild>
            <Link href="/asset-assignments">
              <ExternalLink className="mr-1 h-3 w-3" />
              View All
            </Link>
          </Button>
        )
      }
    >
      {assets.length === 0 ? (
        <WidgetEmpty
          icon={Package}
          title="No assets assigned"
          description="You don't have any assets assigned to you yet."
        />
      ) : (
        <div className="space-y-3">
          {assets.slice(0, 5).map((asset) => (
            <div
              key={asset.id}
              className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">
                    {asset.assetTag || "No Tag"}
                  </span>
                  {asset.condition && (
                    <Badge variant="outline" className="text-xs">
                      {asset.condition}
                    </Badge>
                  )}
                </div>
                <p className="text-muted-foreground text-xs">
                  Assigned{" "}
                  {formatDistanceToNow(new Date(asset.assignedAt), {
                    addSuffix: true,
                  })}
                </p>
              </div>
            </div>
          ))}
          {assets.length > 5 && (
            <p className="text-muted-foreground pt-2 text-center text-xs">
              +{assets.length - 5} more assets
            </p>
          )}
        </div>
      )}
    </WidgetContainer>
  );
}
