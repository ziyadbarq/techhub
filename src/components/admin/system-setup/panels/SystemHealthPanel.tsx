"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  XCircle,
  Loader2,
  Copy,
  ExternalLink,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { checkSystemHealthAction } from "@/interface-adapters/controllers/setup.controller";
import type { SystemHealthCheckDto } from "@/interface-adapters/dtos/system-setup.dto";

interface SystemHealthPanelProps {
  refreshTrigger?: number;
  onCheckComplete?: () => void;
}

export function SystemHealthPanel({
  refreshTrigger = 0,
  onCheckComplete,
}: SystemHealthPanelProps) {
  const [healthCheck, setHealthCheck] = useState<SystemHealthCheckDto | null>(
    null,
  );

  const checkHealth = useCallback(async () => {
    try {
      const result = await checkSystemHealthAction();
      if (result.success) {
        setHealthCheck(result.data);
        onCheckComplete?.();
      }
    } catch (error) {
      console.error("Failed to check system health:", error);
    }
  }, [onCheckComplete]);

  useEffect(() => {
    // Intentionally calling async function in effect for data fetching on mount/refresh
    // eslint-disable-next-line react-hooks/set-state-in-effect
    checkHealth();
  }, [refreshTrigger, checkHealth]);

  const getStatusIcon = (status: boolean | undefined) => {
    if (status === undefined)
      return <Loader2 className="text-muted-foreground h-5 w-5 animate-spin" />;
    return status ? (
      <CheckCircle2 className="h-5 w-5 text-green-600" />
    ) : (
      <XCircle className="h-5 w-5 text-red-600" />
    );
  };

  const getStatusText = (status: boolean | undefined) => {
    if (status === undefined) return "Checking...";
    return status ? "Healthy" : "Unhealthy";
  };

  const getStatusColor = (status: boolean | undefined) => {
    if (status === undefined) return "text-muted-foreground";
    return status ? "text-green-600" : "text-red-600";
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const allHealthy = healthCheck?.overall ?? false;

  return (
    <div className="space-y-6">
      {/* Overall Status */}
      <Alert variant={allHealthy ? "default" : "destructive"}>
        <AlertDescription className="flex items-center gap-2">
          {getStatusIcon(healthCheck?.overall)}
          <span className="font-medium">
            {healthCheck?.overall === undefined
              ? "Checking system health..."
              : allHealthy
                ? "All systems operational"
                : "Some systems require attention"}
          </span>
        </AlertDescription>
      </Alert>

      {/* Prominent Error Panel for Worker */}
      {healthCheck?.worker.active === false && (
        <Alert variant="destructive" className="border-2">
          <AlertTriangle className="h-5 w-5" />
          <AlertTitle className="text-base font-semibold">
            Background Worker Not Running
          </AlertTitle>
          <AlertDescription className="mt-2 space-y-3">
            <p className="text-sm">
              {healthCheck.worker.message ||
                "No active maintenance worker detected."}
            </p>
            <div className="rounded-md border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-950">
              <p className="text-muted-foreground mb-2 text-xs font-medium">
                Suggested action:
              </p>
              <code className="block rounded bg-white p-2 text-xs text-black dark:bg-black dark:text-white">
                npm run worker:start
              </code>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  copyToClipboard("npm run worker:start", "Command")
                }
              >
                <Copy className="mr-1.5 h-3.5 w-3.5" />
                Copy Command
              </Button>
              <Button size="sm" variant="outline" asChild>
                <a
                  href="https://github.com/azzuwayed/techhub/blob/main/docs/features/SYSTEM_SETUP.md"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                  View Docs
                </a>
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Health Check Items - Optimized 2-Column Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Database */}
        <Card className="transition-shadow hover:shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center justify-between text-sm font-medium">
              <span className="flex items-center gap-2">
                <span className="text-muted-foreground">🗄️</span>
                Database
              </span>
              {getStatusIcon(healthCheck?.database.connected)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <p
                className={`text-sm font-medium ${getStatusColor(healthCheck?.database.connected)}`}
              >
                {getStatusText(healthCheck?.database.connected)}
              </p>
              {healthCheck?.database.connected &&
                healthCheck?.database.responseTimeMs !== undefined && (
                  <p className="text-muted-foreground text-xs">
                    {healthCheck.database.responseTimeMs}ms
                  </p>
                )}
              {healthCheck?.database.error && (
                <p className="text-xs text-red-600">
                  {healthCheck.database.error}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Redis */}
        <Card className="transition-shadow hover:shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center justify-between text-sm font-medium">
              <span className="flex items-center gap-2">
                <span className="text-muted-foreground">📊</span>
                Redis
              </span>
              {getStatusIcon(healthCheck?.redis.connected)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <p
                className={`text-sm font-medium ${getStatusColor(healthCheck?.redis.connected)}`}
              >
                {getStatusText(healthCheck?.redis.connected)}
              </p>
              {healthCheck?.redis.connected &&
                healthCheck?.redis.responseTimeMs !== undefined && (
                  <p className="text-muted-foreground text-xs">
                    {healthCheck.redis.responseTimeMs}ms
                  </p>
                )}
              {healthCheck?.redis.error && (
                <p className="text-xs text-red-600">
                  {healthCheck.redis.error}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Environment */}
        <Card className="transition-shadow hover:shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center justify-between text-sm font-medium">
              <span className="flex items-center gap-2">
                <span className="text-muted-foreground">⚙️</span>
                Environment
              </span>
              {getStatusIcon(healthCheck?.environment.valid)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <p
                className={`text-sm font-medium ${getStatusColor(healthCheck?.environment.valid)}`}
              >
                {getStatusText(healthCheck?.environment.valid)}
              </p>
              {healthCheck?.environment.missing &&
                healthCheck.environment.missing.length > 0 && (
                  <p className="text-xs text-red-600">
                    Missing: {healthCheck.environment.missing.join(", ")}
                  </p>
                )}
            </div>
          </CardContent>
        </Card>

        {/* Migrations */}
        <Card className="transition-shadow hover:shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center justify-between text-sm font-medium">
              <span className="flex items-center gap-2">
                <span className="text-muted-foreground">🔄</span>
                Migrations
              </span>
              {getStatusIcon(healthCheck?.migrations.applied)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <p
                className={`text-sm font-medium ${getStatusColor(healthCheck?.migrations.applied)}`}
              >
                {getStatusText(healthCheck?.migrations.applied)}
              </p>
              {healthCheck?.migrations.pending !== undefined &&
                healthCheck.migrations.pending > 0 && (
                  <p className="text-xs text-red-600">
                    {healthCheck.migrations.pending} pending
                  </p>
                )}
              {healthCheck?.migrations.error && (
                <p className="text-xs text-red-600">
                  {healthCheck.migrations.error}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Background Worker */}
        <Card className="transition-shadow hover:shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center justify-between text-sm font-medium">
              <span className="flex items-center gap-2">
                <span className="text-muted-foreground">🤖</span>
                Worker
              </span>
              {getStatusIcon(healthCheck?.worker.active)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <p
                className={`text-sm font-medium ${getStatusColor(healthCheck?.worker.active)}`}
              >
                {getStatusText(healthCheck?.worker.active)}
              </p>
              {healthCheck?.worker.active && (
                <p className="text-muted-foreground text-xs">
                  {healthCheck.worker.queue}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* MS Graph SSO */}
        <Card className="transition-shadow hover:shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center justify-between text-sm font-medium">
              <span className="flex items-center gap-2">
                <span className="text-muted-foreground">🔐</span>
                MS Graph SSO
              </span>
              {healthCheck?.msGraphSSO.configured &&
                getStatusIcon(healthCheck?.msGraphSSO.connected)}
              {!healthCheck?.msGraphSSO.configured && (
                <span className="text-muted-foreground text-xs">Optional</span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <p
                className={`text-sm font-medium ${healthCheck?.msGraphSSO.configured ? getStatusColor(healthCheck?.msGraphSSO.connected) : "text-muted-foreground"}`}
              >
                {healthCheck?.msGraphSSO.configured
                  ? getStatusText(healthCheck?.msGraphSSO.connected)
                  : "Not configured"}
              </p>
              {healthCheck?.msGraphSSO.configured &&
                healthCheck?.msGraphSSO.connected &&
                healthCheck?.msGraphSSO.responseTimeMs !== undefined && (
                  <p className="text-muted-foreground text-xs">
                    {healthCheck.msGraphSSO.responseTimeMs}ms
                  </p>
                )}
              {healthCheck?.msGraphSSO.configured &&
                !healthCheck?.msGraphSSO.connected &&
                healthCheck?.msGraphSSO.message && (
                  <p className="text-xs text-red-600">
                    {healthCheck.msGraphSSO.message}
                  </p>
                )}
              {healthCheck?.msGraphSSO.error && (
                <p className="text-xs text-red-600">
                  {healthCheck.msGraphSSO.error}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Intune */}
        <Card className="transition-shadow hover:shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center justify-between text-sm font-medium">
              <span className="flex items-center gap-2">
                <span className="text-muted-foreground">📱</span>
                Intune
              </span>
              {healthCheck?.intune.configured &&
                getStatusIcon(healthCheck?.intune.connected)}
              {!healthCheck?.intune.configured && (
                <span className="text-muted-foreground text-xs">Optional</span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <p
                className={`text-sm font-medium ${healthCheck?.intune.configured ? getStatusColor(healthCheck?.intune.connected) : "text-muted-foreground"}`}
              >
                {healthCheck?.intune.configured
                  ? getStatusText(healthCheck?.intune.connected)
                  : "Not configured"}
              </p>
              {healthCheck?.intune.configured &&
                healthCheck?.intune.connected &&
                healthCheck?.intune.responseTimeMs !== undefined && (
                  <p className="text-muted-foreground text-xs">
                    {healthCheck.intune.responseTimeMs}ms
                  </p>
                )}
              {healthCheck?.intune.configured &&
                !healthCheck?.intune.connected &&
                healthCheck?.intune.message && (
                  <p className="text-xs text-red-600">
                    {healthCheck.intune.message}
                  </p>
                )}
              {healthCheck?.intune.error && (
                <p className="text-xs text-red-600">
                  {healthCheck.intune.error}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Email Service */}
        <Card className="transition-shadow hover:shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center justify-between text-sm font-medium">
              <span className="flex items-center gap-2">
                <span className="text-muted-foreground">📧</span>
                Email
              </span>
              {healthCheck?.email.configured &&
                getStatusIcon(healthCheck?.email.connected)}
              {!healthCheck?.email.configured && (
                <span className="text-muted-foreground text-xs">Optional</span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <p
                className={`text-sm font-medium ${healthCheck?.email.configured ? getStatusColor(healthCheck?.email.connected) : "text-muted-foreground"}`}
              >
                {healthCheck?.email.configured
                  ? getStatusText(healthCheck?.email.connected)
                  : "Not configured"}
              </p>
              {healthCheck?.email.configured &&
                healthCheck?.email.connected &&
                healthCheck?.email.responseTimeMs !== undefined && (
                  <p className="text-muted-foreground text-xs">
                    {healthCheck.email.responseTimeMs}ms
                  </p>
                )}
              {healthCheck?.email.configured &&
                !healthCheck?.email.connected &&
                healthCheck?.email.message && (
                  <p className="text-xs text-red-600">
                    {healthCheck.email.message}
                  </p>
                )}
              {healthCheck?.email.error && (
                <p className="text-xs text-red-600">
                  {healthCheck.email.error}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
