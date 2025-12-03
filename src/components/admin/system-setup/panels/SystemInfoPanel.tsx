"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  Database,
  Server,
  Users,
  Shield,
  Key,
  Table,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { getSystemInfoAction } from "@/interface-adapters/controllers/setup.controller";
import type { SystemInfoDto } from "@/interface-adapters/dtos/system-setup.dto";

interface SystemInfoPanelProps {
  refreshTrigger?: number;
}

export function SystemInfoPanel({ refreshTrigger = 0 }: SystemInfoPanelProps) {
  const [systemInfo, setSystemInfo] = useState<SystemInfoDto | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const fetchSystemInfo = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await getSystemInfoAction();
      if (result.success) {
        setSystemInfo(result.data);
      }
    } catch (error) {
      console.error("Failed to fetch system info:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Intentionally calling async function in effect for data fetching on mount/refresh
    fetchSystemInfo();
  }, [refreshTrigger, fetchSystemInfo]);

  if (!systemInfo && isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="text-primary h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Collapsible Header */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <Server className="h-4 w-4" />
              System Information & Statistics
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-8 w-8 p-0"
            >
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </div>
        </CardHeader>
        {!isExpanded && (
          <CardContent>
            <p className="text-muted-foreground text-sm">
              Node.js {systemInfo?.nodeVersion || "N/A"} •{" "}
              {systemInfo?.platform
                ? systemInfo.platform.charAt(0).toUpperCase() +
                  systemInfo.platform.slice(1)
                : "N/A"}{" "}
              •{" "}
              {systemInfo?.environment
                ? systemInfo.environment.charAt(0).toUpperCase() +
                  systemInfo.environment.slice(1)
                : "N/A"}{" "}
              • {systemInfo?.database.size || "N/A"} DB •{" "}
              {systemInfo?.database.tableCount || 0} tables •{" "}
              {systemInfo?.userCount || 0} users
            </p>
          </CardContent>
        )}
      </Card>

      {/* Expanded Content */}
      {isExpanded && (
        <>
          {/* Runtime Information - Compact Horizontal Layout */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <Server className="h-4 w-4" />
                Runtime Environment
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-6">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground text-sm">
                    Node.js:
                  </span>
                  <span className="font-semibold">
                    {systemInfo?.nodeVersion || "N/A"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground text-sm">
                    Platform:
                  </span>
                  <span className="font-semibold capitalize">
                    {systemInfo?.platform || "N/A"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground text-sm">
                    Environment:
                  </span>
                  <span className="font-semibold capitalize">
                    {systemInfo?.environment || "N/A"}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Database Statistics - Compact Grid */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <Database className="h-4 w-4" />
                Database Statistics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
                {/* Database Size */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Database className="text-primary h-4 w-4" />
                    <span className="text-muted-foreground text-xs">
                      Database Size
                    </span>
                  </div>
                  <p className="text-xl font-bold">
                    {systemInfo?.database.size || "N/A"}
                  </p>
                </div>

                {/* Table Count */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Table className="text-primary h-4 w-4" />
                    <span className="text-muted-foreground text-xs">
                      Tables
                    </span>
                  </div>
                  <p className="text-xl font-bold">
                    {systemInfo?.database.tableCount || 0}
                  </p>
                </div>

                {/* Users */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Users className="text-primary h-4 w-4" />
                    <span className="text-muted-foreground text-xs">Users</span>
                  </div>
                  <p className="text-xl font-bold">
                    {systemInfo?.userCount || 0}
                  </p>
                </div>

                {/* Roles */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Shield className="text-primary h-4 w-4" />
                    <span className="text-muted-foreground text-xs">Roles</span>
                  </div>
                  <p className="text-xl font-bold">
                    {systemInfo?.roleCount || 0}
                  </p>
                </div>

                {/* Permissions */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Key className="text-primary h-4 w-4" />
                    <span className="text-muted-foreground text-xs">
                      Permissions
                    </span>
                  </div>
                  <p className="text-xl font-bold">
                    {systemInfo?.permissionCount || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
