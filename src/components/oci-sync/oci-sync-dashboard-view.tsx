"use client";

import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Clock,
  Cloud,
  Database,
  Play,
  RefreshCw,
  Server,
  ShieldAlert,
  XCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/utils/date-format";
import { OCI_SERVICE_KEYS } from "@/core/domain/value-objects/oci-resource.types";
import type { OciSyncLogDTO } from "@/interface-adapters/dtos/generated/oci-sync.dto";

interface OciSyncDashboardViewProps {
  logs: OciSyncLogDTO[];
  latest: OciSyncLogDTO | null;
  selectedLog: OciSyncLogDTO | null;
  isPending: boolean;
  selectedServices: string[];
  dryRun: boolean;
  canTrigger: boolean;
  onToggleService: (key: string) => void;
  onSelectAllServices: () => void;
  onClearServices: () => void;
  onDryRunChange: (checked: boolean) => void;
  onSync: () => void;
  onSelectLog: (logId: string) => void;
}

type DashboardTone = "neutral" | "good" | "info" | "warn" | "bad";

const STATUS_META: Record<
  string,
  {
    label: string;
    icon: typeof Cloud;
    badgeVariant: "default" | "secondary" | "destructive" | "outline";
    badgeClassName: string;
    tone: DashboardTone;
  }
> = {
  COMPLETED: {
    label: "Completed",
    icon: CheckCircle2,
    badgeVariant: "default",
    badgeClassName:
      "border-transparent bg-emerald-600 text-white hover:bg-emerald-600/90 dark:bg-emerald-500 dark:text-emerald-950",
    tone: "good",
  },
  FAILED: {
    label: "Failed",
    icon: XCircle,
    badgeVariant: "destructive",
    badgeClassName:
      "border-transparent bg-red-600 text-white hover:bg-red-600/90 dark:bg-red-500 dark:text-red-950",
    tone: "bad",
  },
  PARTIAL: {
    label: "Partial",
    icon: AlertTriangle,
    badgeVariant: "secondary",
    badgeClassName:
      "border-transparent bg-amber-500/90 text-amber-950 hover:bg-amber-500 dark:bg-amber-400 dark:text-amber-950",
    tone: "warn",
  },
  IN_PROGRESS: {
    label: "In Progress",
    icon: RefreshCw,
    badgeVariant: "outline",
    badgeClassName:
      "border-sky-300 bg-sky-50 text-sky-700 dark:border-sky-800 dark:bg-sky-950/40 dark:text-sky-300",
    tone: "info",
  },
};

const PREVIEW_STATUS_LABELS: Record<string, string> = {
  COMPLETED: "Preview Complete",
  FAILED: "Preview Failed",
  PARTIAL: "Preview Needs Attention",
  IN_PROGRESS: "Preview Running",
};

const SERVICE_DETAILS: Record<
  string,
  {
    label: string;
    shortCode: string;
    description: string;
    tokenClassName: string;
  }
> = {
  compute: {
    label: "Compute",
    shortCode: "VM",
    description: "Virtual machines and compute capacity.",
    tokenClassName:
      "bg-sky-500/15 text-sky-700 ring-sky-500/20 dark:bg-sky-400/15 dark:text-sky-300 dark:ring-sky-400/30",
  },
  lb: {
    label: "Load Balancer",
    shortCode: "LB",
    description: "Layer 7 load balancers and listeners.",
    tokenClassName:
      "bg-cyan-500/15 text-cyan-700 ring-cyan-500/20 dark:bg-cyan-400/15 dark:text-cyan-300 dark:ring-cyan-400/30",
  },
  nlb: {
    label: "Network LB",
    shortCode: "NLB",
    description: "Layer 4 balancing and ingress paths.",
    tokenClassName:
      "bg-indigo-500/15 text-indigo-700 ring-indigo-500/20 dark:bg-indigo-400/15 dark:text-indigo-300 dark:ring-indigo-400/30",
  },
  oke: {
    label: "OKE",
    shortCode: "OKE",
    description: "Managed Kubernetes clusters and workers.",
    tokenClassName:
      "bg-emerald-500/15 text-emerald-700 ring-emerald-500/20 dark:bg-emerald-400/15 dark:text-emerald-300 dark:ring-emerald-400/30",
  },
  buckets: {
    label: "Buckets",
    shortCode: "OBJ",
    description: "Object storage buckets and namespaces.",
    tokenClassName:
      "bg-amber-500/15 text-amber-700 ring-amber-500/20 dark:bg-amber-400/15 dark:text-amber-300 dark:ring-amber-400/30",
  },
  postgresql: {
    label: "PostgreSQL",
    shortCode: "PG",
    description: "Managed PostgreSQL database services.",
    tokenClassName:
      "bg-violet-500/15 text-violet-700 ring-violet-500/20 dark:bg-violet-400/15 dark:text-violet-300 dark:ring-violet-400/30",
  },
  mysql: {
    label: "MySQL",
    shortCode: "MY",
    description: "Managed MySQL database services.",
    tokenClassName:
      "bg-orange-500/15 text-orange-700 ring-orange-500/20 dark:bg-orange-400/15 dark:text-orange-300 dark:ring-orange-400/30",
  },
  dbsystems: {
    label: "DB Systems",
    shortCode: "DB",
    description: "Traditional database systems and hosts.",
    tokenClassName:
      "bg-slate-500/15 text-slate-700 ring-slate-500/20 dark:bg-slate-400/15 dark:text-slate-300 dark:ring-slate-400/30",
  },
};

