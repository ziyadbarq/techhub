/**
 * Service SLA Monitoring Card Component
 *
 * Displays current SLA compliance status and targets
 */

"use client";

import * as React from "react";
import { Shield, AlertCircle, Clock, TrendingUp } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ServiceSlaBadge } from "./service-sla-badge";
import type { ServiceDTO } from "@/interface-adapters/presenters/service.presenter";

interface ServiceSlaMonitoringCardProps {
  service: ServiceDTO;
}

export function ServiceSlaMonitoringCard({
  service,
}: ServiceSlaMonitoringCardProps) {
  const formatPercentage = (value: number | null) => {
    if (value === null) return "—";
    return `${value.toFixed(3)}%`;
  };

  const formatMinutes = (value: number | null) => {
    if (value === null) return "—";
    if (value < 60) return `${value}min`;
    const hours = Math.floor(value / 60);
    const mins = value % 60;
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
  };

  const hasSlaTargets = service.hasSlaTargets;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            SLA Compliance
          </CardTitle>
          {hasSlaTargets ? (
            <ServiceSlaBadge status={service.slaComplianceStatus} />
          ) : (
            <Badge variant="outline" className="text-muted-foreground">
              No SLA Defined
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {!hasSlaTargets ? (
          <div className="text-muted-foreground text-sm">
            No SLA targets have been configured for this service.
          </div>
        ) : (
          <>
            {/* SLA Violation Summary */}
            {service.slaViolationCount > 0 && (
              <div className="bg-destructive/10 rounded-lg p-3">
                <div className="text-destructive flex items-center gap-2 text-sm font-medium">
                  <AlertCircle className="h-4 w-4" />
                  SLA Violations: {service.slaViolationCount}
                </div>
              </div>
            )}

            {/* Response Time Targets */}
            {(service.slaResponseTimeP50 ||
              service.slaResponseTimeP95 ||
              service.slaResponseTimeP99) && (
              <div>
                <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold">
                  <Clock className="h-4 w-4" />
                  Response Time SLA Targets
                </h4>
                <div className="grid gap-3 md:grid-cols-3">
                  {service.slaResponseTimeP50 && (
                    <div className="rounded-lg border p-3">
                      <div className="text-muted-foreground text-xs">
                        P50 (Median) Target
                      </div>
                      <div className="mt-1 text-lg font-semibold">
                        {service.slaResponseTimeP50}ms
                      </div>
                      {service.currentResponseTimeP50 !== null && (
                        <div
                          className={`mt-1 text-xs ${
                            service.currentResponseTimeP50 <=
                            service.slaResponseTimeP50
                              ? "text-success"
                              : "text-destructive"
                          }`}
                        >
                          Current: {service.currentResponseTimeP50}ms
                        </div>
                      )}
                    </div>
                  )}

                  {service.slaResponseTimeP95 && (
                    <div className="rounded-lg border p-3">
                      <div className="text-muted-foreground text-xs">
                        P95 Target
                      </div>
                      <div className="mt-1 text-lg font-semibold">
                        {service.slaResponseTimeP95}ms
                      </div>
                      {service.currentResponseTimeP95 !== null && (
                        <div
                          className={`mt-1 text-xs ${
                            service.currentResponseTimeP95 <=
                            service.slaResponseTimeP95
                              ? "text-success"
                              : "text-destructive"
                          }`}
                        >
                          Current: {service.currentResponseTimeP95}ms
                        </div>
                      )}
                    </div>
                  )}

                  {service.slaResponseTimeP99 && (
                    <div className="rounded-lg border p-3">
                      <div className="text-muted-foreground text-xs">
                        P99 Target
                      </div>
                      <div className="mt-1 text-lg font-semibold">
                        {service.slaResponseTimeP99}ms
                      </div>
                      <div className="text-muted-foreground mt-1 text-xs">
                        No current P99 data
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Resolution Time Targets */}
            {(service.slaResolutionTimeCritical ||
              service.slaResolutionTimeHigh ||
              service.slaResolutionTimeMedium) && (
              <div>
                <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold">
                  <AlertCircle className="h-4 w-4" />
                  Incident Resolution Time SLA
                </h4>
                <div className="grid gap-3 md:grid-cols-3">
                  {service.slaResolutionTimeCritical && (
                    <div className="rounded-lg border p-3">
                      <div className="text-muted-foreground text-xs">
                        Critical Incidents
                      </div>
                      <div className="mt-1 text-lg font-semibold">
                        {formatMinutes(service.slaResolutionTimeCritical)}
                      </div>
                    </div>
                  )}

                  {service.slaResolutionTimeHigh && (
                    <div className="rounded-lg border p-3">
                      <div className="text-muted-foreground text-xs">
                        High Priority
                      </div>
                      <div className="mt-1 text-lg font-semibold">
                        {formatMinutes(service.slaResolutionTimeHigh)}
                      </div>
                    </div>
                  )}

                  {service.slaResolutionTimeMedium && (
                    <div className="rounded-lg border p-3">
                      <div className="text-muted-foreground text-xs">
                        Medium Priority
                      </div>
                      <div className="mt-1 text-lg font-semibold">
                        {formatMinutes(service.slaResolutionTimeMedium)}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Availability Targets */}
            {(service.slaUptimePercentage || service.slaErrorRateThreshold) && (
              <div>
                <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold">
                  <TrendingUp className="h-4 w-4" />
                  Availability SLA
                </h4>
                <div className="grid gap-3 md:grid-cols-2">
                  {service.slaUptimePercentage && (
                    <div className="rounded-lg border p-3">
                      <div className="text-muted-foreground text-xs">
                        Uptime Target
                      </div>
                      <div className="mt-1 text-lg font-semibold">
                        {formatPercentage(service.slaUptimePercentage)}
                      </div>
                      {service.uptimePercentage24h !== null && (
                        <div
                          className={`mt-1 text-xs ${
                            service.uptimePercentage24h >=
                            service.slaUptimePercentage
                              ? "text-success"
                              : "text-destructive"
                          }`}
                        >
                          Current (24h):{" "}
                          {formatPercentage(service.uptimePercentage24h)}
                        </div>
                      )}
                    </div>
                  )}

                  {service.slaErrorRateThreshold && (
                    <div className="rounded-lg border p-3">
                      <div className="text-muted-foreground text-xs">
                        Error Rate Threshold
                      </div>
                      <div className="mt-1 text-lg font-semibold">
                        {formatPercentage(service.slaErrorRateThreshold)}
                      </div>
                      {service.currentErrorRate !== null && (
                        <div
                          className={`mt-1 text-xs ${
                            service.currentErrorRate <=
                            service.slaErrorRateThreshold
                              ? "text-success"
                              : "text-destructive"
                          }`}
                        >
                          Current: {formatPercentage(service.currentErrorRate)}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Support Details */}
            {(service.slaSupportTier ||
              service.slaContactEmail ||
              service.slaEscalationPath) && (
              <div className="text-muted-foreground text-xs">
                {service.slaSupportTier && (
                  <p>
                    <span className="font-medium">Support Tier:</span>{" "}
                    {service.slaSupportTier}
                  </p>
                )}
                {service.slaContactEmail && (
                  <p className="mt-1">
                    <span className="font-medium">SLA Contact:</span>{" "}
                    <a
                      href={`mailto:${service.slaContactEmail}`}
                      className="text-primary hover:underline"
                    >
                      {service.slaContactEmail}
                    </a>
                  </p>
                )}
                {service.slaEscalationPath && (
                  <p className="mt-1">
                    <span className="font-medium">Escalation Path:</span>{" "}
                    {service.slaEscalationPath}
                  </p>
                )}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
