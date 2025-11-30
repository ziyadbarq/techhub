/**
 * Service Health Monitoring Card Component
 *
 * Displays current health status and monitoring metrics
 */

"use client";

import * as React from "react";
import { format } from "date-fns";
import { Activity, Clock, TrendingUp, AlertTriangle } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ServiceHealthBadge, ServiceHealthPulse } from "./service-health-badge";
import type { ServiceDTO } from "@/interface-adapters/presenters/service.presenter";

interface ServiceHealthMonitoringCardProps {
  service: ServiceDTO;
}

export function ServiceHealthMonitoringCard({
  service,
}: ServiceHealthMonitoringCardProps) {
  const formatPercentage = (value: number | null) => {
    if (value === null) return "—";
    return `${value.toFixed(2)}%`;
  };

  const formatMs = (value: number | null) => {
    if (value === null) return "—";
    return `${value}ms`;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Never";
    return format(new Date(dateString), "MMM d, yyyy HH:mm");
  };

  const getUptimeColor = (uptime: number | null) => {
    if (uptime === null) return "text-muted-foreground";
    if (uptime >= 99.9) return "text-success";
    if (uptime >= 99.0) return "text-warning";
    return "text-destructive";
  };

  const needsAttention =
    !service.isHealthy || service.needsHealthCheck || !service.isSlaCompliant;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Health Monitoring
          </CardTitle>
          <div className="flex items-center gap-2">
            <ServiceHealthPulse status={service.healthStatus} />
            <ServiceHealthBadge status={service.healthStatus} />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Health Check Status */}
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <div className="text-muted-foreground flex items-center gap-2 text-sm font-medium">
              <Clock className="h-4 w-4" />
              Last Health Check
            </div>
            <p className="mt-1 text-sm">
              {formatDate(service.lastHealthCheck)}
            </p>
          </div>

          <div>
            <div className="text-muted-foreground flex items-center gap-2 text-sm font-medium">
              <Clock className="h-4 w-4" />
              Next Scheduled Check
            </div>
            <p className="mt-1 text-sm">
              {formatDate(service.nextScheduledHealthCheck)}
            </p>
          </div>
        </div>

        {/* Performance Metrics */}
        <div>
          <h4 className="mb-3 text-sm font-semibold">Performance Metrics</h4>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-lg border p-3">
              <div className="text-muted-foreground text-xs">
                Response Time (P50)
              </div>
              <div className="mt-1 text-lg font-semibold">
                {formatMs(service.currentResponseTimeP50)}
              </div>
              {service.slaResponseTimeP50 && (
                <div className="text-muted-foreground mt-1 text-xs">
                  Target: {formatMs(service.slaResponseTimeP50)}
                </div>
              )}
            </div>

            <div className="rounded-lg border p-3">
              <div className="text-muted-foreground text-xs">
                Response Time (P95)
              </div>
              <div className="mt-1 text-lg font-semibold">
                {formatMs(service.currentResponseTimeP95)}
              </div>
              {service.slaResponseTimeP95 && (
                <div className="text-muted-foreground mt-1 text-xs">
                  Target: {formatMs(service.slaResponseTimeP95)}
                </div>
              )}
            </div>

            {service.slaResponseTimeP99 && (
              <div className="rounded-lg border p-3">
                <div className="text-muted-foreground text-xs">
                  Response Time (P99) Target
                </div>
                <div className="mt-1 text-lg font-semibold">
                  {formatMs(service.slaResponseTimeP99)}
                </div>
                <div className="text-muted-foreground mt-1 text-xs">
                  No current P99 data
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Uptime & Error Rate */}
        <div>
          <h4 className="mb-3 text-sm font-semibold">Availability Metrics</h4>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border p-3">
              <div className="text-muted-foreground flex items-center gap-2 text-xs">
                <TrendingUp className="h-3 w-3" />
                Uptime (24h)
              </div>
              <div
                className={`mt-1 text-lg font-semibold ${getUptimeColor(service.uptimePercentage24h)}`}
              >
                {formatPercentage(service.uptimePercentage24h)}
              </div>
              {service.slaUptimePercentage && (
                <div className="text-muted-foreground mt-1 text-xs">
                  Target: {formatPercentage(service.slaUptimePercentage)}
                </div>
              )}
            </div>

            <div className="rounded-lg border p-3">
              <div className="text-muted-foreground flex items-center gap-2 text-xs">
                <AlertTriangle className="h-3 w-3" />
                Error Rate
              </div>
              <div className="mt-1 text-lg font-semibold">
                {formatPercentage(service.currentErrorRate)}
              </div>
              {service.slaErrorRateThreshold && (
                <div className="text-muted-foreground mt-1 text-xs">
                  Threshold: {formatPercentage(service.slaErrorRateThreshold)}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Alerts */}
        {needsAttention && (
          <div className="bg-warning/10 rounded-lg p-3 text-sm">
            <div className="text-warning flex items-center gap-2 font-medium">
              <AlertTriangle className="h-4 w-4" />
              Attention Required
            </div>
            <ul className="text-warning mt-2 space-y-1 text-xs">
              {!service.isHealthy && (
                <li>• Service health status is unhealthy</li>
              )}
              {service.needsHealthCheck && <li>• Health check is overdue</li>}
              {!service.isSlaCompliant && (
                <li>• SLA compliance violation detected</li>
              )}
            </ul>
          </div>
        )}

        {/* Health Check Configuration */}
        {service.healthCheckEnabled && service.healthCheckUrl && (
          <div className="text-muted-foreground text-xs">
            <p>
              <span className="font-medium">Health Check URL:</span>{" "}
              <code className="bg-muted rounded px-1 py-0.5 font-mono">
                {service.healthCheckUrl}
              </code>
            </p>
            {service.healthCheckInterval && (
              <p className="mt-1">
                <span className="font-medium">Check Interval:</span>{" "}
                {service.healthCheckInterval} minutes
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
