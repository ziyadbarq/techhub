/**
 * Report Schedules Table
 *
 * Admin view of all report schedules with toggle and delete actions.
 */

"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Play, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  toggleReportScheduleAction,
  deleteReportScheduleAction,
  triggerReportScheduleAction,
} from "@/interface-adapters/controllers/reports/report.controller";
import { formatDate } from "@/lib/utils/date-format";
import { getReportDefinition } from "@/core/domain/reports/report-definitions";
import { ReportScheduleDialog } from "./report-schedule-dialog";
import type { ReportScheduleProps } from "@/core/domain/entities/report-schedule.entity";

const DAYS_OF_WEEK = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

interface ReportSchedulesTableProps {
  initialSchedules: ReportScheduleProps[];
}

export function ReportSchedulesTable({
  initialSchedules,
}: ReportSchedulesTableProps) {
  const [schedules, setSchedules] =
    useState<ReportScheduleProps[]>(initialSchedules);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleToggle = async (id: string) => {
    setLoadingId(id);
    try {
      const result = await toggleReportScheduleAction(id);
      if (result.success) {
        setSchedules((prev) =>
          prev.map((s) => (s.id === id ? result.data : s)),
        );
        toast.success(
          result.data.isActive ? "Schedule activated" : "Schedule paused",
        );
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error("Failed to toggle schedule");
    } finally {
      setLoadingId(null);
    }
  };

  const handleTrigger = async (id: string) => {
    setLoadingId(id);
    try {
      const result = await triggerReportScheduleAction(id);
      if (result.success) {
        toast.success("Report sent successfully");
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error("Failed to trigger report");
    } finally {
      setLoadingId(null);
    }
  };

  const handleScheduleUpdated = (updated: ReportScheduleProps) => {
    setSchedules((prev) =>
      prev.map((s) => (s.id === updated.id ? updated : s)),
    );
  };

  const handleDelete = async (id: string) => {
    setLoadingId(id);
    try {
      const result = await deleteReportScheduleAction(id);
      if (result.success) {
        setSchedules((prev) => prev.filter((s) => s.id !== id));
        toast.success("Schedule deleted");
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error("Failed to delete schedule");
    } finally {
      setLoadingId(null);
    }
  };

  const formatFrequency = (schedule: ReportScheduleProps): string => {
    const time = `${String(schedule.hour).padStart(2, "0")}:${String(schedule.minute).padStart(2, "0")}`;
    switch (schedule.frequency) {
      case "DAILY":
        return `Daily at ${time}`;
      case "WEEKLY":
        return `${DAYS_OF_WEEK[schedule.dayOfWeek ?? 0]}s at ${time}`;
      case "MONTHLY":
        return `${schedule.dayOfMonth ?? 1}${ordinalSuffix(schedule.dayOfMonth ?? 1)} of month at ${time}`;
      default:
        return schedule.frequency;
    }
  };

  if (schedules.length === 0) {
    return (
      <div className="text-muted-foreground flex h-32 items-center justify-center">
        No report schedules configured yet
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Active</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Report</TableHead>
            <TableHead>Frequency</TableHead>
            <TableHead>Format</TableHead>
            <TableHead>Recipients</TableHead>
            <TableHead>Last Sent</TableHead>
            <TableHead>Next Send</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {schedules.map((schedule) => {
            const definition = getReportDefinition(schedule.reportId);
            const isLoading = loadingId === schedule.id;

            return (
              <TableRow key={schedule.id}>
                <TableCell>
                  <Switch
                    checked={schedule.isActive}
                    onCheckedChange={() => handleToggle(schedule.id)}
                    disabled={isLoading}
                  />
                </TableCell>
                <TableCell className="font-medium">{schedule.name}</TableCell>
                <TableCell>
                  <span className="text-sm">
                    {definition?.name ?? schedule.reportId}
                  </span>
                </TableCell>
                <TableCell>{formatFrequency(schedule)}</TableCell>
                <TableCell>
                  <Badge variant="outline">{schedule.format}</Badge>
                </TableCell>
                <TableCell>
                  <span
                    className="text-muted-foreground text-sm"
                    title={schedule.recipients.join(", ")}
                  >
                    {schedule.recipients.length} recipient
                    {schedule.recipients.length !== 1 ? "s" : ""}
                  </span>
                </TableCell>
                <TableCell className="text-sm">
                  {schedule.lastSentAt
                    ? formatDate(schedule.lastSentAt)
                    : "Never"}
                </TableCell>
                <TableCell className="text-sm">
                  {schedule.nextSendAt && schedule.isActive
                    ? formatDate(schedule.nextSendAt)
                    : "—"}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <ReportScheduleDialog
                      mode="edit"
                      schedule={schedule}
                      onSaved={handleScheduleUpdated}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleTrigger(schedule.id)}
                      disabled={isLoading}
                      title="Send now"
                    >
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Play className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(schedule.id)}
                      disabled={isLoading}
                      className="text-destructive hover:text-destructive"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

function ordinalSuffix(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}
