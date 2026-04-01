/**
 * Report Schedule Dialog
 *
 * Modal form for creating or editing scheduled report email deliveries.
 * Supports both "create" mode (triggered from report viewer) and
 * "edit" mode (triggered from schedules admin table).
 */

"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Clock, Mail, Pencil } from "lucide-react";
import { toast } from "sonner";
import {
  createReportScheduleAction,
  updateReportScheduleAction,
} from "@/interface-adapters/controllers/reports/report.controller";
import { usePermissions } from "@/hooks/use-permissions";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import type { ReportScheduleProps } from "@/core/domain/entities/report-schedule.entity";

// ---------------------------------------------------------------------------
// Create mode props (from report viewer)
// ---------------------------------------------------------------------------
interface CreateModeProps {
  mode?: "create";
  reportId: string;
  reportName: string;
  currentFilters: Record<string, string>;
  schedule?: undefined;
  onSaved?: undefined;
}

// ---------------------------------------------------------------------------
// Edit mode props (from schedules admin table)
// ---------------------------------------------------------------------------
interface EditModeProps {
  mode: "edit";
  schedule: ReportScheduleProps;
  onSaved: (updated: ReportScheduleProps) => void;
  reportId?: undefined;
  reportName?: undefined;
  currentFilters?: undefined;
}

type ReportScheduleDialogProps = CreateModeProps | EditModeProps;

export function ReportScheduleDialog(props: ReportScheduleDialogProps) {
  const isEdit = props.mode === "edit";
  const existing = isEdit ? props.schedule : null;

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [frequency, setFrequency] = useState<"DAILY" | "WEEKLY" | "MONTHLY">(
    "WEEKLY",
  );
  const [dayOfWeek, setDayOfWeek] = useState("0");
  const [dayOfMonth, setDayOfMonth] = useState("1");
  const [hour, setHour] = useState("8");
  const [format, setFormat] = useState<"PDF" | "CSV" | "XLSX">("PDF");
  const [recipientsText, setRecipientsText] = useState("");

  const { hasAnyPermission } = usePermissions();
  const canSchedule = hasAnyPermission([
    PERMISSIONS.REPORTS_SCHEDULE,
    PERMISSIONS.REPORTS_MANAGE,
  ]);

  // Reset form when dialog opens
  useEffect(() => {
    if (!open) return;

    if (existing) {
      setName(existing.name);
      setFrequency(existing.frequency);
      setDayOfWeek(String(existing.dayOfWeek ?? 0));
      setDayOfMonth(String(existing.dayOfMonth ?? 1));
      setHour(String(existing.hour));
      setFormat(existing.format);
      setRecipientsText(existing.recipients.join(", "));
    } else {
      setName(props.reportName ? `${props.reportName} - Scheduled` : "");
      setFrequency("WEEKLY");
      setDayOfWeek("0");
      setDayOfMonth("1");
      setHour("8");
      setFormat("PDF");
      setRecipientsText("");
    }
  }, [open, existing, props.reportName]);

  if (!canSchedule) return null;

  const handleSubmit = async () => {
    const recipients = recipientsText
      .split(",")
      .map((e) => e.trim())
      .filter((e) => e.length > 0);

    if (recipients.length === 0) {
      toast.error("At least one email recipient is required");
      return;
    }

    setLoading(true);
    try {
      if (isEdit && existing) {
        const result = await updateReportScheduleAction(existing.id, {
          name,
          frequency,
          dayOfWeek: frequency === "WEEKLY" ? Number(dayOfWeek) : undefined,
          dayOfMonth: frequency === "MONTHLY" ? Number(dayOfMonth) : undefined,
          hour: Number(hour),
          format,
          recipients,
        });

        if (result.success) {
          toast.success("Schedule updated");
          props.onSaved(result.data);
          setOpen(false);
        } else {
          toast.error(result.error);
        }
      } else {
        const result = await createReportScheduleAction({
          reportId: props.reportId,
          name,
          frequency,
          dayOfWeek: frequency === "WEEKLY" ? Number(dayOfWeek) : undefined,
          dayOfMonth: frequency === "MONTHLY" ? Number(dayOfMonth) : undefined,
          hour: Number(hour),
          minute: 0,
          recipients,
          filters: props.currentFilters,
          format,
        });

        if (result.success) {
          toast.success("Report schedule created");
          setOpen(false);
        } else {
          toast.error(result.error);
        }
      }
    } catch {
      toast.error(
        isEdit ? "Failed to update schedule" : "Failed to create schedule",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {isEdit ? (
          <Button variant="ghost" size="icon" title="Edit">
            <Pencil className="h-4 w-4" />
          </Button>
        ) : (
          <Button variant="outline" size="sm">
            <Clock className="mr-1 h-4 w-4" />
            Schedule
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit Schedule" : "Schedule Report Delivery"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update the schedule settings for this report delivery."
              : "Automatically send this report via email on a recurring schedule."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Schedule Name */}
          <div className="space-y-1">
            <Label>Schedule Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Weekly Report"
            />
          </div>

          {/* Frequency */}
          <div className="space-y-1">
            <Label>Frequency</Label>
            <Select
              value={frequency}
              onValueChange={(v) => setFrequency(v as typeof frequency)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DAILY">Daily</SelectItem>
                <SelectItem value="WEEKLY">Weekly</SelectItem>
                <SelectItem value="MONTHLY">Monthly</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Day of Week (for WEEKLY) */}
          {frequency === "WEEKLY" && (
            <div className="space-y-1">
              <Label>Day of Week</Label>
              <Select value={dayOfWeek} onValueChange={setDayOfWeek}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Sunday</SelectItem>
                  <SelectItem value="1">Monday</SelectItem>
                  <SelectItem value="2">Tuesday</SelectItem>
                  <SelectItem value="3">Wednesday</SelectItem>
                  <SelectItem value="4">Thursday</SelectItem>
                  <SelectItem value="5">Friday</SelectItem>
                  <SelectItem value="6">Saturday</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Day of Month (for MONTHLY) */}
          {frequency === "MONTHLY" && (
            <div className="space-y-1">
              <Label>Day of Month</Label>
              <Select value={dayOfMonth} onValueChange={setDayOfMonth}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 28 }, (_, i) => i + 1).map((d) => (
                    <SelectItem key={d} value={String(d)}>
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Time */}
          <div className="space-y-1">
            <Label>Time ({existing?.timezone ?? "Asia/Riyadh"})</Label>
            <Select value={hour} onValueChange={setHour}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 24 }, (_, i) => i).map((h) => (
                  <SelectItem key={h} value={String(h)}>
                    {String(h).padStart(2, "0")}:00
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Format */}
          <div className="space-y-1">
            <Label>Export Format</Label>
            <Select
              value={format}
              onValueChange={(v) => setFormat(v as typeof format)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PDF">PDF</SelectItem>
                <SelectItem value="CSV">CSV</SelectItem>
                <SelectItem value="XLSX">Excel</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Recipients */}
          <div className="space-y-1">
            <Label>
              <Mail className="mr-1 inline h-3 w-3" />
              Recipients (comma-separated)
            </Label>
            <Input
              value={recipientsText}
              onChange={(e) => setRecipientsText(e.target.value)}
              placeholder="user@barq.com, team@barq.com"
            />
            <p className="text-muted-foreground text-xs">Max 10 recipients</p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading
              ? isEdit
                ? "Saving..."
                : "Creating..."
              : isEdit
                ? "Save Changes"
                : "Create Schedule"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