const HISTORY_LIMIT = 20;

export function OciSyncDashboardView({
  logs,
  latest,
  selectedLog,
  isPending,
  selectedServices,
  dryRun,
  canTrigger,
  onToggleService,
  onSelectAllServices,
  onClearServices,
  onDryRunChange,
  onSync,
  onSelectLog,
}: OciSyncDashboardViewProps) {
  const completedRuns = logs.filter((log) => log.status === "COMPLETED").length;
  const failedRuns = logs.filter((log) => log.status === "FAILED").length;
  const partialRuns = logs.filter((log) => log.status === "PARTIAL").length;
  const attentionRuns = failedRuns + partialRuns;
  const dryRuns = logs.filter((log) => log.isDryRun).length;
  const coverageValue =
    (selectedServices.length / OCI_SERVICE_KEYS.length) * 100;

  const latestStateHelper = latest
    ? [
        formatDate(latest.startedAt),
        formatDuration(latest.durationMs),
        latest.isDryRun ? "preview only" : "live sync",
      ]
        .filter(Boolean)
        .join(" · ")
    : "Waiting for first OCI sync";

  const heroSignals: Array<{
    label: string;
    value: string;
    helper: string;
    tone: DashboardTone;
    icon: typeof Cloud;
  }> = [
    {
      label: "Latest State",
      value: latest ? getStatusLabel(latest.status, latest.isDryRun) : "Idle",
      helper: latestStateHelper,
      tone: latest
        ? (STATUS_META[latest.status]?.tone ?? "neutral")
        : "neutral",
      icon: latest ? (STATUS_META[latest.status]?.icon ?? Clock) : Clock,
    },
    {
      label: "Processed",
      value: latest ? latest.resourcesProcessed.toLocaleString() : "0",
      helper: latest
        ? latest.isDryRun
          ? `${latest.resourcesCreated} to create · ${latest.resourcesUpdated} to update · ${latest.resourcesRetired} to retire`
          : `${latest.resourcesCreated} created · ${latest.resourcesUpdated} updated · ${latest.resourcesRetired} retired`
        : "No recent inventory payload",
      tone: latest && latest.resourcesProcessed > 0 ? "info" : "neutral",
      icon: BarChart3,
    },
    {
      label: "Attention",
      value: attentionRuns.toLocaleString(),
      helper:
        attentionRuns > 0
          ? `${failedRuns} failed · ${partialRuns} partial in recent history`
          : "No failed or partial runs in recent history",
      tone: attentionRuns > 0 ? "warn" : "good",
      icon: attentionRuns > 0 ? ShieldAlert : CheckCircle2,
    },
    {
      label: "Total Runs",
      value: logs.length.toLocaleString(),
      helper:
        logs.length > 0
          ? `${completedRuns} completed · ${dryRuns} dry runs`
          : "No runs recorded yet",
      tone: logs.length > 0 ? "neutral" : "info",
      icon: Activity,
    },
  ];

  return (
    <div className="bg-background relative isolate min-h-[100dvh] overflow-hidden px-3 py-4 sm:px-5 sm:py-6 lg:px-8 lg:py-8">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-[radial-gradient(circle_at_top,hsl(var(--primary)/0.16),transparent_42%)] dark:bg-[radial-gradient(circle_at_top,hsl(var(--primary)/0.28),transparent_42%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-24 h-64 bg-[linear-gradient(180deg,hsl(var(--muted)/0.5),transparent)] dark:bg-[linear-gradient(180deg,hsl(var(--muted)/0.22),transparent)]" />

      <div className="relative z-10 mx-auto flex w-full max-w-screen-2xl flex-col gap-4 lg:gap-6">
        <Card className="border-border/70 bg-card/95 relative overflow-hidden shadow-[0_30px_90px_-70px_rgba(0,0,0,0.85)] backdrop-blur">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.14),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(16,185,129,0.14),transparent_38%)] dark:bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.18),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(52,211,153,0.18),transparent_38%)]" />
          <CardContent className="relative space-y-6 p-6 sm:p-8">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-sky-200/80 bg-sky-50/80 px-3 py-1 text-xs font-medium text-sky-700 dark:border-sky-900/60 dark:bg-sky-950/30 dark:text-sky-300">
                <Cloud className="h-3.5 w-3.5" />
                OCI inventory operations
              </div>
              <div className="space-y-3">
                <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                  Keep OCI infrastructure aligned with the CMDB.
                </h1>
                <p className="text-muted-foreground max-w-3xl text-sm leading-7 sm:text-base">
                  Trigger targeted syncs, review the most recent posture, and
                  inspect operational history from one console.
                </p>
              </div>
              {latest?.latestIssue && (
                <IssueCallout
                  status={latest.status}
                  isDryRun={latest.isDryRun}
                  message={latest.latestIssue}
                  compact={false}
                />
              )}
            </div>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {heroSignals.map((signal) => (
                <SignalCard
                  key={signal.label}
                  label={signal.label}
                  value={signal.value}
                  helper={signal.helper}
                  tone={signal.tone}
                  icon={signal.icon}
                />
              ))}
            </div>
          </CardContent>
        </Card>

        <ControlPanel
          canTrigger={canTrigger}
          coverageValue={coverageValue}
          dryRun={dryRun}
          isPending={isPending}
          selectedServices={selectedServices}
          onToggleService={onToggleService}
          onSelectAllServices={onSelectAllServices}
          onClearServices={onClearServices}
          onDryRunChange={onDryRunChange}
          onSync={onSync}
        />

        <HistorySection
          logs={logs}
          selectedLog={selectedLog}
          completedRuns={completedRuns}
          attentionRuns={attentionRuns}
          dryRuns={dryRuns}
          onSelectLog={onSelectLog}
        />
      </div>
    </div>
  );
}

