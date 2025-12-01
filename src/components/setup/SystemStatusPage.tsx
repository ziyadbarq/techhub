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
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  Terminal,
} from "lucide-react";
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
  rbac: HealthStatus;
  worker: HealthStatus;
  databaseMessage?: string;
  redisMessage?: string;
  migrationsMessage?: string;
  rbacMessage?: string;
  workerMessage?: string;
}

export function SystemStatusPage() {
  const [status, setStatus] = useState<SystemStatus>({
    database: "checking",
    redis: "checking",
    migrations: "checking",
    rbac: "checking",
    worker: "checking",
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
            rbac: "error",
            worker: "error",
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
          rbac: health.rbac.roles > 0 ? "healthy" : "unhealthy",
          worker: health.worker.active ? "healthy" : "unhealthy",
          databaseMessage: health.database.message,
          redisMessage: health.redis.message,
          migrationsMessage: health.migrations.message,
          rbacMessage:
            health.rbac.roles === 0
              ? "No roles found - run database seeding"
              : `${health.rbac.roles} roles, ${health.rbac.permissions} permissions`,
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
          rbac: "error",
          worker: "error",
          databaseMessage: "Unexpected error during health check",
          workerMessage: "Worker status unavailable",
        });
      } finally {
        setIsLoading(false);
      }
    };

    checkHealth();
  }, []);

  const coreHealthy =
    !isLoading &&
    status.database === "healthy" &&
    status.redis === "healthy" &&
    status.migrations === "healthy" &&
    status.rbac === "healthy";
  const workerHealthy = !isLoading && status.worker === "healthy";
  const needsSeeding = !isLoading && status.rbac === "unhealthy";
  const workerWarning = coreHealthy && !workerHealthy;

  return (
    <div className="from-background to-muted/20 flex min-h-screen items-center justify-center bg-gradient-to-b p-4">
      <div className="w-full max-w-2xl space-y-6">
        {/* Header */}
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold tracking-tight">System Setup</h1>
          <p className="text-muted-foreground">
            Initial setup and system health status
          </p>
        </div>

        {/* System Health Card */}
        <Card>
          <CardHeader>
            <CardTitle>System Health Check</CardTitle>
            <CardDescription>
              Verify that all system components are running correctly
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
              <StatusItem
                label="RBAC Configuration"
                status={status.rbac}
                message={status.rbacMessage}
              />
            </div>
          </CardContent>
        </Card>

        {/* Setup Instructions */}
        {!isLoading && (
          <>
            {needsSeeding && (
              <Alert>
                <Terminal className="h-4 w-4" />
                <AlertTitle>Database Seeding Required</AlertTitle>
                <AlertDescription className="mt-2 space-y-2">
                  <p>
                    The database needs to be seeded with initial data before you
                    can create an admin account.
                  </p>
                  <div className="bg-muted mt-2 rounded-md p-3 font-mono text-sm">
                    npm run db:seed
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {coreHealthy && (
              <Alert>
                {workerHealthy ? (
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-amber-500" />
                )}
                <AlertTitle>
                  {workerHealthy ? "System Ready" : "Core Services Ready"}
                </AlertTitle>
                <AlertDescription className="mt-2 space-y-3">
                  <p>
                    {workerHealthy
                      ? "All system components are healthy. Create your administrator account via the UI."
                      : "Core services are healthy. You can create your administrator account while you start the background worker."}
                  </p>

                  <div className="space-y-2">
                    <p className="font-medium">Step 1: Register</p>
                    <p className="text-muted-foreground text-sm">
                      Visit{" "}
                      <a
                        href="/register"
                        className="text-primary hover:underline"
                      >
                        /register
                      </a>{" "}
                      and create the initial user. Better Auth will handle
                      password hashing.
                    </p>
                  </div>

                  <div className="space-y-2 pt-2">
                    <p className="font-medium">
                      Step 2: Promote to System Administrator
                    </p>
                    <p className="text-muted-foreground text-sm">
                      Use Prisma Studio (<code>npm run db:studio</code>) or SQL
                      to add that user to the <code>system-administrator</code>{" "}
                      role in the <code>UserRole</code> table.
                    </p>
                  </div>

                  <div className="space-y-2 pt-2">
                    <p className="font-medium">Step 3: Login</p>
                    <p className="text-muted-foreground text-sm">
                      Sign in at{" "}
                      <a href="/login" className="text-primary hover:underline">
                        /login
                      </a>{" "}
                      with the new admin credentials.
                    </p>
                  </div>

                  <div className="border-t pt-2">
                    <p className="text-muted-foreground text-sm">
                      <strong>Note:</strong> After logging in, you can register
                      additional users at{" "}
                      <a
                        href="/register"
                        className="text-primary hover:underline"
                      >
                        /register
                      </a>
                      . New users will be assigned the viewer role by default.
                    </p>
                  </div>

                  {workerWarning && (
                    <div className="mt-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                      Background worker is offline. Run{" "}
                      <code className="font-mono text-xs">
                        npm run worker:start
                      </code>{" "}
                      to enable backups, scheduled jobs, and maintenance tasks.
                    </div>
                  )}
                </AlertDescription>
              </Alert>
            )}

            {!coreHealthy && !needsSeeding && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>System Issues Detected</AlertTitle>
                <AlertDescription>
                  Please resolve the issues above before proceeding with the
                  setup. Ensure that PostgreSQL and Redis are running and
                  accessible.
                </AlertDescription>
              </Alert>
            )}
          </>
        )}
      </div>
    </div>
  );
}
