"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, RefreshCw, Database, Server, Users, Shield, Key, Table } from "lucide-react";
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
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Server className="h-4 w-4 text-primary" />
              Node.js
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{systemInfo?.nodeVersion || "N/A"}</p>
            <p className="text-xs text-muted-foreground mt-1">Runtime Version</p>
          </CardContent>
        </Card>

        {/* Platform */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Server className="h-4 w-4 text-primary" />
              Platform
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold capitalize">{systemInfo?.platform || "N/A"}</p>
            <p className="text-xs text-muted-foreground mt-1">Operating System</p>
          </CardContent>
        </Card>

        {/* Environment */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Server className="h-4 w-4 text-primary" />
              Environment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold capitalize">{systemInfo?.environment || "N/A"}</p>
            <p className="text-xs text-muted-foreground mt-1">Deployment Mode</p>
          </CardContent>
        </Card>
      </div>

      {/* Database Information */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Database className="h-5 w-5" />
          Database Statistics
        </h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {/* Database Size */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Database className="h-4 w-4 text-primary" />
                Database Size
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{systemInfo?.database.size || "N/A"}</p>
              <p className="text-xs text-muted-foreground mt-1">Total Storage</p>
            </CardContent>
          </Card>

          {/* Table Count */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Table className="h-4 w-4 text-primary" />
                Tables
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{systemInfo?.database.tableCount || 0}</p>
              <p className="text-xs text-muted-foreground mt-1">Database Tables</p>
            </CardContent>
          </Card>

          {/* Users */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{systemInfo?.userCount || 0}</p>
              <p className="text-xs text-muted-foreground mt-1">Total User Accounts</p>
            </CardContent>
          </Card>

          {/* Roles */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" />
                Roles
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{systemInfo?.roleCount || 0}</p>
              <p className="text-xs text-muted-foreground mt-1">System Roles</p>
            </CardContent>
          </Card>

          {/* Permissions */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Key className="h-4 w-4 text-primary" />
                Permissions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{systemInfo?.permissionCount || 0}</p>
              <p className="text-xs text-muted-foreground mt-1">RBAC Permissions</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Refresh Button */}
      <div className="flex justify-center">
        <Button onClick={fetchSystemInfo} disabled={isLoading} variant="outline">
          <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          {isLoading ? "Refreshing..." : "Refresh System Info"}
        </Button>
      </div>
    </div>
  );
}