function ControlPanel({
  canTrigger,
  coverageValue,
  dryRun,
  isPending,
  selectedServices,
  onToggleService,
  onSelectAllServices,
  onClearServices,
  onDryRunChange,
  onSync,
}: {
  canTrigger: boolean;
  coverageValue: number;
  dryRun: boolean;
  isPending: boolean;
  selectedServices: string[];
  onToggleService: (key: string) => void;
  onSelectAllServices: () => void;
  onClearServices: () => void;
  onDryRunChange: (checked: boolean) => void;
  onSync: () => void;
}) {
  return (
    <Card className="border-border/70 bg-card/95 overflow-hidden shadow-sm backdrop-blur">
      <CardHeader className="border-border/60 bg-background/60 border-b pb-5 backdrop-blur">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Play className="text-primary h-4 w-4" />
              <CardTitle className="text-xl tracking-tight">
                Manual Sync Console
              </CardTitle>
            </div>
            <CardDescription className="max-w-2xl text-sm leading-6">
              Choose which OCI domains to fetch, decide whether the run should
              be preview-only, and trigger a sync with a clearly scoped blast
              radius.
            </CardDescription>
          </div>

          <Badge
            variant={canTrigger ? "outline" : "secondary"}
            className={cn(
              "w-fit",
              canTrigger
                ? "border-border/70 bg-background/80"
                : "border-transparent bg-amber-500 text-amber-950",
            )}
          >
            {canTrigger ? "Trigger enabled" : "Read-only monitoring"}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6 p-6">
        {canTrigger ? (
          <>
            <div className="border-border/60 bg-background/70 rounded-3xl border p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div className="space-y-1">
                  <p className="text-muted-foreground text-xs font-medium tracking-[0.22em] uppercase">
                    Service scope
                  </p>
                  <div className="flex items-end gap-3">
                    <p className="text-3xl font-semibold tracking-tight">
                      {selectedServices.length}
                    </p>
                    <p className="text-muted-foreground pb-1 text-sm">
                      of {OCI_SERVICE_KEYS.length} domains selected
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={onSelectAllServices}
                  >
                    Select all
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={onClearServices}
                    disabled={selectedServices.length === 0}
                  >
                    Clear
                  </Button>
                </div>
              </div>
              <Progress value={coverageValue} className="mt-4 h-2.5" />
              <p className="text-muted-foreground mt-3 text-sm">
                Scope the sync to specific OCI inventory domains when you want a
                faster verification loop or a safer targeted rerun.
              </p>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              {OCI_SERVICE_KEYS.map((serviceKey) => (
                <ServiceTile
                  key={serviceKey}
                  serviceKey={serviceKey}
                  checked={selectedServices.includes(serviceKey)}
                  onToggle={() => onToggleService(serviceKey)}
                />
              ))}
            </div>

            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-stretch">
              <div className="border-border/60 bg-background/70 rounded-3xl border p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Execution mode</p>
                    <p className="text-muted-foreground text-sm leading-6">
                      Keep dry run enabled to validate connectivity and result
                      shape without writing CMDB changes.
                    </p>
                  </div>
                  <Switch
                    checked={dryRun}
                    onCheckedChange={onDryRunChange}
                    aria-label="Toggle dry run mode"
                  />
                </div>
                <div className="border-border/60 bg-card/80 mt-4 rounded-2xl border px-4 py-3">
                  <p className="text-sm font-medium">
                    {dryRun ? "Dry run preview" : "Live synchronization"}
                  </p>
                  <p className="text-muted-foreground mt-1 text-sm">
                    {dryRun
                      ? "Results are audited and surfaced in history with projected create, update, and link counts, but no CMDB changes are written."
                      : "Successful syncs write CMDB updates and compartment relationships when available."}
                  </p>
                </div>
              </div>

              <div className="border-border/60 via-background flex min-w-[220px] flex-col justify-between rounded-3xl border bg-gradient-to-br from-sky-500/10 to-emerald-500/10 p-5 dark:from-sky-400/10 dark:to-emerald-400/10">
                <div className="space-y-2">
                  <p className="text-muted-foreground text-xs font-medium tracking-[0.22em] uppercase">
                    Ready to run
                  </p>
                  <p className="text-lg font-semibold tracking-tight">
                    {dryRun
                      ? "Preview the payload first"
                      : "Push OCI changes into CMDB"}
                  </p>
                  <p className="text-muted-foreground text-sm leading-6">
                    {selectedServices.length === 0
                      ? "Select at least one OCI service domain to continue."
                      : `This run will query ${selectedServices.length} selected service${selectedServices.length === 1 ? "" : "s"}.`}
                  </p>
                </div>
                <div className="mt-6 space-y-3">
                  <Button
                    type="button"
                    size="lg"
                    className="w-full"
                    onClick={onSync}
                    disabled={isPending || selectedServices.length === 0}
                  >
                    {isPending ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        Syncing...
                      </>
                    ) : (
                      <>
                        {dryRun ? "Preview Sync" : "Start Sync"}
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </Button>
                  <p className="text-muted-foreground text-center text-xs">
                    History keeps the last {HISTORY_LIMIT} recorded runs for
                    audit review.
                  </p>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="rounded-3xl border border-amber-200 bg-amber-50/80 p-6 dark:border-amber-900/60 dark:bg-amber-950/25">
            <div className="flex items-start gap-3">
              <ShieldAlert className="mt-0.5 h-5 w-5 text-amber-700 dark:text-amber-300" />
              <div className="space-y-2">
                <p className="font-medium text-amber-950 dark:text-amber-100">
                  Trigger permission is not available for this account
                </p>
                <p className="text-sm leading-6 text-amber-900/80 dark:text-amber-200/80">
                  You can still inspect the latest OCI sync posture, read recent
                  history, and review admin-facing issues from this page. A user
                  with the trigger permission can run manual syncs.
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function HistorySection({
  logs,
  selectedLog,
  completedRuns,
  attentionRuns,
  dryRuns,
  onSelectLog,
}: {
  logs: OciSyncLogDTO[];
  selectedLog: OciSyncLogDTO | null;
  completedRuns: number;
  attentionRuns: number;
  dryRuns: number;
  onSelectLog: (logId: string) => void;
}) {
  return (
    <Card className="border-border/70 bg-card/95 overflow-hidden shadow-sm backdrop-blur">
      <CardHeader className="border-border/60 bg-background/60 border-b pb-5 backdrop-blur">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Clock className="text-primary h-4 w-4" />
              <CardTitle className="text-xl tracking-tight">
                Sync History
              </CardTitle>
            </div>
            <CardDescription className="max-w-3xl text-sm leading-6">
              Recent OCI runs are preserved as an operational record. Browse the
              timeline, compare outcomes, and inspect the selected run in
              detail.
            </CardDescription>
          </div>

          <div className="flex flex-wrap gap-2">
            <HistoryBadge label="Recorded" value={logs.length} tone="neutral" />
            <HistoryBadge
              label="Completed"
              value={completedRuns}
              tone={completedRuns > 0 ? "good" : "neutral"}
            />
            <HistoryBadge
              label="Attention"
              value={attentionRuns}
              tone={attentionRuns > 0 ? "warn" : "good"}
            />
            <HistoryBadge
              label="Dry Runs"
              value={dryRuns}
              tone={dryRuns > 0 ? "info" : "neutral"}
            />
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        {logs.length === 0 ? (
          <div className="border-border/70 bg-background/60 flex min-h-[280px] flex-col items-center justify-center rounded-3xl border border-dashed px-6 text-center">
            <Cloud className="text-primary mb-4 h-8 w-8" />
            <h3 className="text-lg font-semibold tracking-tight">
              No sync operations recorded yet
            </h3>
            <p className="text-muted-foreground mt-2 max-w-md text-sm leading-6">
              Once OCI sync runs are triggered, this area becomes the review
              surface for outcomes, dry runs, failures, and admin-visible
              issues.
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-4 xl:hidden">
              {logs.map((log) => (
                <MobileHistoryCard key={log.id} log={log} />
              ))}
            </div>

            <div className="hidden gap-4 xl:grid xl:grid-cols-[360px_minmax(0,1fr)]">
              <div className="border-border/60 bg-background/60 rounded-3xl border">
                <div className="border-border/60 flex items-center justify-between border-b px-5 py-4">
                  <div>
                    <p className="text-sm font-medium">Recent runs</p>
                    <p className="text-muted-foreground text-xs">
                      Select a run to inspect its details
                    </p>
                  </div>
                  <Badge variant="outline">{logs.length}</Badge>
                </div>

                <ScrollArea className="h-[640px]">
                  <div className="space-y-2 p-3">
                    {logs.map((log) => (
                      <HistoryListButton
                        key={log.id}
                        log={log}
                        selected={selectedLog?.id === log.id}
                        onClick={() => onSelectLog(log.id)}
                      />
                    ))}
                  </div>
                </ScrollArea>
              </div>

              <HistoryDetailPanel log={selectedLog} />
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function SignalCard({
  label,
  value,
  helper,
  tone,
  icon: Icon,
}: {
  label: string;
  value: string;
  helper: string;
  tone: DashboardTone;
  icon: typeof Cloud;
}) {
  return (
    <div className={cn("rounded-3xl border p-5", getToneSurface(tone))}>
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <p className="text-muted-foreground text-xs font-medium tracking-[0.22em] uppercase">
            {label}
          </p>
          <p className="text-2xl font-semibold tracking-tight">{value}</p>
        </div>
        <div className="bg-background/60 dark:bg-background/20 rounded-2xl border border-current/10 p-2">
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <p className="text-muted-foreground mt-3 text-sm leading-6">{helper}</p>
    </div>
  );
}

function StatusBadge({
  status,
  isDryRun = false,
}: {
  status: string;
  isDryRun?: boolean;
}) {
  const meta = STATUS_META[status] ?? STATUS_META.COMPLETED;
  const Icon = meta.icon;

  return (
    <Badge
      variant={meta.badgeVariant}
      className={cn("gap-1.5 text-xs", meta.badgeClassName)}
    >
      <Icon
        className={cn(
          "h-3.5 w-3.5",
          status === "IN_PROGRESS" ? "animate-spin" : "",
        )}
      />
      {getStatusLabel(status, isDryRun)}
    </Badge>
  );
}

function ServiceTile({
  serviceKey,
  checked,
  onToggle,
}: {
  serviceKey: string;
  checked: boolean;
  onToggle: () => void;
}) {
  const service = SERVICE_DETAILS[serviceKey];

  return (
    <label
      htmlFor={`service-scope-${serviceKey}`}
      className={cn(
        "group flex cursor-pointer flex-col gap-4 rounded-3xl border p-4 transition-colors",
        checked
          ? "border-primary/50 bg-primary/5 shadow-sm"
          : "border-border/60 bg-background/70 hover:border-primary/25 hover:bg-accent/30",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div
          className={cn(
            "inline-flex min-h-10 min-w-10 items-center justify-center rounded-2xl ring-1",
            service.tokenClassName,
          )}
        >
          <span className="text-xs font-semibold tracking-[0.18em]">
            {service.shortCode}
          </span>
        </div>
        <Checkbox
          id={`service-scope-${serviceKey}`}
          checked={checked}
          onCheckedChange={onToggle}
        />
      </div>
      <div className="space-y-1">
        <p className="font-medium">{service.label}</p>
        <p className="text-muted-foreground text-sm leading-6">
          {service.description}
        </p>
      </div>
    </label>
  );
}

function ResultTile({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: DashboardTone;
}) {
  return (
    <div className={cn("rounded-2xl border px-4 py-3", getToneSurface(tone))}>
      <p className="text-muted-foreground text-xs font-medium tracking-[0.2em] uppercase">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold tracking-tight">
        {value.toLocaleString()}
      </p>
    </div>
  );
}

function MixLegend({
  label,
  value,
  swatchClassName,
}: {
  label: string;
  value: number;
  swatchClassName: string;
}) {
  return (
    <div className="border-border/60 bg-background/70 rounded-2xl border px-3 py-2">
      <div className="flex items-center gap-2">
        <span className={cn("h-2.5 w-2.5 rounded-full", swatchClassName)} />
        <p className="text-muted-foreground text-xs font-medium tracking-[0.2em] uppercase">
          {label}
        </p>
      </div>
      <p className="mt-2 text-sm font-semibold">{value.toLocaleString()}</p>
    </div>
  );
}

function MetadataBlock({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Cloud;
  label: string;
  value: string;
}) {
  return (
    <div className="border-border/60 bg-background/70 rounded-2xl border px-4 py-3">
      <div className="text-muted-foreground flex items-center gap-2">
        <Icon className="h-4 w-4" />
        <p className="text-xs font-medium tracking-[0.2em] uppercase">
          {label}
        </p>
      </div>
      <p className="mt-2 text-sm leading-6 font-medium">{value}</p>
    </div>
  );
}

function HistoryBadge({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: DashboardTone;
}) {
  return (
    <div
      className={cn("rounded-full border px-3 py-1.5", getToneSurface(tone))}
    >
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground text-xs font-medium tracking-[0.2em] uppercase">
          {label}
        </span>
        <span className="text-sm font-semibold">{value}</span>
      </div>
    </div>
  );
}

function MobileHistoryCard({ log }: { log: OciSyncLogDTO }) {
  const serviceLabels = log.serviceTypes.map(formatServiceLabel);
  const visibleServices = serviceLabels.slice(0, 3);
  const extraServices = Math.max(
    serviceLabels.length - visibleServices.length,
    0,
  );

  return (
    <div className="border-border/60 bg-background/70 rounded-3xl border p-4 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={log.status} isDryRun={log.isDryRun} />
            {log.isDryRun && <Badge variant="outline">Dry run</Badge>}
          </div>
          <div>
            <p className="text-sm font-medium">{formatDate(log.startedAt)}</p>
            <p className="text-muted-foreground text-sm">
              {formatTriggerLabel(log.triggeredBy)} /{" "}
              {formatDuration(log.durationMs)}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:min-w-[220px]">
          <MiniMetric label="Processed" value={log.resourcesProcessed} />
          <MiniMetric label="Issues" value={log.errorsCount} />
          <MiniMetric
            label={getCreatedMetricLabel(log.isDryRun)}
            value={log.resourcesCreated}
          />
          <MiniMetric
            label={getUpdatedMetricLabel(log.isDryRun)}
            value={log.resourcesUpdated}
          />
          <MiniMetric
            label={getRetiredMetricLabel(log.isDryRun)}
            value={log.resourcesRetired}
          />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {visibleServices.map((service) => (
          <Badge
            key={`${log.id}-${service}`}
            variant="outline"
            className="border-border/70 bg-card/80"
          >
            {service}
          </Badge>
        ))}
        {extraServices > 0 && (
          <Badge variant="secondary">+{extraServices} more</Badge>
        )}
      </div>

      {log.latestIssue ? (
        <IssueCallout
          status={log.status}
          isDryRun={log.isDryRun}
          message={log.latestIssue}
          compact
        />
      ) : (
        <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50/80 px-4 py-3 dark:border-emerald-900/60 dark:bg-emerald-950/30">
          <p className="text-sm text-emerald-900 dark:text-emerald-100">
            No admin-facing issues were recorded for this run.
          </p>
        </div>
      )}
    </div>
  );
}

function HistoryListButton({
  log,
  selected,
  onClick,
}: {
  log: OciSyncLogDTO;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full rounded-3xl border p-4 text-left transition-colors",
        selected
          ? "border-primary/40 bg-primary/5 shadow-sm"
          : "border-border/60 bg-background/70 hover:border-primary/20 hover:bg-accent/30",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={log.status} isDryRun={log.isDryRun} />
            {log.isDryRun && <Badge variant="outline">Dry run</Badge>}
          </div>
          <div>
            <p className="text-sm font-medium">{formatDate(log.startedAt)}</p>
            <p className="text-muted-foreground text-xs">
              {formatTriggerLabel(log.triggeredBy)} /{" "}
              {formatDuration(log.durationMs)}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-lg font-semibold tracking-tight">
            {log.resourcesProcessed.toLocaleString()}
          </p>
          <p className="text-muted-foreground text-xs">processed</p>
        </div>
      </div>

      <Separator className="my-4" />

      <div className="flex items-center justify-between gap-4">
        <p className="text-muted-foreground text-sm">
          {log.serviceTypes.length === OCI_SERVICE_KEYS.length
            ? "Full inventory sync"
            : `${log.serviceTypes.length} selected service${log.serviceTypes.length === 1 ? "" : "s"}`}
        </p>
        <div className="flex items-center gap-3 text-xs">
          <span className="text-emerald-600 dark:text-emerald-300">
            {log.isDryRun
              ? `${log.resourcesCreated} to create`
              : `${log.resourcesCreated} created`}
          </span>
          <span className="text-sky-600 dark:text-sky-300">
            {log.isDryRun
              ? `${log.resourcesUpdated} to update`
              : `${log.resourcesUpdated} updated`}
          </span>
          <span className="text-violet-600 dark:text-violet-300">
            {log.isDryRun
              ? `${log.resourcesRetired} to retire`
              : `${log.resourcesRetired} retired`}
          </span>
          <span className="text-amber-600 dark:text-amber-300">
            {log.errorsCount} issue{log.errorsCount === 1 ? "" : "s"}
          </span>
        </div>
      </div>
    </button>
  );
}

function HistoryDetailPanel({ log }: { log: OciSyncLogDTO | null }) {
  if (!log) {
    return (
      <div className="border-border/60 bg-background/60 rounded-3xl border p-8">
        <div className="flex h-full min-h-[420px] flex-col items-center justify-center text-center">
          <Clock className="text-primary mb-4 h-8 w-8" />
          <h3 className="text-lg font-semibold tracking-tight">
            Select a run from the timeline
          </h3>
          <p className="text-muted-foreground mt-2 max-w-md text-sm leading-6">
            Details for the chosen run appear here, including service scope,
            resource mix, issues, and OCI metadata.
          </p>
        </div>
      </div>
    );
  }

  const serviceLabels = log.serviceTypes.map(formatServiceLabel);
  const totalTracked =
    log.resourcesCreated + log.resourcesUpdated + log.resourcesUnchanged;
  const createdPct =
    totalTracked > 0 ? (log.resourcesCreated / totalTracked) * 100 : 0;
  const updatedPct =
    totalTracked > 0 ? (log.resourcesUpdated / totalTracked) * 100 : 0;
  const unchangedPct =
    totalTracked > 0 ? (log.resourcesUnchanged / totalTracked) * 100 : 0;

  return (
    <div className="border-border/60 bg-background/60 rounded-3xl border p-6">
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={log.status} isDryRun={log.isDryRun} />
              {log.isDryRun && <Badge variant="outline">Dry run</Badge>}
            </div>
            <div>
              <h3 className="text-2xl font-semibold tracking-tight">
                {formatDate(log.startedAt)}
              </h3>
              <p className="text-muted-foreground text-sm">
                {formatTriggerLabel(log.triggeredBy)} ·{" "}
                {formatDuration(log.durationMs)}
                {log.serviceTypes.length < OCI_SERVICE_KEYS.length
                  ? ` · ${log.serviceTypes.length} service${log.serviceTypes.length === 1 ? "" : "s"}`
                  : " · full inventory"}
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <ResultTile
            label="Processed"
            value={log.resourcesProcessed}
            tone="info"
          />
          <ResultTile
            label="Issues"
            value={log.errorsCount}
            tone={log.errorsCount > 0 ? "warn" : "good"}
          />
          <ResultTile
            label={getRelationshipMetricLabel(log.isDryRun)}
            value={log.relationshipsCreated}
            tone="neutral"
          />
          <ResultTile
            label={getCompartmentMetricLabel(log.isDryRun)}
            value={log.compartmentsCreated}
            tone="neutral"
          />
          <ResultTile
            label={getRetiredMetricLabel(log.isDryRun)}
            value={log.resourcesRetired}
            tone={log.resourcesRetired > 0 ? "warn" : "neutral"}
          />
        </div>

        {log.isDryRun && (
          <div className="rounded-2xl border border-sky-200 bg-sky-50/80 px-4 py-3 dark:border-sky-900/60 dark:bg-sky-950/30">
            <p className="font-medium text-sky-950 dark:text-sky-100">
              Preview metrics are projections
            </p>
            <p className="mt-1 text-sm leading-6 text-sky-900/80 dark:text-sky-200/80">
              Counts marked as "would create", "would update", "would retire",
              or "would link" show what a live sync would attempt with the
              current CMDB configuration. If a prerequisite is missing,
              projected link counts stay at zero until that prerequisite is
              restored.
            </p>
          </div>
        )}

        {totalTracked > 0 && (
          <div className="space-y-3">
            <p className="text-sm font-medium">
              {log.isDryRun ? "Projected resource mix" : "Resource mix"}
            </p>
            <div className="bg-muted h-3 overflow-hidden rounded-full">
              <div className="flex h-full">
                <div
                  className="bg-emerald-500"
                  style={{ width: `${createdPct}%` }}
                />
                <div
                  className="bg-sky-500"
                  style={{ width: `${updatedPct}%` }}
                />
                <div
                  className="bg-slate-400 dark:bg-slate-500"
                  style={{ width: `${unchangedPct}%` }}
                />
              </div>
            </div>
            <div className="grid gap-2 sm:grid-cols-3">
              <MixLegend
                label={getCreatedMetricLabel(log.isDryRun)}
                value={log.resourcesCreated}
                swatchClassName="bg-emerald-500"
              />
              <MixLegend
                label={getUpdatedMetricLabel(log.isDryRun)}
                value={log.resourcesUpdated}
                swatchClassName="bg-sky-500"
              />
              <MixLegend
                label={getUnchangedMetricLabel(log.isDryRun)}
                value={log.resourcesUnchanged}
                swatchClassName="bg-slate-400 dark:bg-slate-500"
              />
            </div>
          </div>
        )}

        <div className="grid gap-4 lg:grid-cols-2">
          <MetadataBlock
            icon={Database}
            label="Tenancy"
            value={log.tenancyId ? truncateMiddle(log.tenancyId, 40) : "-"}
          />
          <MetadataBlock
            icon={Server}
            label="Regions"
            value={
              log.regions.length > 0
                ? log.regions.join(", ")
                : "No regions captured"
            }
          />
        </div>

        <div className="space-y-3">
          <p className="text-sm font-medium">Services included</p>
          <div className="flex flex-wrap gap-2">
            {serviceLabels.map((service) => (
              <Badge
                key={`${log.id}-${service}`}
                variant="outline"
                className="border-border/70 bg-card/80"
              >
                {service}
              </Badge>
            ))}
          </div>
        </div>

        {log.latestIssue && (
          <IssueCallout
            status={log.status}
            isDryRun={log.isDryRun}
            message={log.latestIssue}
            compact={false}
          />
        )}
      </div>
    </div>
  );
}

function MiniMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="border-border/60 bg-card/80 rounded-2xl border px-3 py-2">
      <p className="text-muted-foreground text-[11px] font-medium tracking-[0.2em] uppercase">
        {label}
      </p>
      <p className="mt-1 text-base font-semibold">{value.toLocaleString()}</p>
    </div>
  );
}

function IssueCallout({
  status,
  isDryRun,
  message,
  compact,
}: {
  status: string;
  isDryRun: boolean;
  message: string;
  compact: boolean;
}) {
  const tone = STATUS_META[status]?.tone ?? "warn";
  const isCritical = tone === "bad";

  return (
    <div
      className={cn(
        "mt-4 rounded-2xl border px-4 py-3",
        isCritical
          ? "border-red-200 bg-red-50/85 dark:border-red-900/60 dark:bg-red-950/30"
          : "border-amber-200 bg-amber-50/85 dark:border-amber-900/60 dark:bg-amber-950/30",
      )}
    >
      <div className="flex items-start gap-3">
        <AlertTriangle
          className={cn(
            "mt-0.5 h-5 w-5",
            isCritical
              ? "text-red-600 dark:text-red-300"
              : "text-amber-700 dark:text-amber-300",
          )}
        />
        <div>
          {!compact && (
            <p
              className={cn(
                "font-medium",
                isCritical
                  ? "text-red-950 dark:text-red-100"
                  : "text-amber-950 dark:text-amber-100",
              )}
            >
              {isCritical
                ? "Admin attention required"
                : isDryRun
                  ? "Resolve before live sync"
                  : "Admin attention required"}
            </p>
          )}
          <p
            className={cn(
              "text-sm leading-6",
              isCritical
                ? "text-red-900/85 dark:text-red-200/85"
                : "text-amber-900/85 dark:text-amber-200/85",
            )}
          >
            {message}
          </p>
        </div>
      </div>
    </div>
  );
}

function formatDuration(durationMs: number | null): string {
  if (!durationMs) return "-";
  return `${(durationMs / 1000).toFixed(1)}s`;
}

function formatTriggerLabel(triggeredBy: string | null): string {
  if (triggeredBy === "system") return "Scheduled";
  return triggeredBy ?? "-";
}

function getStatusLabel(status: string, isDryRun: boolean): string {
  if (isDryRun) {
    return PREVIEW_STATUS_LABELS[status] ?? status;
  }

  return STATUS_META[status]?.label ?? status;
}

function getCreatedMetricLabel(isDryRun: boolean): string {
  return isDryRun ? "Would create" : "Created";
}

function getUpdatedMetricLabel(isDryRun: boolean): string {
  return isDryRun ? "Would update" : "Updated";
}

function getRetiredMetricLabel(isDryRun: boolean): string {
  return isDryRun ? "Would retire" : "Retired";
}

function getUnchangedMetricLabel(isDryRun: boolean): string {
  return isDryRun ? "Already aligned" : "Unchanged";
}

function getRelationshipMetricLabel(isDryRun: boolean): string {
  return isDryRun ? "Would link" : "Relationships";
}

function getCompartmentMetricLabel(isDryRun: boolean): string {
  return isDryRun ? "Would add" : "Compartments";
}

function formatServiceLabel(serviceType: string): string {
  return SERVICE_DETAILS[serviceType]?.label ?? serviceType;
}

function truncateMiddle(value: string, maxLength: number): string {
  if (value.length <= maxLength) return value;

  const leading = Math.ceil((maxLength - 1) / 2);
  const trailing = Math.floor((maxLength - 2) / 2);

  return `${value.slice(0, leading)}...${value.slice(value.length - trailing)}`;
}

function getToneSurface(tone: DashboardTone): string {
  switch (tone) {
    case "good":
      return "border-emerald-200 bg-emerald-50/85 text-emerald-950 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-100";
    case "info":
      return "border-sky-200 bg-sky-50/85 text-sky-950 dark:border-sky-900/60 dark:bg-sky-950/30 dark:text-sky-100";
    case "warn":
      return "border-amber-200 bg-amber-50/85 text-amber-950 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-100";
    case "bad":
      return "border-red-200 bg-red-50/85 text-red-950 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-100";
    default:
      return "border-border/60 bg-background/75 text-foreground";
  }
}
