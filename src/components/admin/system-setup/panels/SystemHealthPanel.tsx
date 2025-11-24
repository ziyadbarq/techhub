"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, XCircle, Loader2, RefreshCw } from "lucide-react";
import { checkSystemHealthAction } from "@/interface-adapters/controllers/setup.controller";
import type { SystemHealthCheckDto } from "@/interface-adapters/dtos/system-setup.dto";

export function SystemHealthPanel() {
  const [healthCheck, setHealthCheck] = useState<SystemHealthCheckDto | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(false);

  const checkHealth = async () => {
    setIsLoading(true);
    try {
      const result = await checkSystemHealthAction();
      if (result.success) {
        setHealthCheck(result.data);
      }
    } catch (error) {
      console.error("Failed to check system health:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkHealth();
  }, []);

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

      {/* Health Check Items */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Database */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-sm font-medium">
              Database Connection
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
              {healthCheck?.database.error && (
                <p className="text-xs text-red-600">
                  {healthCheck.database.error}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Redis */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-sm font-medium">
              Redis Connection
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
              {healthCheck?.redis.error && (
                <p className="text-xs text-red-600">
                  {healthCheck.redis.error}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Environment */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-sm font-medium">
              Environment Variables
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
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-sm font-medium">
              Database Migrations
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
                    {healthCheck.migrations.pending} pending migration(s)
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
      </div>

      {/* Refresh Button */}
      <div className="flex justify-center">
        <Button onClick={checkHealth} disabled={isLoading} variant="outline">
          <RefreshCw
            className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
          />
          {isLoading ? "Checking..." : "Refresh Health Check"}
        </Button>
      </div>
    </div>
  );
}
