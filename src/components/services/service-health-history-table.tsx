/**
 * Service Health History Table Component
 *
 * Displays health status change history for a service
 */

"use client";
"use no memo";

import * as React from "react";
import { format } from "date-fns";
import { History } from "lucide-react";

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
import { ServiceHealthBadge } from "./service-health-badge";
import type { ServiceHealthHistoryDTO } from "@/interface-adapters/presenters/service.presenter";

interface ServiceHealthHistoryTableProps {
  histories: ServiceHealthHistoryDTO[];
}

export function ServiceHealthHistoryTable({
  histories,
}: ServiceHealthHistoryTableProps) {
  const formatDateTime = (dateString: string) => {
    return format(new Date(dateString), "MMM d, yyyy HH:mm:ss");
  };

  const formatMs = (value: number | null) => {
    if (value === null) return "—";
    return `${value}ms`;
  };

  const getStatusChangeBadge = (
    isImprovement: boolean,
    isDegradation: boolean,
  ) => {
    if (isImprovement) {
      return (
        <Badge variant="outline" className="bg-success/10 text-success">
          Improved
        </Badge>
      );
    }
    if (isDegradation) {
      return (
        <Badge variant="outline" className="bg-destructive/10 text-destructive">
          Degraded
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="bg-muted">
        No Change
      </Badge>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          Health History ({histories.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {histories.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            No health history records found
          </p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Previous Status</TableHead>
                  <TableHead>New Status</TableHead>
                  <TableHead>Change</TableHead>
                  <TableHead>Response Time</TableHead>
                  <TableHead>Status Code</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Triggered By</TableHead>
                  <TableHead>Error</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {histories.map((history) => (
                  <TableRow key={history.id}>
                    <TableCell className="font-mono text-xs">
                      {formatDateTime(history.checkTimestamp)}
                    </TableCell>
                    <TableCell>
                      <ServiceHealthBadge
                        status={history.previousStatus}
                        showIcon={false}
                      />
                    </TableCell>
                    <TableCell>
                      <ServiceHealthBadge
                        status={history.newStatus}
                        showIcon={false}
                      />
                    </TableCell>
                    <TableCell>
                      {getStatusChangeBadge(
                        history.isImprovement,
                        history.isDegradation,
                      )}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {formatMs(history.responseTime)}
                    </TableCell>
                    <TableCell>
                      {history.statusCode !== null ? (
                        <Badge
                          variant={
                            history.statusCode >= 200 &&
                            history.statusCode < 300
                              ? "outline"
                              : "destructive"
                          }
                        >
                          {history.statusCode}
                        </Badge>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {history.checkDuration !== null
                        ? `${history.checkDuration}ms`
                        : "—"}
                    </TableCell>
                    <TableCell className="text-sm">
                      {history.triggeredBy || "Automated"}
                    </TableCell>
                    <TableCell>
                      {history.errorMessage ? (
                        <span
                          className="text-destructive max-w-xs truncate text-xs"
                          title={history.errorMessage}
                        >
                          {history.errorMessage}
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
