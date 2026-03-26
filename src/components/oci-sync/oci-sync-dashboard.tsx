"use client";

/**
 * OCI Sync Dashboard
 *
 * Client container for OCI Cloud Sync management.
 * Owns interaction state, delegates layout to the dashboard view.
 */

import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  triggerOciSyncAction,
  getOciSyncLogsAction,
} from "@/interface-adapters/controllers/oci-sync.controller";
import type {
  OciSyncLogDTO,
  OciSyncResultDTO,
} from "@/interface-adapters/dtos/generated/oci-sync.dto";
import { OCI_SERVICE_KEYS } from "@/core/domain/value-objects/oci-resource.types";
import { usePermissions } from "@/hooks/use-permissions";
import { OciSyncDashboardView } from "./oci-sync-dashboard-view";

interface OciSyncDashboardProps {
  initialLogs: OciSyncLogDTO[];
  latestSync: OciSyncLogDTO | null;
}

export function OciSyncDashboard({
  initialLogs,
  latestSync,
}: OciSyncDashboardProps) {
  const [logs, setLogs] = useState(initialLogs);
  const [latest, setLatest] = useState(latestSync);
  const [selectedLogId, setSelectedLogId] = useState<string | null>(
    initialLogs[0]?.id ?? null,
  );
  const [selectedServices, setSelectedServices] = useState<string[]>([
    ...OCI_SERVICE_KEYS,
  ]);
  const [dryRun, setDryRun] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { hasPermission } = usePermissions();
  const canTrigger = hasPermission("oci-sync:trigger");

  const selectedLog =
    logs.find((log) => log.id === selectedLogId) ?? logs[0] ?? null;

  function toggleService(key: string) {
    setSelectedServices((prev) =>
      prev.includes(key) ? prev.filter((item) => item !== key) : [...prev, key],
    );
  }

  function selectAllServices() {
    setSelectedServices([...OCI_SERVICE_KEYS]);
  }

  function clearServices() {
    setSelectedServices([]);
  }

  function handleSync() {
    startTransition(async () => {
      const result = await triggerOciSyncAction({
        serviceKeys:
          selectedServices.length < OCI_SERVICE_KEYS.length
            ? (selectedServices as (typeof OCI_SERVICE_KEYS)[number][])
            : undefined,
        dryRun,
      });

      if (result.success) {
        const data = result.data as OciSyncResultDTO;
        if (data.status === "FAILED") {
          toast.error(dryRun ? "OCI preview failed" : "OCI sync failed", {
            description: data.summary,
            duration: 7000,
          });
        } else if (data.status === "PARTIAL") {
          toast.warning(
            dryRun
              ? "OCI preview completed with issues"
              : "OCI sync completed with issues",
            {
              description: data.summary,
              duration: 7000,
            },
          );
        } else {
          toast.success(
            dryRun ? "OCI preview completed" : "OCI sync completed",
            {
              description: data.summary,
            },
          );
        }

        const logsResult = await getOciSyncLogsAction(20);
        if (logsResult.success) {
          setLogs(logsResult.data);
          setLatest(logsResult.data[0] ?? null);
          setSelectedLogId(logsResult.data[0]?.id ?? null);
        }
      } else {
        toast.error("OCI sync failed", {
          description: "error" in result ? result.error : "Unknown error",
          duration: 7000,
        });
      }
    });
  }

  return (
    <OciSyncDashboardView
      logs={logs}
      latest={latest}
      selectedLog={selectedLog}
      isPending={isPending}
      selectedServices={selectedServices}
      dryRun={dryRun}
      canTrigger={canTrigger}
      onToggleService={toggleService}
      onSelectAllServices={selectAllServices}
      onClearServices={clearServices}
      onDryRunChange={setDryRun}
      onSync={handleSync}
      onSelectLog={setSelectedLogId}
    />
  );
}
