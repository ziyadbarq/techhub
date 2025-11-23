"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  CheckCircle2,
  XCircle,
  Loader2,
  Database,
  Server,
  FileCheck,
  Settings,
} from "lucide-react";
import { checkSystemHealthAction } from "@/interface-adapters/controllers/setup.controller";
import type { SystemHealthCheckDto } from "@/interface-adapters/dtos/system-setup.dto";

interface SystemHealthStepProps {
  onComplete: () => void;
  onProcessing: (processing: boolean) => void;
}

export function SystemHealthStep({
  onComplete,
  onProcessing,
}: SystemHealthStepProps) {
  const [healthCheck, setHealthCheck] = useState<SystemHealthCheckDto | null>(
    null,
  );
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkHealth = async () => {
    setIsChecking(true);
    onProcessing(true);
    setError(null);

    try {
      const result = await checkSystemHealthAction();

      if (result.success) {
        setHealthCheck(result.data);
      } else {
        setError(result.error || "Failed to check system health");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error occurred");
    } finally {
      setIsChecking(false);
      onProcessing(false);
    }
  };

  // Auto-check on mount
  useEffect(() => {
    checkHealth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const allHealthy = healthCheck?.overall ?? false;

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Health Check Results */}
      <div className="space-y-3">
        {/* Database Connection */}
        <HealthCheckItem
          icon={Database}
          label="Database Connection"
          status={healthCheck?.database.connected ? "success" : "error"}
          message={
            healthCheck?.database.connected
              ? "PostgreSQL connected successfully"
              : healthCheck?.database.error || "Not connected"
          }
          isChecking={isChecking}
        />

        {/* Redis Connection */}
        <HealthCheckItem
          icon={Server}
          label="Redis Connection"
          status={healthCheck?.redis.connected ? "success" : "error"}
          message={
            healthCheck?.redis.connected
              ? "Redis connected successfully"
              : healthCheck?.redis.error || "Not connected"
          }
          isChecking={isChecking}
        />

        {/* Environment Variables */}
        <HealthCheckItem
          icon={Settings}
          label="Environment Configuration"
          status={healthCheck?.environment.valid ? "success" : "error"}
          message={
            healthCheck?.environment.valid
              ? "All required environment variables present"
              : `Missing: ${healthCheck?.environment.missing.join(", ") || "unknown"}`
          }
          isChecking={isChecking}
        />

        {/* Database Migrations */}
        <HealthCheckItem
          icon={FileCheck}
          label="Database Migrations"
          status={healthCheck?.migrations.applied ? "success" : "warning"}
          message={
            healthCheck?.migrations.applied
              ? "All migrations applied"
              : healthCheck?.migrations.error ||
                `${healthCheck?.migrations.pending || 0} pending migrations`
          }
          isChecking={isChecking}
        />
      </div>

      {/* Overall Status */}
      {healthCheck && (
        <Alert variant={allHealthy ? "default" : "destructive"}>
          <AlertDescription className="flex items-center gap-2">
            {allHealthy ? (
              <>
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span>
                  System health check passed! Ready to proceed with setup.
                </span>
              </>
            ) : (
              <>
                <XCircle className="h-4 w-4" />
                <span>
                  System health check failed. Please resolve the issues above
                  before continuing.
                </span>
              </>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <Button
          onClick={checkHealth}
          variant="outline"
          disabled={isChecking}
          className="flex-1"
        >
          {isChecking ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Checking...
            </>
          ) : (
            "Re-check System Health"
          )}
        </Button>

        <Button
          onClick={onComplete}
          disabled={!allHealthy || isChecking}
          className="flex-1"
        >
          Continue to Next Step
        </Button>
      </div>
    </div>
  );
}

interface HealthCheckItemProps {
  icon: React.ElementType;
  label: string;
  status: "success" | "error" | "warning" | null;
  message: string;
  isChecking: boolean;
}

function HealthCheckItem({
  icon: Icon,
  label,
  status,
  message,
  isChecking,
}: HealthCheckItemProps) {
  return (
    <div className="flex items-start gap-3 rounded-lg border p-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted">
        <Icon className="h-5 w-5 text-muted-foreground" />
      </div>

      <div className="flex-1 space-y-1">
        <div className="flex items-center justify-between">
          <p className="font-medium">{label}</p>
          {isChecking ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          ) : status === "success" ? (
            <CheckCircle2 className="h-5 w-5 text-green-600" />
          ) : status === "error" ? (
            <XCircle className="h-5 w-5 text-destructive" />
          ) : status === "warning" ? (
            <XCircle className="h-5 w-5 text-amber-600" />
          ) : null}
        </div>
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}
