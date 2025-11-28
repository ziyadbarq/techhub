"use client";

/**
 * Compliance History Tab
 *
 * Displays a timeline of compliance state changes for an Intune device.
 * Used for SAMA governance reporting and compliance trend analysis.
 */

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import {
  History,
  ArrowRight,
  Loader2,
  RefreshCw,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { IntuneComplianceHistoryDTO } from "@/interface-adapters/dtos/generated/intune-device.dto";
import {
  getComplianceStateLabel,
  getComplianceStateColor,
} from "@/interface-adapters/presenters/intune-device.presenter";
import { getDeviceComplianceHistoryAction } from "@/interface-adapters/controllers/intune-device.controller";

interface ComplianceHistoryTabProps {
  deviceId: string;
}

const MAX_AGE_OPTIONS = [
  { value: "7", label: "Last 7 days" },
  { value: "14", label: "Last 14 days" },
  { value: "30", label: "Last 30 days" },
  { value: "60", label: "Last 60 days" },
  { value: "90", label: "Last 90 days" },
];

export function ComplianceHistoryTab({ deviceId }: ComplianceHistoryTabProps) {
  const [history, setHistory] = useState<IntuneComplianceHistoryDTO[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [maxAgeDays, setMaxAgeDays] = useState("30");

  const loadHistory = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getDeviceComplianceHistoryAction(deviceId, {
        maxAgeDays: parseInt(maxAgeDays, 10),
        take: 50,
      });
      if (result.success) {
        setHistory(result.data.history);
        setTotal(result.data.total);
      } else {
        toast.error(result.error || "Failed to load compliance history");
      }
    } catch {
      toast.error("Failed to load compliance history");
    } finally {
      setLoading(false);
    }
  }, [deviceId, maxAgeDays]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const handleMaxAgeChange = (value: string) => {
    setMaxAgeDays(value);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric",
      }),
      time: date.toLocaleTimeString(undefined, {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <History className="h-4 w-4" />
              Compliance History
            </CardTitle>
            <CardDescription>
              Track compliance state changes over time for SAMA governance
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Select value={maxAgeDays} onValueChange={handleMaxAgeChange}>
              <SelectTrigger className="w-[150px]">
                <Calendar className="mr-2 h-4 w-4" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MAX_AGE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="icon"
              onClick={loadHistory}
              disabled={loading}
            >
              <RefreshCw
                className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
              />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="text-muted-foreground ml-2">
              Loading history...
            </span>
          </div>
        ) : history.length === 0 ? (
          <div className="py-8 text-center">
            <History className="text-muted-foreground/50 mx-auto h-12 w-12" />
            <p className="text-muted-foreground mt-4">
              No compliance state changes recorded in the selected period
            </p>
            <p className="text-muted-foreground/70 text-sm">
              Changes are recorded during each Intune sync
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            <p className="text-muted-foreground mb-4 text-sm">
              {total} total changes recorded • Showing {history.length} most
              recent
            </p>
            <div className="relative">
              {/* Timeline line */}
              <div className="bg-border absolute top-2 bottom-2 left-[7px] w-0.5" />

              {/* Timeline items */}
              <div className="space-y-4">
                {history.map((item) => {
                  const { date, time } = formatDate(item.changedAt);
                  const isCritical =
                    item.previousState === "COMPLIANT" &&
                    item.newState === "NON_COMPLIANT";
                  const isRecovery =
                    item.previousState !== "COMPLIANT" &&
                    item.newState === "COMPLIANT";

                  return (
                    <div key={item.id} className="relative pl-6">
                      {/* Timeline dot */}
                      <div
                        className={`absolute top-1 left-0 h-3.5 w-3.5 rounded-full border-2 ${
                          isCritical
                            ? "border-destructive bg-destructive"
                            : isRecovery
                              ? "border-green-600 bg-green-600"
                              : "border-muted-foreground bg-background"
                        }`}
                      />

                      <div
                        className={`rounded-lg border p-3 ${
                          isCritical
                            ? "border-destructive/30 bg-destructive/5"
                            : isRecovery
                              ? "border-green-600/30 bg-green-600/5"
                              : ""
                        }`}
                      >
                        {/* State transition */}
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge
                            variant={getComplianceStateColor(
                              item.previousState,
                            )}
                          >
                            {getComplianceStateLabel(item.previousState)}
                          </Badge>
                          <ArrowRight className="text-muted-foreground h-4 w-4" />
                          <Badge
                            variant={getComplianceStateColor(item.newState)}
                          >
                            {getComplianceStateLabel(item.newState)}
                          </Badge>
                        </div>

                        {/* Date/time and policy info */}
                        <div className="mt-2 flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">
                            {date} at {time}
                          </span>
                          {item.policyName && (
                            <span className="text-muted-foreground text-xs">
                              Policy: {item.policyName}
                            </span>
                          )}
                        </div>

                        {/* Reason if available */}
                        {item.reason && (
                          <p className="text-muted-foreground mt-2 text-sm">
                            {item.reason}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
