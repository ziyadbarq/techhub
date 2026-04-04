"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { PermissionGuard } from "@/components/auth/PermissionGuard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import {
  MAINTENANCE_JOBS,
  RESERVATION_JOBS,
  TASK_JOBS,
} from "@/core/domain/jobs/job-names";
import {
  Activity,
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  Loader2,
  Pause,
  Play,
  RefreshCw,
  Server,
  ShieldCheck,
  Workflow,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import type {
  FailedJobDto,
  QueueStatusDto,
  ScheduledJobDto,
  WorkerDashboardDto,
} from "@/interface-adapters/controllers/worker-status.controller";
import {
  getWorkerDashboardAction,
  toggleQueuePauseAction,
  triggerJobAction,
} from "@/interface-adapters/controllers/worker-status.controller";

const AUTO_REFRESH_INTERVAL = 30_000;

const QUEUE_COPY: Record<
  string,
  { label: string; description: string; accent: string }
> = {
  email: {
    label: "Email",
    description: "Notifications and outbound transactional delivery.",
    accent:
      "from-sky-500/15 via-background to-transparent dark:from-sky-500/10",
  },
  tasks: {
    label: "Tasks",
    description: "Reminders, cleanup, and task-oriented automation.",
    accent:
      "from-indigo-500/15 via-background to-transparent dark:from-indigo-500/10",
  },
  maintenance: {
    label: "Maintenance",
    description: "Sync, housekeeping, backup, and platform jobs.",
    accent:
      "from-emerald-500/15 via-background to-transparent dark:from-emerald-500/10",
  },
};

const JOB_COPY: Record<string, string> = {
  [TASK_JOBS.CLEANUP_OLD_TASKS]:
    "Daily retention cleanup for completed task history.",
  [MAINTENANCE_JOBS.DETECT_STALE_CIS]:
    "Flags configuration items that have not been refreshed on time.",
  [MAINTENANCE_JOBS.OCI_RESOURCE_SYNC]:
    "Full OCI resource inventory synchronization.",
  [MAINTENANCE_JOBS.INTUNE_DEVICE_SYNC]:
    "Imports Intune device state and reconciles asset links.",
  [MAINTENANCE_JOBS.OCI_CRITICAL_SYNC]:
    "High-frequency sync for critical OCI resources.",
  [RESERVATION_JOBS.SEND_REMINDERS]:
    "Sends reservation reminders before upcoming starts.",
  [RESERVATION_JOBS.COMPLETE_EXPIRED]:
    "Closes reservations whose active window has ended.",
  [RESERVATION_JOBS.ACTIVATE_READY]:
    "Promotes confirmed reservations into active use.",
};

function formatRelativeTime(timestamp: number): string {
  const diff = timestamp - Date.now();
  const absDiff = Math.abs(diff);
  const isPast = diff < 0;

  if (absDiff < 60_000) {
    const secs = Math.round(absDiff / 1000);
    return isPast ? `${secs}s ago` : `in ${secs}s`;
  }
  if (absDiff < 3_600_000) {
    const mins = Math.round(absDiff / 60_000);
    return isPast ? `${mins}m ago` : `in ${mins}m`;
  }
  if (absDiff < 86_400_000) {
    const hours = Math.round(absDiff / 3_600_000);
    return isPast ? `${hours}h ago` : `in ${hours}h`;
  }
  const days = Math.round(absDiff / 86_400_000);
  return isPast ? `${days}d ago` : `in ${days}d`;
}

function formatAbsoluteTime(timestamp: number): string {
  return new Date(timestamp).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function describeCronPattern(pattern: string | null): string {
  if (!pattern) return "Custom schedule";

  const knownPatterns: Record<string, string> = {
    "0 2 * * *": "Runs every day at 2:00 AM",
    "0 3 * * *": "Runs every day at 3:00 AM",
    "0 4 * * *": "Runs every day at 4:00 AM",
    "0 5 * * *": "Runs every day at 5:00 AM",
    "*/15 * * * *": "Runs every 15 minutes",
    "*/30 * * * *": "Runs every 30 minutes",
    "0 * * * *": "Runs every hour",
  };

  return knownPatterns[pattern] ?? "Recurring automation schedule";
}

function getQueueMeta(queueName: string) {
  return (
    QUEUE_COPY[queueName] ?? {
      label: queueName,
      description: "Background processing queue.",
      accent:
        "from-slate-500/10 via-background to-transparent dark:from-slate-500/5",
    }
  );
}

function getQueueState(queue: QueueStatusDto) {
  if (queue.isPaused) {
    return {
      label: "Paused",
      detail: "Queue is intentionally stopped from processing new jobs.",
      badgeClassName:
        "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-50 dark:border-amber-800 dark:bg-amber-950/60 dark:text-amber-400 dark:hover:bg-amber-950/60",
      ringClassName: "bg-amber-500",
      cardClassName: "border-amber-200/70 dark:border-amber-800/50",
    };
  }

  if (queue.hasWorkers) {
    return {
      label: "Active",
      detail: "Workers are attached and ready to process incoming work.",
      badgeClassName:
        "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400 dark:hover:bg-emerald-950/60",
      ringClassName: "bg-emerald-500",
      cardClassName: "border-emerald-200/70 dark:border-emerald-800/50",
    };
  }

  return {
    label: "No workers",
    detail: "Queue exists, but no worker is currently attached to it.",
    badgeClassName:
      "border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-50 dark:border-rose-800 dark:bg-rose-950/60 dark:text-rose-400 dark:hover:bg-rose-950/60",
    ringClassName: "bg-rose-500",
    cardClassName: "border-rose-200/70 dark:border-rose-800/50",
  };
}

function summarizeError(message?: string): string {
  if (!message) return "Unknown error";
  return message.length > 140 ? `${message.slice(0, 140)}...` : message;
}

function sumQueueMetric(
  queues: QueueStatusDto[],
  key: keyof QueueStatusDto["metrics"],
): number {
  return queues.reduce((sum, queue) => sum + queue.metrics[key], 0);
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  detail,
  tone = "slate",
}: {
  icon: typeof ShieldCheck;
  label: string;
  value: string;
  detail: string;
  tone?: "emerald" | "sky" | "amber" | "rose" | "slate";
}) {
  const toneStyles = {
    emerald: {
      card: "border-emerald-200/70 bg-emerald-50/60 dark:border-emerald-800/50 dark:bg-emerald-950/40",
      icon: "border-emerald-200 bg-emerald-100 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-400",
      eyebrow: "text-emerald-900/70 dark:text-emerald-400/80",
    },
    sky: {
      card: "border-sky-200/70 bg-sky-50/60 dark:border-sky-800/50 dark:bg-sky-950/40",
      icon: "border-sky-200 bg-sky-100 text-sky-700 dark:border-sky-800 dark:bg-sky-900/60 dark:text-sky-400",
      eyebrow: "text-sky-900/70 dark:text-sky-400/80",
    },
    amber: {
      card: "border-amber-200/70 bg-amber-50/70 dark:border-amber-800/50 dark:bg-amber-950/40",
      icon: "border-amber-200 bg-amber-100 text-amber-700 dark:border-amber-800 dark:bg-amber-900/60 dark:text-amber-400",
      eyebrow: "text-amber-900/70 dark:text-amber-400/80",
    },
    rose: {
      card: "border-rose-200/70 bg-rose-50/60 dark:border-rose-800/50 dark:bg-rose-950/40",
      icon: "border-rose-200 bg-rose-100 text-rose-700 dark:border-rose-800 dark:bg-rose-900/60 dark:text-rose-400",
      eyebrow: "text-rose-900/70 dark:text-rose-400/80",
    },
    slate: {
      card: "border-border/70 bg-card",
      icon: "border-border bg-muted text-foreground",
      eyebrow: "text-foreground/70",
    },
  }[tone];

  return (
    <Card className={cn("overflow-hidden shadow-sm", toneStyles.card)}>
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          <div
            className={cn(
              "flex h-12 w-12 items-center justify-center rounded-2xl border shadow-sm",
              toneStyles.icon,
            )}
          >
            <Icon className="h-5 w-5" />
          </div>
          <div className="min-w-0 space-y-2">
            <p
              className={cn(
                "text-xs font-medium tracking-[0.18em] uppercase",
                toneStyles.eyebrow,
              )}
            >
              {label}
            </p>
            <p className="text-3xl font-semibold tracking-tight">{value}</p>
            <CardDescription className="text-sm leading-relaxed">
              {detail}
            </CardDescription>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function QueueMixBar({ queue }: { queue: QueueStatusDto }) {
  const segments = [
    {
      key: "waiting",
      label: "Waiting",
      value: queue.metrics.waiting,
      className: "bg-sky-500",
    },
    {
      key: "active",
      label: "Active",
      value: queue.metrics.active,
      className: "bg-indigo-500",
    },
    {
      key: "completed",
      label: "Completed",
      value: queue.metrics.completed,
      className: "bg-emerald-500",
    },
    {
      key: "failed",
      label: "Failed",
      value: queue.metrics.failed,
      className: "bg-rose-500",
    },
    {
      key: "delayed",
      label: "Delayed",
      value: queue.metrics.delayed,
      className: "bg-amber-500",
    },
  ];

  const total = segments.reduce((sum, segment) => sum + segment.value, 0);

  return (
    <div className="space-y-3">
      <div className="bg-muted/70 flex h-2 overflow-hidden rounded-full">
        {total === 0 ? (
          <div className="bg-border/80 h-full w-full" />
        ) : (
          segments
            .filter((segment) => segment.value > 0)
            .map((segment) => (
              <div
                key={segment.key}
                className={cn("h-full", segment.className)}
                style={{ width: `${(segment.value / total) * 100}%` }}
              />
            ))
        )}
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-5">
        {segments.map((segment) => (
          <div
            key={segment.key}
            className="bg-background/70 flex min-w-0 items-center justify-between gap-2 overflow-hidden rounded-lg border px-2.5 py-2"
          >
            <div className="flex min-w-0 items-center gap-1.5">
              <span
                className={cn(
                  "h-2 w-2 shrink-0 rounded-full",
                  segment.className,
                )}
                aria-hidden="true"
              />
              <span className="text-muted-foreground truncate">
                {segment.label}
              </span>
            </div>
            <span className="shrink-0 font-medium tabular-nums">
              {segment.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function QueueCard({
  queue,
  isToggling,
  onTogglePause,
}: {
  queue: QueueStatusDto;
  isToggling: boolean;
  onTogglePause: (name: string, pause: boolean) => void;
}) {
  const meta = getQueueMeta(queue.name);
  const state = getQueueState(queue);
  const backlog = queue.metrics.waiting + queue.metrics.delayed;
  const inFlight =
    queue.metrics.waiting + queue.metrics.active + queue.metrics.delayed;
  const retainedJobs =
    queue.metrics.waiting +
    queue.metrics.active +
    queue.metrics.completed +
    queue.metrics.failed +
    queue.metrics.delayed;
  const backlogPressure =
    retainedJobs === 0 ? 0 : Math.round((backlog / retainedJobs) * 100);
  const failureDensity =
    retainedJobs === 0
      ? 0
      : Math.round((queue.metrics.failed / retainedJobs) * 100);
  const backlogLabel =
    backlog === 0 ? "Clear lane" : backlog < 5 ? "Watch lane" : "Busy lane";
  const failureLabel =
    queue.metrics.failed === 0
      ? "Clean history"
      : queue.metrics.failed < 3
        ? "Watch failures"
        : "Failure hotspot";

  return (
    <Card
      className={cn(
        "overflow-hidden border shadow-sm",
        state.cardClassName,
        "bg-gradient-to-br",
        meta.accent,
      )}
    >
      <CardHeader className="space-y-5 pb-5">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={cn("h-2.5 w-2.5 rounded-full", state.ringClassName)}
                aria-hidden="true"
              />
              <Badge
                variant="outline"
                className={cn("capitalize", state.badgeClassName)}
              >
                {state.label}
              </Badge>
              <Badge variant="outline" className="bg-background/70">
                {queue.hasWorkers ? "Worker attached" : "Worker missing"}
              </Badge>
              <Badge variant="outline" className="bg-background/70">
                {inFlight === 0 ? "Idle lane" : `${inFlight} live jobs`}
              </Badge>
            </div>
            <div>
              <CardTitle className="text-xl">{meta.label}</CardTitle>
              <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
                {meta.description}
              </p>
            </div>
          </div>
          <Button
            variant={queue.isPaused ? "default" : "outline"}
            size="sm"
            className="min-w-28"
            disabled={isToggling}
            onClick={() => onTogglePause(queue.name, !queue.isPaused)}
          >
            {isToggling ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : queue.isPaused ? (
              <Play className="h-4 w-4" />
            ) : (
              <Pause className="h-4 w-4" />
            )}
            {queue.isPaused ? "Resume queue" : "Pause queue"}
          </Button>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="bg-background/75 rounded-xl border p-3">
            <p className="text-muted-foreground text-xs uppercase">
              Retained jobs
            </p>
            <p className="mt-1 text-2xl font-semibold">{retainedJobs}</p>
          </div>
          <div className="bg-background/75 rounded-xl border p-3">
            <p className="text-muted-foreground text-xs uppercase">Backlog</p>
            <p className="mt-1 text-2xl font-semibold">{backlog}</p>
          </div>
          <div className="bg-background/75 rounded-xl border p-3">
            <p className="text-muted-foreground text-xs uppercase">
              Active now
            </p>
            <p className="mt-1 text-2xl font-semibold">
              {queue.metrics.active}
            </p>
          </div>
          <div className="bg-background/75 rounded-xl border p-3">
            <p className="text-muted-foreground text-xs uppercase">
              Failure count
            </p>
            <p className="mt-1 text-2xl font-semibold">
              {queue.metrics.failed}
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="grid gap-4 2xl:grid-cols-[1.12fr_0.88fr]">
        <div className="bg-background/80 rounded-2xl border p-4">
          <div className="mb-3 flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-medium">Traffic mix</p>
              <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
                {state.detail}
              </p>
            </div>
            <Badge variant="outline" className="bg-background/80">
              {retainedJobs === 0 ? "No retained history" : "Retained snapshot"}
            </Badge>
          </div>
          <QueueMixBar queue={queue} />
        </div>

        <div className="space-y-4">
          <div className="bg-background/80 rounded-2xl border p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium">Backlog pressure</p>
                <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
                  {backlogLabel}. Waiting and delayed work relative to retained
                  queue history.
                </p>
              </div>
              <p className="text-lg font-semibold">{backlogPressure}%</p>
            </div>
            <Progress value={backlogPressure} className="bg-muted mt-4 h-2.5" />
          </div>

          <div className="bg-background/80 rounded-2xl border p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium">Failure density</p>
                <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
                  {failureLabel}. Failed jobs as a share of retained queue
                  activity.
                </p>
              </div>
              <p className="text-lg font-semibold">{failureDensity}%</p>
            </div>
            <Progress value={failureDensity} className="bg-muted mt-4 h-2.5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ScheduledJobsSection({
  jobs,
  triggeringJob,
  onTrigger,
}: {
  jobs: ScheduledJobDto[];
  triggeringJob: string | null;
  onTrigger: (queueName: string, jobName: string, jobKey: string) => void;
}) {
  const nextScheduled = jobs[0];

  return (
    <Card className="border-border/60 overflow-hidden shadow-sm">
      <CardHeader className="bg-muted/20 space-y-4 border-b pb-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Clock className="text-muted-foreground h-5 w-5" />
              <CardTitle>Scheduled jobs</CardTitle>
              <Badge variant="secondary">{jobs.length}</Badge>
            </div>
            <CardDescription className="mt-2 text-sm leading-relaxed">
              Recurring automation across task cleanup, cloud sync, and
              maintenance flows.
            </CardDescription>
          </div>
          <div className="bg-background/80 rounded-2xl border px-4 py-3 text-sm shadow-sm">
            <p className="text-muted-foreground text-xs uppercase">Next run</p>
            <p className="mt-1 text-lg font-semibold">
              {nextScheduled
                ? `${formatRelativeTime(nextScheduled.nextRun)}`
                : "No jobs scheduled"}
            </p>
            {nextScheduled ? (
              <p className="text-muted-foreground mt-1 text-xs">
                {formatAbsoluteTime(nextScheduled.nextRun)}
              </p>
            ) : null}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        {jobs.length === 0 ? (
          <div className="text-muted-foreground bg-muted/20 flex min-h-44 items-center justify-center rounded-xl border border-dashed px-6 text-center text-sm">
            No scheduled jobs were detected. Verify the worker process is alive
            and has registered recurring jobs.
          </div>
        ) : (
          <div className="grid gap-4 2xl:grid-cols-2">
            {jobs.map((job, index) => (
              <div
                key={job.key}
                className={cn(
                  "bg-background/85 relative overflow-hidden rounded-2xl border p-4 shadow-sm",
                  index === 0
                    ? "border-emerald-200 bg-emerald-50/40 dark:border-emerald-800/50 dark:bg-emerald-950/30"
                    : "border-border/60",
                )}
              >
                <div
                  className={cn(
                    "absolute inset-y-5 left-0 w-1 rounded-full",
                    index === 0
                      ? "bg-emerald-500"
                      : "bg-slate-300 dark:bg-slate-600",
                  )}
                />
                <div className="pl-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-sm font-medium">
                          {job.name}
                        </span>
                        {index === 0 ? (
                          <Badge variant="secondary">Next up</Badge>
                        ) : null}
                      </div>
                      <p className="text-muted-foreground text-sm leading-relaxed">
                        {JOB_COPY[job.name] ?? "Recurring background job."}
                      </p>
                    </div>

                    <div className="bg-background/90 rounded-2xl border px-3 py-2 text-right shadow-sm">
                      <p className="text-muted-foreground text-[11px] font-medium tracking-[0.16em] uppercase">
                        Launch window
                      </p>
                      <p className="mt-1 text-lg font-semibold">
                        {formatRelativeTime(job.nextRun)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    <div className="bg-muted/20 rounded-xl border p-3">
                      <p className="text-muted-foreground text-[11px] font-medium tracking-[0.16em] uppercase">
                        Queue
                      </p>
                      <p className="mt-2 font-medium">
                        {getQueueMeta(job.queueName).label}
                      </p>
                    </div>
                    <div className="bg-muted/20 rounded-xl border p-3">
                      <p className="text-muted-foreground text-[11px] font-medium tracking-[0.16em] uppercase">
                        Cadence
                      </p>
                      <p className="mt-2 text-sm font-medium">
                        {describeCronPattern(job.pattern)}
                      </p>
                      <p className="text-muted-foreground mt-1 font-mono text-xs">
                        {job.pattern ?? "No cron pattern"}
                      </p>
                    </div>
                    <div className="bg-muted/20 rounded-xl border p-3">
                      <p className="text-muted-foreground text-[11px] font-medium tracking-[0.16em] uppercase">
                        Exact time
                      </p>
                      <p className="mt-2 text-sm font-medium">
                        {formatAbsoluteTime(job.nextRun)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex justify-end">
                    <Button
                      variant={index === 0 ? "default" : "outline"}
                      size="sm"
                      className="w-full sm:w-auto"
                      disabled={triggeringJob === job.key}
                      onClick={() =>
                        onTrigger(job.queueName, job.name, job.key)
                      }
                    >
                      {triggeringJob === job.key ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Play className="h-4 w-4" />
                      )}
                      Run now
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function FailuresSection({
  jobs,
  referenceTimestamp,
}: {
  jobs: FailedJobDto[];
  referenceTimestamp: number;
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const latestFailure = jobs[0];
  const persistentFailures = jobs.filter((job) => job.attemptsMade >= 3).length;
  const impactedQueues = new Set(jobs.map((job) => job.queueName)).size;
  const weekOldFailures = jobs.filter(
    (job) =>
      referenceTimestamp - (job.finishedOn ?? job.timestamp) >
      7 * 24 * 60 * 60 * 1000,
  ).length;

  return (
    <Card className="border-border/60 overflow-hidden shadow-sm">
      <CardHeader className="bg-muted/20 space-y-4 border-b pb-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <AlertCircle className="text-muted-foreground h-5 w-5" />
              <CardTitle>Recent failures</CardTitle>
              <Badge variant={jobs.length > 0 ? "destructive" : "secondary"}>
                {jobs.length}
              </Badge>
            </div>
            <CardDescription className="mt-2 text-sm leading-relaxed">
              Inspect retried jobs, understand failure reasons, and verify
              whether incidents are still current.
            </CardDescription>
          </div>
          <div className="bg-background/80 rounded-2xl border px-4 py-3 text-sm shadow-sm">
            <p className="text-muted-foreground text-xs uppercase">
              Latest failure
            </p>
            <p className="mt-1 text-lg font-semibold">
              {latestFailure
                ? formatRelativeTime(
                    latestFailure.finishedOn ?? latestFailure.timestamp,
                  )
                : "No failures retained"}
            </p>
          </div>
        </div>

        {jobs.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="bg-background/85 rounded-2xl border p-3 shadow-sm">
              <p className="text-muted-foreground text-[11px] font-medium tracking-[0.16em] uppercase">
                Persistent
              </p>
              <p className="mt-2 text-2xl font-semibold">
                {persistentFailures}
              </p>
              <p className="text-muted-foreground mt-1 text-xs">
                failures with 3 or more attempts
              </p>
            </div>
            <div className="bg-background/85 rounded-2xl border p-3 shadow-sm">
              <p className="text-muted-foreground text-[11px] font-medium tracking-[0.16em] uppercase">
                Impacted queues
              </p>
              <p className="mt-2 text-2xl font-semibold">{impactedQueues}</p>
              <p className="text-muted-foreground mt-1 text-xs">
                queues represented in retained failures
              </p>
            </div>
            <div className="bg-background/85 rounded-2xl border p-3 shadow-sm">
              <p className="text-muted-foreground text-[11px] font-medium tracking-[0.16em] uppercase">
                Older than 7d
              </p>
              <p className="mt-2 text-2xl font-semibold">{weekOldFailures}</p>
              <p className="text-muted-foreground mt-1 text-xs">
                failures still visible in history
              </p>
            </div>
          </div>
        ) : null}
      </CardHeader>

      <CardContent className="p-6">
        {jobs.length === 0 ? (
          <div className="bg-muted/20 flex min-h-44 flex-col items-center justify-center rounded-xl border border-dashed px-6 text-center">
            <CheckCircle2 className="mb-3 h-6 w-6 text-emerald-500" />
            <p className="font-medium">No recent failures</p>
            <p className="text-muted-foreground mt-1 text-sm">
              The retained job history is currently clean.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {jobs.map((job) => {
              const failureTime = job.finishedOn ?? job.timestamp;
              const isExpanded = expandedId === job.id;
              const severity =
                job.attemptsMade >= 3
                  ? {
                      border: "border-rose-200 dark:border-rose-800/60",
                      rail: "bg-rose-500",
                      badge:
                        "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-800 dark:bg-rose-950/60 dark:text-rose-400",
                    }
                  : {
                      border: "border-amber-200 dark:border-amber-800/60",
                      rail: "bg-amber-500",
                      badge:
                        "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/60 dark:text-amber-400",
                    };

              return (
                <Collapsible
                  key={`${job.queueName}-${job.id}`}
                  open={isExpanded}
                  onOpenChange={(open) => setExpandedId(open ? job.id : null)}
                >
                  <div
                    className={cn(
                      "bg-background/85 relative overflow-hidden rounded-2xl border shadow-sm",
                      severity.border,
                    )}
                  >
                    <div
                      className={cn(
                        "absolute inset-y-0 left-0 w-1.5",
                        severity.rail,
                      )}
                    />
                    <CollapsibleTrigger asChild>
                      <button className="w-full p-4 pl-5 text-left">
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0 space-y-3">
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge variant="outline" className="capitalize">
                                {getQueueMeta(job.queueName).label}
                              </Badge>
                              <Badge
                                variant="outline"
                                className={severity.badge}
                              >
                                {job.attemptsMade} attempt
                                {job.attemptsMade === 1 ? "" : "s"}
                              </Badge>
                            </div>
                            <div>
                              <p className="font-mono text-sm font-medium">
                                {job.name}
                              </p>
                              <p className="text-muted-foreground mt-1 text-sm">
                                {summarizeError(job.failedReason)}
                              </p>
                            </div>
                            <p className="text-muted-foreground text-xs">
                              {formatRelativeTime(failureTime)} ·{" "}
                              {formatAbsoluteTime(failureTime)}
                            </p>
                          </div>

                          <div className="text-muted-foreground flex items-center gap-2 text-sm">
                            <span>{isExpanded ? "Hide" : "Details"}</span>
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </div>
                        </div>
                      </button>
                    </CollapsibleTrigger>

                    <CollapsibleContent>
                      <div className="px-5 pb-5">
                        <ScrollArea className="bg-muted/20 max-h-48 rounded-lg border">
                          <pre className="p-4 text-xs leading-relaxed break-all whitespace-pre-wrap">
                            {job.failedReason ?? "Unknown error"}
                          </pre>
                        </ScrollArea>
                      </div>
                    </CollapsibleContent>
                  </div>
                </Collapsible>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.95fr)]">
        <Card className="border-border/60 overflow-hidden">
          <CardContent className="p-6 sm:p-8">
            <div className="space-y-4">
              <div className="bg-muted h-5 w-32 animate-pulse rounded-full" />
              <div className="bg-muted h-12 w-72 animate-pulse rounded-lg" />
              <div className="bg-muted h-5 w-full max-w-2xl animate-pulse rounded" />
              <div className="grid gap-3 sm:grid-cols-3">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div
                    key={index}
                    className="bg-muted/70 h-24 animate-pulse rounded-2xl"
                  />
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="bg-muted h-5 w-28 animate-pulse rounded-full" />
              <div className="bg-muted h-10 w-48 animate-pulse rounded-lg" />
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div
                    key={index}
                    className="bg-muted/70 h-20 animate-pulse rounded-2xl"
                  />
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2 2xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index} className="border-border/60">
            <CardContent className="p-5">
              <div className="space-y-3">
                <div className="bg-muted h-4 w-24 animate-pulse rounded" />
                <div className="bg-muted h-8 w-20 animate-pulse rounded" />
                <div className="bg-muted h-4 w-full animate-pulse rounded" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <div className="bg-muted h-4 w-24 animate-pulse rounded" />
          <div className="bg-muted h-8 w-56 animate-pulse rounded" />
        </div>
        <div className="grid gap-4 xl:grid-cols-2 2xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Card key={index} className="border-border/60">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="bg-muted h-5 w-32 animate-pulse rounded" />
                  <div className="bg-muted h-24 animate-pulse rounded-xl" />
                  <div className="bg-muted h-28 animate-pulse rounded-xl" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <div className="bg-muted h-4 w-40 animate-pulse rounded" />
          <div className="bg-muted h-8 w-72 animate-pulse rounded" />
        </div>
        <div className="grid gap-6 2xl:grid-cols-[1.12fr_0.88fr]">
          {Array.from({ length: 2 }).map((_, index) => (
            <Card key={index} className="border-border/60">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="bg-muted h-5 w-32 animate-pulse rounded" />
                  <div className="bg-muted h-32 animate-pulse rounded-2xl" />
                  <div className="bg-muted h-32 animate-pulse rounded-2xl" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

export function WorkerStatusDashboard() {
  const [data, setData] = useState<WorkerDashboardDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [triggeringJob, setTriggeringJob] = useState<string | null>(null);
  const [togglingQueue, setTogglingQueue] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const deferredRefreshRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchDashboard = useCallback(
    async (mode: "initial" | "refresh" = "refresh") => {
      if (mode === "initial") {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      try {
        const result = await getWorkerDashboardAction();
        if (result.success) {
          setData(result.data);
          setError(null);
        } else {
          setError(result.error);
        }
      } catch {
        setError("Failed to fetch worker status");
      } finally {
        setLoading(false);
        setRefreshing(false);
        setLastRefresh(new Date());
      }
    },
    [],
  );

  useEffect(() => {
    void fetchDashboard("initial");
    intervalRef.current = setInterval(() => {
      void fetchDashboard("refresh");
    }, AUTO_REFRESH_INTERVAL);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (deferredRefreshRef.current) clearTimeout(deferredRefreshRef.current);
    };
  }, [fetchDashboard]);

  const handleTriggerJob = async (
    queueName: string,
    jobName: string,
    jobKey: string,
  ) => {
    setTriggeringJob(jobKey);

    try {
      const result = await triggerJobAction(queueName, jobName);
      if (result.success) {
        toast.success(`Job "${jobName}" triggered`, {
          description: `Job ID: ${result.data.jobId}`,
        });

        if (deferredRefreshRef.current) {
          clearTimeout(deferredRefreshRef.current);
        }
        deferredRefreshRef.current = setTimeout(() => {
          void fetchDashboard("refresh");
        }, 1000);
      } else {
        toast.error("Failed to trigger job", { description: result.error });
      }
    } catch {
      toast.error("Failed to trigger job");
    } finally {
      setTriggeringJob(null);
    }
  };

  const handleTogglePause = async (queueName: string, pause: boolean) => {
    setTogglingQueue(queueName);
    try {
      const result = await toggleQueuePauseAction(queueName, pause);
      if (result.success) {
        toast.success(`Queue "${queueName}" ${pause ? "paused" : "resumed"}`);
        await fetchDashboard("refresh");
      } else {
        toast.error("Failed to toggle queue", { description: result.error });
      }
    } catch {
      toast.error("Failed to toggle queue");
    } finally {
      setTogglingQueue(null);
    }
  };

  const queues = data?.queues ?? [];
  const scheduledJobs = [...(data?.scheduledJobs ?? [])].sort(
    (a, b) => a.nextRun - b.nextRun,
  );
  const failedJobs = [...(data?.recentFailedJobs ?? [])].sort(
    (a, b) => (b.finishedOn ?? b.timestamp) - (a.finishedOn ?? a.timestamp),
  );

  const activeQueueCount = queues.filter(
    (queue) => queue.hasWorkers && !queue.isPaused,
  ).length;
  const pausedQueueCount = queues.filter((queue) => queue.isPaused).length;
  const workerlessQueueCount = queues.filter(
    (queue) => !queue.hasWorkers,
  ).length;
  const totalWaiting = sumQueueMetric(queues, "waiting");
  const totalActive = sumQueueMetric(queues, "active");
  const totalDelayed = sumQueueMetric(queues, "delayed");
  const totalCompleted = sumQueueMetric(queues, "completed");
  const liveWorkload = totalWaiting + totalActive + totalDelayed;
  const latestFailure = failedJobs[0];
  const nextScheduledJob = scheduledJobs[0];
  const queuesWithBacklog = queues.filter(
    (queue) => queue.metrics.waiting + queue.metrics.delayed > 0,
  ).length;
  const backlogLeader =
    [...queues]
      .sort(
        (a, b) =>
          b.metrics.waiting +
          b.metrics.delayed -
          (a.metrics.waiting + a.metrics.delayed),
      )
      .find((queue) => queue.metrics.waiting + queue.metrics.delayed > 0) ??
    null;
  const impactedFailureQueues = new Set(failedJobs.map((job) => job.queueName))
    .size;
  const attentionItems = [
    error
      ? {
          title: "Refresh issue",
          detail: error,
          tone: "destructive" as const,
        }
      : null,
    workerlessQueueCount > 0
      ? {
          title: "Worker coverage gap",
          detail: `${workerlessQueueCount} queue${workerlessQueueCount === 1 ? "" : "s"} currently have no attached worker.`,
          tone: "warning" as const,
        }
      : null,
    pausedQueueCount > 0
      ? {
          title: "Paused processing",
          detail: `${pausedQueueCount} queue${pausedQueueCount === 1 ? "" : "s"} are paused and will not drain until resumed.`,
          tone: "default" as const,
        }
      : null,
    backlogLeader
      ? {
          title: "Backlog leader",
          detail: `${getQueueMeta(backlogLeader.name).label} carries ${backlogLeader.metrics.waiting + backlogLeader.metrics.delayed} waiting or delayed jobs.`,
          tone: "default" as const,
        }
      : null,
    latestFailure
      ? {
          title: "Retained failures",
          detail: `${failedJobs.length} retained failure${failedJobs.length === 1 ? "" : "s"} with the latest ${formatRelativeTime(latestFailure.finishedOn ?? latestFailure.timestamp)}.`,
          tone: "warning" as const,
        }
      : null,
  ].filter(
    (
      item,
    ): item is {
      title: string;
      detail: string;
      tone: "default" | "warning" | "destructive";
    } => Boolean(item),
  );

  return (
    <PermissionGuard
      permission={PERMISSIONS.SETTINGS_MANAGE}
      fallback={
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-semibold">Access denied</h2>
            <p className="text-muted-foreground mt-2">
              You need the settings:manage permission to view worker status.
            </p>
          </div>
        </div>
      }
    >
      <div className="space-y-8">
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.95fr)]">
          <Card className="relative overflow-hidden border-0 bg-[linear-gradient(135deg,#0f172a_0%,#111827_38%,#052e2b_100%)] text-white shadow-lg">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(56,189,248,0.22),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(250,204,21,0.18),transparent_34%)]" />
            <CardContent className="relative p-6 sm:p-8">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="border-white/20 bg-white/10 text-white hover:bg-white/10">
                  Admin only
                </Badge>
                <Badge
                  className={cn(
                    "gap-1 border-white/20 text-white hover:bg-white/10",
                    data?.healthy ? "bg-emerald-500/20" : "bg-rose-500/20",
                  )}
                >
                  {data?.healthy ? (
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  ) : (
                    <XCircle className="h-3.5 w-3.5" />
                  )}
                  {data?.healthy ? "Healthy" : "Needs attention"}
                </Badge>
                <Badge className="border-white/20 bg-white/10 text-white hover:bg-white/10">
                  <RefreshCw className="mr-1 h-3.5 w-3.5" />
                  Auto-refresh 30s
                </Badge>
              </div>

              <div className="mt-6 space-y-4">
                <div>
                  <p className="text-xs font-medium tracking-[0.22em] text-slate-300 uppercase">
                    Background Operations
                  </p>
                  <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
                    Worker control plane
                  </h1>
                </div>
                <p className="max-w-3xl text-sm leading-6 text-slate-300 sm:text-base">
                  Run the worker fleet like an operations surface: check queue
                  posture, spot backlog and failures early, and launch recurring
                  jobs without leaving the admin area.
                </p>
              </div>

              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-sm">
                  <div className="flex items-center gap-2 text-sm font-medium text-slate-200">
                    <Server className="h-4 w-4" />
                    Coverage
                  </div>
                  <p className="mt-3 text-3xl font-semibold">
                    {activeQueueCount}/{queues.length || 0}
                  </p>
                  <p className="mt-1 text-sm text-slate-300">
                    queues actively processing
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-sm">
                  <div className="flex items-center gap-2 text-sm font-medium text-slate-200">
                    <Workflow className="h-4 w-4" />
                    Live workload
                  </div>
                  <p className="mt-3 text-3xl font-semibold">{liveWorkload}</p>
                  <p className="mt-1 text-sm text-slate-300">
                    waiting, active, and delayed jobs
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-sm">
                  <div className="flex items-center gap-2 text-sm font-medium text-slate-200">
                    <AlertCircle className="h-4 w-4" />
                    Incident pressure
                  </div>
                  <p className="mt-3 text-3xl font-semibold">
                    {failedJobs.length}
                  </p>
                  <p className="mt-1 text-sm text-slate-300">
                    retained failed jobs for review
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/60 via-background to-background overflow-hidden bg-gradient-to-b from-amber-50/80 shadow-sm dark:from-amber-950/30">
            <CardHeader className="space-y-2 pb-4">
              <div className="flex items-center justify-between gap-3">
                <Badge variant="outline" className="bg-background/80">
                  Operations pulse
                </Badge>
                <Badge
                  variant={refreshing ? "secondary" : "outline"}
                  className="bg-background/80"
                >
                  {refreshing ? "Refreshing" : "Live snapshot"}
                </Badge>
              </div>
              <CardTitle className="text-2xl tracking-tight">
                Keep the worker plane steady
              </CardTitle>
              <CardDescription className="leading-relaxed">
                This panel surfaces refresh timing, automation horizon, and the
                most important items that need an operator decision.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                <div className="bg-background/85 rounded-2xl border p-4 shadow-sm">
                  <p className="text-muted-foreground text-[11px] font-medium tracking-[0.16em] uppercase">
                    Last refresh
                  </p>
                  <p className="mt-2 text-2xl font-semibold">
                    {lastRefresh
                      ? lastRefresh.toLocaleTimeString()
                      : "Not refreshed"}
                  </p>
                  <p className="text-muted-foreground mt-1 text-xs">
                    {refreshing
                      ? "Pulling fresh queue and worker data now."
                      : "Dashboard refreshes automatically every 30 seconds."}
                  </p>
                </div>
                <div className="bg-background/85 rounded-2xl border p-4 shadow-sm">
                  <p className="text-muted-foreground text-[11px] font-medium tracking-[0.16em] uppercase">
                    Next automation
                  </p>
                  <p className="mt-2 text-2xl font-semibold">
                    {nextScheduledJob
                      ? formatRelativeTime(nextScheduledJob.nextRun)
                      : "Idle"}
                  </p>
                  <p className="text-muted-foreground mt-1 text-xs">
                    {nextScheduledJob
                      ? `${nextScheduledJob.name} on ${getQueueMeta(nextScheduledJob.queueName).label}`
                      : "No recurring jobs are currently registered."}
                  </p>
                </div>
                <div className="bg-background/85 rounded-2xl border p-4 shadow-sm">
                  <p className="text-muted-foreground text-[11px] font-medium tracking-[0.16em] uppercase">
                    Queue posture
                  </p>
                  <p className="mt-2 text-2xl font-semibold">
                    {pausedQueueCount + workerlessQueueCount}
                  </p>
                  <p className="text-muted-foreground mt-1 text-xs">
                    paused or workerless queues requiring manual review
                  </p>
                </div>
                <div className="bg-background/85 rounded-2xl border p-4 shadow-sm">
                  <p className="text-muted-foreground text-[11px] font-medium tracking-[0.16em] uppercase">
                    Retained completions
                  </p>
                  <p className="mt-2 text-2xl font-semibold">
                    {totalCompleted}
                  </p>
                  <p className="text-muted-foreground mt-1 text-xs">
                    completed jobs currently represented in queue history
                  </p>
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium">Needs attention</p>
                  <Badge
                    variant={
                      attentionItems.length > 0 ? "destructive" : "secondary"
                    }
                  >
                    {attentionItems.length}
                  </Badge>
                </div>

                {attentionItems.length === 0 ? (
                  <div className="bg-background/70 rounded-2xl border border-dashed px-4 py-5 text-sm">
                    <p className="font-medium">No immediate actions queued</p>
                    <p className="text-muted-foreground mt-1 leading-relaxed">
                      Workers, schedules, and retained failures are all in a
                      comfortable state right now.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {attentionItems.map((item) => (
                      <div
                        key={item.title}
                        className={cn(
                          "rounded-2xl border px-4 py-3 shadow-sm",
                          item.tone === "destructive"
                            ? "border-rose-200 bg-rose-50/80 dark:border-rose-800/60 dark:bg-rose-950/40"
                            : item.tone === "warning"
                              ? "border-amber-200 bg-amber-50/80 dark:border-amber-800/60 dark:bg-amber-950/40"
                              : "border-border/70 bg-background/85",
                        )}
                      >
                        <p className="text-sm font-medium">{item.title}</p>
                        <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
                          {item.detail}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Button
                variant="outline"
                className="bg-background/90 w-full gap-2"
                onClick={() => void fetchDashboard("refresh")}
                disabled={loading || refreshing}
              >
                <RefreshCw
                  className={cn("h-4 w-4", refreshing ? "animate-spin" : "")}
                />
                Refresh dashboard
              </Button>
            </CardContent>
          </Card>
        </div>

        {loading && !data ? (
          <DashboardSkeleton />
        ) : (
          <>
            <div className="grid gap-4 xl:grid-cols-2 2xl:grid-cols-4">
              <SummaryCard
                icon={ShieldCheck}
                label="Operational health"
                value={data?.healthy ? "Stable" : "Watch"}
                detail={
                  data?.healthy
                    ? "Queues and workers are responding normally."
                    : "One or more queues need intervention or a worker reconnect."
                }
                tone={data?.healthy ? "emerald" : "rose"}
              />
              <SummaryCard
                icon={Activity}
                label="Queue pressure"
                value={
                  backlogLeader
                    ? getQueueMeta(backlogLeader.name).label
                    : "Balanced"
                }
                detail={
                  backlogLeader
                    ? `${backlogLeader.metrics.waiting + backlogLeader.metrics.delayed} waiting or delayed jobs across ${queuesWithBacklog} active backlog lane${queuesWithBacklog === 1 ? "" : "s"}.`
                    : "No queue currently carries waiting or delayed work."
                }
                tone={queuesWithBacklog > 0 ? "sky" : "emerald"}
              />
              <SummaryCard
                icon={Clock}
                label="Automation horizon"
                value={
                  nextScheduledJob
                    ? formatRelativeTime(nextScheduledJob.nextRun)
                    : "Idle"
                }
                detail={
                  nextScheduledJob
                    ? `${nextScheduledJob.name} is the next recurring job to fire.`
                    : "No scheduled jobs are currently registered."
                }
                tone={scheduledJobs.length > 0 ? "amber" : "slate"}
              />
              <SummaryCard
                icon={AlertCircle}
                label="Failure spread"
                value={`${impactedFailureQueues}`}
                detail={
                  latestFailure
                    ? `${failedJobs.length} retained failure${failedJobs.length === 1 ? "" : "s"} with the latest ${formatRelativeTime(
                        latestFailure.finishedOn ?? latestFailure.timestamp,
                      )}.`
                    : "No failed jobs in the retained history window."
                }
                tone={failedJobs.length > 0 ? "rose" : "emerald"}
              />
            </div>

            <section className="space-y-4">
              <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
                <div>
                  <p className="text-muted-foreground text-xs font-medium tracking-[0.18em] uppercase">
                    Queue Lanes
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-tight">
                    Queue status by worker lane
                  </h2>
                  <p className="text-muted-foreground mt-2 max-w-3xl text-sm leading-relaxed">
                    Each queue card shows live posture, backlog concentration,
                    and failure density so you can decide whether to intervene
                    or let the automation continue.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="bg-background/80">
                    {queuesWithBacklog} with backlog
                  </Badge>
                  <Badge variant="outline" className="bg-background/80">
                    {pausedQueueCount} paused
                  </Badge>
                  <Badge variant="outline" className="bg-background/80">
                    {workerlessQueueCount} without worker
                  </Badge>
                </div>
              </div>

              {queues.length === 0 ? (
                <Card className="border-dashed shadow-sm">
                  <CardContent className="flex min-h-44 items-center justify-center px-6 text-center">
                    <div>
                      <p className="font-medium">No queues reported</p>
                      <p className="text-muted-foreground mt-1 text-sm">
                        Start the worker process or refresh the dashboard after
                        BullMQ queues have been registered.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4 xl:grid-cols-2 2xl:grid-cols-3">
                  {queues.map((queue) => (
                    <QueueCard
                      key={queue.name}
                      queue={queue}
                      isToggling={togglingQueue === queue.name}
                      onTogglePause={handleTogglePause}
                    />
                  ))}
                </div>
              )}
            </section>

            <section className="space-y-4">
              <div>
                <p className="text-muted-foreground text-xs font-medium tracking-[0.18em] uppercase">
                  Automation & Incidents
                </p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight">
                  Recurring jobs and failure history
                </h2>
                <p className="text-muted-foreground mt-2 max-w-3xl text-sm leading-relaxed">
                  Schedule visibility and incident review sit side-by-side so
                  you can correlate what should run next with what has recently
                  gone wrong.
                </p>
              </div>

              <div className="grid gap-6 2xl:grid-cols-[1.12fr_0.88fr]">
                <ScheduledJobsSection
                  jobs={scheduledJobs}
                  triggeringJob={triggeringJob}
                  onTrigger={handleTriggerJob}
                />
                <FailuresSection
                  jobs={failedJobs}
                  referenceTimestamp={lastRefresh?.getTime() ?? 0}
                />
              </div>
            </section>
          </>
        )}
      </div>
    </PermissionGuard>
  );
}
