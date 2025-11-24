"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Loader2,
  RefreshCw,
  Database,
  Server,
  Users,
  Shield,
  Key,
  Table,
} from "lucide-react";
import { getSystemInfoAction } from "@/interface-adapters/controllers/setup.controller";
import type { SystemInfoDto } from "@/interface-adapters/dtos/system-setup.dto";

export function SystemInfoPanel() {
  const [systemInfo, setSystemInfo] = useState<SystemInfoDto | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchSystemInfo = async () => {
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
  };

  useEffect(() => {
    fetchSystemInfo();
  }, []);

  if (!systemInfo && isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="text-primary h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* System Information */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Node.js Version */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <Server className="text-primary h-4 w-4" />
              Node.js
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {systemInfo?.nodeVersion || "N/A"}
            </p>
            <p className="text-muted-foreground mt-1 text-xs">
              Runtime Version
            </p>
          </CardContent>
        </Card>

        {/* Platform */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <Server className="text-primary h-4 w-4" />
              Platform
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold capitalize">
              {systemInfo?.platform || "N/A"}
            </p>
            <p className="text-muted-foreground mt-1 text-xs">
              Operating System
            </p>
          </CardContent>
        </Card>

        {/* Environment */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <Server className="text-primary h-4 w-4" />
              Environment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold capitalize">
              {systemInfo?.environment || "N/A"}
            </p>
            <p className="text-muted-foreground mt-1 text-xs">
              Deployment Mode
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Database Information */}
      <div>
        <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold">
          <Database className="h-5 w-5" />
          Database Statistics
        </h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {/* Database Size */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <Database className="text-primary h-4 w-4" />
                Database Size
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {systemInfo?.database.size || "N/A"}
              </p>
              <p className="text-muted-foreground mt-1 text-xs">
                Total Storage
              </p>
            </CardContent>
          </Card>

          {/* Table Count */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <Table className="text-primary h-4 w-4" />
                Tables
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {systemInfo?.database.tableCount || 0}
              </p>
              <p className="text-muted-foreground mt-1 text-xs">
                Database Tables
              </p>
            </CardContent>
          </Card>

          {/* Users */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <Users className="text-primary h-4 w-4" />
                Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{systemInfo?.userCount || 0}</p>
              <p className="text-muted-foreground mt-1 text-xs">
                Total User Accounts
              </p>
            </CardContent>
          </Card>

          {/* Roles */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <Shield className="text-primary h-4 w-4" />
                Roles
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{systemInfo?.roleCount || 0}</p>
              <p className="text-muted-foreground mt-1 text-xs">System Roles</p>
            </CardContent>
          </Card>

          {/* Permissions */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <Key className="text-primary h-4 w-4" />
                Permissions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {systemInfo?.permissionCount || 0}
              </p>
              <p className="text-muted-foreground mt-1 text-xs">
                RBAC Permissions
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Refresh Button */}
      <div className="flex justify-center">
        <Button
          onClick={fetchSystemInfo}
          disabled={isLoading}
          variant="outline"
        >
          <RefreshCw
            className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
          />
          {isLoading ? "Refreshing..." : "Refresh System Info"}
        </Button>
      </div>
    </div>
  );
}
