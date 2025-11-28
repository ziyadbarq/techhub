/**
 * Asset Services Tab Component
 * Displays services that use this asset
 */

"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Globe, Link2 } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { ServiceAssetDTO } from "@/interface-adapters/presenters/service.presenter";
import { getAssetServicesAction } from "@/interface-adapters/controllers/service-asset.controller";

interface AssetServicesTabProps {
  assetId: string;
}

const relationshipVariants: Record<
  string,
  "default" | "secondary" | "outline"
> = {
  HOSTS: "default",
  DEPENDS_ON: "secondary",
  USES: "outline",
  SUPPORTS: "outline",
};

export function AssetServicesTab({ assetId }: AssetServicesTabProps) {
  const [serviceAssets, setServiceAssets] = useState<ServiceAssetDTO[]>([]);
  const [loading, setLoading] = useState(true);

  const loadServices = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getAssetServicesAction(assetId);
      if (result.success) {
        setServiceAssets(result.data);
      } else {
        toast.error(result.error);
      }
    } catch (_error) {
      toast.error("Failed to load services");
    } finally {
      setLoading(false);
    }
  }, [assetId]);

  useEffect(() => {
    loadServices();
  }, [assetId, loadServices]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (serviceAssets.length === 0) {
    return (
      <Card>
        <CardContent className="flex min-h-[200px] flex-col items-center justify-center">
          <Globe className="text-muted-foreground mb-4 h-12 w-12" />
          <p className="text-muted-foreground">
            This asset is not linked to any services
          </p>
          <p className="text-muted-foreground mt-1 text-sm">
            Link this asset to a service in the Service Management module
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Linked Services</h3>
          <p className="text-muted-foreground text-sm">
            {serviceAssets.length} service
            {serviceAssets.length !== 1 ? "s" : ""} using this asset
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {serviceAssets.map((serviceAsset) => (
          <Card key={serviceAsset.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Globe className="h-4 w-4" />
                    <Link
                      href={`/services/${serviceAsset.serviceId}`}
                      className="text-primary hover:underline"
                    >
                      {serviceAsset.serviceName || serviceAsset.serviceId}
                    </Link>
                  </CardTitle>
                  <CardDescription className="flex items-center gap-2">
                    <Link2 className="h-3.5 w-3.5" />
                    <span>
                      Relationship:{" "}
                      <Badge
                        variant={
                          relationshipVariants[serviceAsset.relationship] ||
                          "outline"
                        }
                        className="ml-1"
                      >
                        {serviceAsset.relationship}
                      </Badge>
                    </span>
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            {serviceAsset.description && (
              <CardContent>
                <p className="text-muted-foreground text-sm">
                  {serviceAsset.description}
                </p>
              </CardContent>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
