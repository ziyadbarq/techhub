/**
 * Service SLA Metrics Table Component
 *
 * Displays SLA metric history for a service
 */

"use client";

import * as React from "react";
import { format } from "date-fns";
import { BarChart3 } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ServiceSlaBadge } from "./service-sla-badge";
import type { ServiceSlaMetricDTO } from "@/interface-adapters/presenters/service.presenter";

interface ServiceSlaMetricsTableProps {
  metrics: ServiceSlaMetricDTO[];
}

export function ServiceSlaMetricsTable({
  metrics,
}: ServiceSlaMetricsTableProps) {
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "MMM d, yyyy");
  };

  const formatMetricType = (type: string) => {
    return type
      .split("_")
      .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
      .join(" ");
  };

  const formatValue = (value: number, metricType: string) => {
    switch (metricType) {
      case "UPTIME":
      case "ERROR_RATE":
        return `${value.toFixed(3)}%`;
      case "RESPONSE_TIME":
        return `${value}ms`;
      case "THROUGHPUT":
        return `${value} req/s`;
      case "RESOLUTION_TIME":
        return `${value}min`;
      default:
        return value.toString();
    }
  };

  const getCompliancePercentageColor = (percentage: number) => {
    if (percentage >= 95) return "text-success";
    if (percentage >= 80) return "text-warning";
    return "text-destructive";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          SLA Metrics History ({metrics.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {metrics.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            No SLA metric records found
          </p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Period</TableHead>
                  <TableHead>Metric Type</TableHead>
                  <TableHead>Target</TableHead>
                  <TableHead>Actual</TableHead>
                  <TableHead>Compliance</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Incidents</TableHead>
                  <TableHead>Breach Duration</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {metrics.map((metric) => (
                  <TableRow key={metric.id}>
                    <TableCell className="text-xs">
                      {formatDate(metric.periodStart)} —{" "}
                      {formatDate(metric.periodEnd)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {formatMetricType(metric.metricType)}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {formatValue(metric.targetValue, metric.metricType)}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {formatValue(metric.actualValue, metric.metricType)}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`font-semibold ${getCompliancePercentageColor(
                          metric.compliancePercentage,
                        )}`}
                      >
                        {metric.compliancePercentage.toFixed(1)}%
                      </span>
                    </TableCell>
                    <TableCell>
                      <ServiceSlaBadge
                        status={metric.complianceStatus}
                        showIcon={false}
                      />
                    </TableCell>
                    <TableCell>
                      {metric.incidentCount > 0 ? (
                        <Badge variant="destructive">
                          {metric.incidentCount}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-sm">0</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {metric.breachDuration !== null ? (
                        <span className="text-destructive text-sm">
                          {metric.breachDuration}min
                        </span>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell>
                      {metric.notes ? (
                        <span
                          className="text-muted-foreground max-w-xs truncate text-xs"
                          title={metric.notes}
                        >
                          {metric.notes}
                        </span>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
