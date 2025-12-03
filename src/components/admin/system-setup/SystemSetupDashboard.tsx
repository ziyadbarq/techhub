"use client";

/**
 * System Setup Dashboard Component
 * Admin interface for system operations and diagnostics
 */

import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RefreshCw } from "lucide-react";
import { SystemHealthPanel } from "./panels/SystemHealthPanel";
import { SystemInfoPanel } from "./panels/SystemInfoPanel";
import { EmailTestPanel } from "./panels/EmailTestPanel";

export function SystemSetupDashboard() {
  const [autoRefreshInterval, setAutoRefreshInterval] = useState<string>("off");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [healthPanelRefresh, setHealthPanelRefresh] = useState(0);
  const [infoPanelRefresh, setInfoPanelRefresh] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    setHealthPanelRefresh((prev) => prev + 1);
    setInfoPanelRefresh((prev) => prev + 1);
    setLastChecked(new Date());

    // Reset loading state after a brief delay
    setTimeout(() => setIsRefreshing(false), 500);
  }, []);

  const handleAutoRefreshChange = useCallback((value: string) => {
    setAutoRefreshInterval(value);
  }, []);

  const handleCheckComplete = useCallback(() => {
    setLastChecked(new Date());
  }, []);

  // Auto-refresh effect
  useEffect(() => {
    // Clear existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // Set up new interval if not "off"
    if (autoRefreshInterval !== "off") {
      const intervalMs = parseInt(autoRefreshInterval) * 1000;
      intervalRef.current = setInterval(() => {
        handleRefresh();
      }, intervalMs);
    }

    // Cleanup on unmount or when interval changes
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [autoRefreshInterval, handleRefresh]);

  // Calculate relative time for "Last checked"
  const getRelativeTime = (date: Date | null) => {
    if (!date) return "Never";

    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 60) return "Just now";

    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;

    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">System Health</h1>
          <p className="text-muted-foreground mt-2">
            System health monitoring and diagnostics
          </p>
        </div>
      </div>

      {/* Unified Header with Global Actions */}
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <p className="text-muted-foreground text-sm">
            Last checked: {getRelativeTime(lastChecked)}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select
            value={autoRefreshInterval}
            onValueChange={handleAutoRefreshChange}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Auto-refresh" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="off">Auto-refresh: Off</SelectItem>
              <SelectItem value="30">Every 30 seconds</SelectItem>
              <SelectItem value="60">Every 1 minute</SelectItem>
              <SelectItem value="300">Every 5 minutes</SelectItem>
            </SelectContent>
          </Select>
          <Button
            onClick={handleRefresh}
            disabled={isRefreshing}
            variant="outline"
            size="sm"
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>
      </div>

      {/* System Health Section */}
      <section className="space-y-4">
        <SystemHealthPanel
          refreshTrigger={healthPanelRefresh}
          onCheckComplete={handleCheckComplete}
        />
      </section>

      {/* System Info Section */}
      <section className="space-y-4">
        <SystemInfoPanel refreshTrigger={infoPanelRefresh} />
      </section>

      {/* Email Test Section */}
      <section className="space-y-4">
        <EmailTestPanel />
      </section>
    </div>
  );
}
