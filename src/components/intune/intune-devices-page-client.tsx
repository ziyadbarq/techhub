"use client";

/**
 * Intune Devices Page Client
 *
 * Client component for the Intune devices list page.
 */

import { useState, useCallback, useEffect } from "react";
import { toast } from "sonner";
import { RefreshCw, Laptop } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IntuneDevicesTable } from "./intune-devices-table";
import {
  listIntuneDevicesAction,
  triggerIntuneSyncAction,
  getIntuneComplianceStatsAction,
} from "@/interface-adapters/controllers/intune-device.controller";
import type {
  IntuneDeviceDTO,
  IntuneComplianceStatsDTO,
} from "@/interface-adapters/dtos/generated/intune-device.dto";
import { usePermissions } from "@/hooks/use-permissions";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";

interface IntuneDevicesPageClientProps {
  initialDevices: IntuneDeviceDTO[];
  initialTotal: number;
  initialStats?: IntuneComplianceStatsDTO;
}

export function IntuneDevicesPageClient({
  initialDevices,
  initialTotal,
  initialStats,
}: IntuneDevicesPageClientProps) {
  const [devices, setDevices] = useState<IntuneDeviceDTO[]>(initialDevices);
  const [total, setTotal] = useState(initialTotal);
  const [stats, setStats] = useState<IntuneComplianceStatsDTO | null>(
    initialStats ?? null,
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const { hasPermission } = usePermissions();

  const canSync = hasPermission(PERMISSIONS.INTUNE_DEVICES_SYNC);

  // Load stats from API (provides accurate counts from database)
  const loadStats = useCallback(async () => {
    try {
      const result = await getIntuneComplianceStatsAction();
      if (result.success) {
        setStats(result.data);
      }
    } catch {
      // Silently fail - stats will show 0 or cached values
    }
  }, []);

  const loadDevices = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await listIntuneDevicesAction(undefined, { take: 50 });
      if (result.success) {
        setDevices(result.data.devices);
        setTotal(result.data.total);
      } else {
        toast.error(result.error || "Failed to load devices");
      }
    } catch {
      toast.error("Failed to load devices");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleSync = useCallback(async () => {
    setIsSyncing(true);
    try {
      const result = await triggerIntuneSyncAction();
      if (result.success) {
        toast.success(
          `Sync complete: ${result.data.created} created, ${result.data.updated} updated`,
        );
        // Reload both devices and stats after sync
        await Promise.all([loadDevices(), loadStats()]);
      } else {
        toast.error(result.error || "Sync failed");
      }
    } catch {
      toast.error("Sync failed");
    } finally {
      setIsSyncing(false);
    }
  }, [loadDevices, loadStats]);

  // Load stats on mount if not provided initially
  useEffect(() => {
    if (!initialStats) {
      loadStats();
    }
  }, [initialStats, loadStats]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
            <Laptop className="h-6 w-6" />
            Intune Devices
          </h1>
          <p className="text-muted-foreground">
            Manage devices synced from Microsoft Intune
          </p>
        </div>
        <div className="flex items-center gap-2">
          {canSync && (
            <Button onClick={handleSync} disabled={isSyncing} variant="outline">
              <RefreshCw
                className={`mr-2 h-4 w-4 ${isSyncing ? "animate-spin" : ""}`}
              />
              {isSyncing ? "Syncing..." : "Sync Now"}
            </Button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Devices</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.ownership.total ?? total}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Corporate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.ownership.corporate ?? 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Compliant</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats?.compliance.compliant ?? 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Non-Compliant</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {stats?.compliance.nonCompliant ?? 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Devices Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Devices</CardTitle>
        </CardHeader>
        <CardContent>
          <IntuneDevicesTable
            devices={devices}
            isLoading={isLoading}
            onRefresh={loadDevices}
          />
        </CardContent>
      </Card>
    </div>
  );
}
