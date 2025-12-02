"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, AlertCircle, Loader2 } from "lucide-react";
import { checkSystemHealthAction } from "@/interface-adapters/controllers/setup.controller";
import type { SystemHealthCheckDto } from "@/interface-adapters/dtos/system-setup.dto";

type HealthStatus = "checking" | "healthy" | "unhealthy" | "error";

interface StatusItemProps {
  label: string;
  status: HealthStatus;
  message?: string;
}

function StatusItem({ label, status, message }: StatusItemProps) {
  const getIcon = () => {
    switch (status) {
      case "checking":
        return (
          <Loader2 className="text-muted-foreground h-5 w-5 animate-spin" />
        );
      case "healthy":
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case "unhealthy":
        return <XCircle className="h-5 w-5 text-red-600" />;
      case "error":
        return <AlertCircle className="h-5 w-5 text-yellow-600" />;
    }
  };

  const getStatusBadge = () => {
    switch (status) {
      case "checking":
        return <Badge variant="secondary">Checking...</Badge>;
      case "healthy":
        return (
          <Badge variant="default" className="bg-green-600">
            Healthy
          </Badge>
        );
      case "unhealthy":
        return <Badge variant="destructive">Unhealthy</Badge>;
      case "error":
        return (
          <Badge variant="secondary" className="bg-yellow-600">
            Warning
          </Badge>
        );
    }
  };

  return (
    <div className="flex items-center justify-between border-b py-3 last:border-0">
      <div className="flex items-center gap-3">
        {getIcon()}
        <div>
          <p className="font-medium">{label}</p>
          {message && (
            <p className="text-muted-foreground text-sm">{message}</p>
          )}
        </div>
      </div>
      {getStatusBadge()}
    </div>
  );
}

interface SystemStatus {
  database: HealthStatus;
  redis: HealthStatus;
  migrations: HealthStatus;
  worker: HealthStatus;
  overall: boolean;
  coreServicesHealthy: boolean;
  databaseMessage?: string;
  redisMessage?: string;
  migrationsMessage?: string;
  workerMessage?: string;
}

export function SystemHealthPage() {
  const [status, setStatus] = useState<SystemStatus>({
    database: "checking",
    redis: "checking",
    migrations: "checking",
    worker: "checking",
    overall: false,
    coreServicesHealthy: false,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkHealth = async () => {
      setIsLoading(true);
      try {
        const response = await checkSystemHealthAction();

        if (!response.success || !response.data) {
          setStatus({
            database: "error",
            redis: "error",
            migrations: "error",
            worker: "error",
            overall: false,
            coreServicesHealthy: false,
            databaseMessage: "Failed to check system health",
            workerMessage: "Worker status unavailable",
          });
          return;
        }

        const health = response.data as SystemHealthCheckDto;

        setStatus({
          database: health.database.connected ? "healthy" : "unhealthy",
          redis: health.redis.connected ? "healthy" : "unhealthy",
          migrations: health.migrations.applied ? "healthy" : "unhealthy",
          worker: health.worker.active ? "healthy" : "unhealthy",
          overall: health.overall,
          coreServicesHealthy: health.coreServicesHealthy,
          databaseMessage: health.database.message,
          redisMessage: health.redis.message,
          migrationsMessage: health.migrations.message,
          workerMessage:
            health.worker.message ??
            (health.worker.error
              ? `Worker check failed: ${health.worker.error}`
              : undefined),
        });
      } catch (error) {
        console.error("Health check failed:", error);
        setStatus({
          database: "error",
          redis: "error",
          migrations: "error",
          worker: "error",
          overall: false,
          coreServicesHealthy: false,
          databaseMessage: "Unexpected error during health check",
          workerMessage: "Worker status unavailable",
        });
      } finally {
        setIsLoading(false);
      }
    };

    checkHealth();
  }, []);

  const coreHealthy = !isLoading && status.coreServicesHealthy;
  const overallHealthy = !isLoading && status.overall;
  const workerWarning = coreHealthy && !overallHealthy;

  return (
    <div className="from-background to-muted/20 flex min-h-screen items-center justify-center bg-gradient-to-b p-4">
      <div className="w-full max-w-2xl space-y-6">
        {/* Header */}
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold tracking-tight">System Health</h1>
          <p className="text-muted-foreground">
            Real-time system status and service health monitoring
          </p>
        </div>

        {/* System Health Card */}
        <Card>
          <CardHeader>
            <CardTitle>System Health Check</CardTitle>
            <CardDescription>
              Current status of all system components and services
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <StatusItem
                label="Database Connection"
                status={status.database}
                message={status.databaseMessage}
              />
              <StatusItem
                label="Redis Connection"
                status={status.redis}
                message={status.redisMessage}
              />
              <StatusItem
                label="Database Migrations"
                status={status.migrations}
                message={status.migrationsMessage}
              />
              <StatusItem
                label="Maintenance Worker"
                status={status.worker}
                message={status.workerMessage}
              />
            </div>
          </CardContent>
        </Card>

        {/* Health Status Summary */}
        {!isLoading && (
          <>
            {overallHealthy && (
              <Alert>
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertTitle>All Systems Operational</AlertTitle>
                <AlertDescription>
                  All system components are healthy and operating normally.
                </AlertDescription>
              </Alert>
            )}

            {workerWarning && (
              <Alert>
                <AlertCircle className="h-4 w-4 text-amber-500" />
                <AlertTitle>Core Services Operational</AlertTitle>
                <AlertDescription className="space-y-2">
                  <p>
                    Core services (database, Redis, migrations) are healthy. The
                    system can serve requests.
                  </p>
                  <p className="text-sm">
                    Background worker is offline. Scheduled jobs, maintenance
                    tasks, and background processing are unavailable.
                  </p>
                </AlertDescription>
              </Alert>
            )}

            {!coreHealthy && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>System Issues Detected</AlertTitle>
                <AlertDescription>
                  One or more core services are unhealthy. Please check the
                  status above and ensure that PostgreSQL and Redis are running
                  and accessible.
                </AlertDescription>
              </Alert>
            )}
          </>
        )}
      </div>
    </div>
  );
}
