/**
 * Asset Intune Tab Component
 * Displays Intune devices linked to this asset
 */

"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  Laptop,
  Shield,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { IntuneDeviceDTO } from "@/interface-adapters/dtos/generated/intune-device.dto";
import { getIntuneDevicesByAssetAction } from "@/interface-adapters/controllers/intune-device.controller";

interface AssetIntuneTabProps {
  assetId: string;
}

const complianceIcons: Record<string, typeof CheckCircle> = {
  COMPLIANT: CheckCircle,
  NON_COMPLIANT: XCircle,
  IN_GRACE_PERIOD: AlertCircle,
  UNKNOWN: AlertCircle,
};

const complianceVariants: Record<
  string,
  "default" | "secondary" | "outline" | "destructive"
> = {
  COMPLIANT: "default",
  NON_COMPLIANT: "destructive",
  IN_GRACE_PERIOD: "secondary",
  UNKNOWN: "outline",
};

export function AssetIntuneTab({ assetId }: AssetIntuneTabProps) {
  const [devices, setDevices] = useState<IntuneDeviceDTO[]>([]);
  const [loading, setLoading] = useState(true);

  const loadDevices = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getIntuneDevicesByAssetAction(assetId);
      if (result.success) {
        setDevices(result.data);
      } else {
        toast.error(result.error);
      }
    } catch (_error) {
      toast.error("Failed to load Intune devices");
    } finally {
      setLoading(false);
    }
  }, [assetId]);

  useEffect(() => {
    loadDevices();
  }, [assetId, loadDevices]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (devices.length === 0) {
    return (
      <Card>
        <CardContent className="flex min-h-[200px] flex-col items-center justify-center">
          <Laptop className="text-muted-foreground mb-4 h-12 w-12" />
          <p className="text-muted-foreground">
            No Intune devices linked to this asset
          </p>
          <p className="text-muted-foreground mt-1 text-sm">
            Link an Intune device in the Intune module
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Intune Devices</h3>
          <p className="text-muted-foreground text-sm">
            {devices.length} device{devices.length !== 1 ? "s" : ""} linked
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {devices.map((device) => {
          const ComplianceIcon =
            complianceIcons[device.complianceState || "UNKNOWN"] || AlertCircle;

          return (
            <Card key={device.id} className="transition-shadow hover:shadow-md">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Laptop className="h-4 w-4" />
                      <Link
                        href={`/intune/devices/${device.id}`}
                        className="text-primary hover:underline"
                      >
                        {device.deviceName}
                      </Link>
                    </CardTitle>
                    <CardDescription className="flex items-center gap-2">
                      {device.operatingSystem && (
                        <span className="text-xs">
                          {device.operatingSystem}
                        </span>
                      )}
                      {device.osVersion && (
                        <span className="text-muted-foreground text-xs">
                          v{device.osVersion}
                        </span>
                      )}
                    </CardDescription>
                  </div>
                  <Badge
                    variant={
                      complianceVariants[device.complianceState || "UNKNOWN"] ||
                      "outline"
                    }
                    className="flex items-center gap-1"
                  >
                    <ComplianceIcon className="h-3.5 w-3.5" />
                    {device.complianceState?.replace("_", " ") || "Unknown"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex flex-wrap gap-2">
                  {device.ownershipType && (
                    <Badge variant="outline" className="text-xs">
                      {device.ownershipType}
                    </Badge>
                  )}
                  {device.managementState && (
                    <Badge variant="outline" className="text-xs">
                      {device.managementState}
                    </Badge>
                  )}
                </div>
                {device.serialNumber && (
                  <p className="text-muted-foreground font-mono text-xs">
                    S/N: {device.serialNumber}
                  </p>
                )}
                <div className="flex items-center gap-2 text-xs">
                  <Shield className="text-muted-foreground h-3.5 w-3.5" />
                  <span className="text-muted-foreground">
                    {device.isActive ? "Active" : "Inactive"} in Intune
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
