"use client";

import { useEffect, useState } from "react";
import {
  Activity,
  AlertCircle,
  CheckCircle2,
  Database,
  ExternalLink,
  Loader2,
  Mail,
  RefreshCw,
  ServerCog,
  ShieldCheck,
  Tag,
  Wifi,
  XCircle,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { SystemHealthCheckDto } from "@/interface-adapters/dtos/system-setup.dto";
import { formatDateTime } from "@/lib/utils/date-format";

type HealthLevel = "checking" | "healthy" | "degraded" | "unhealthy" | "error";

interface HealthApiResponse {
  success: boolean;
  status: Exclude<HealthLevel, "checking" | "error">;
  checkedAt: string;
  data?: SystemHealthCheckDto;
  error?: string;
}

interface HealthState {
  status: HealthLevel;
  checkedAt?: string;
  data?: SystemHealthCheckDto;
  error?: string;
}

interface StatusRowProps {
  label: string;
  status: HealthLevel;
  message?: string;
  metric?: string;
}

interface SummaryCardProps {
  label: string;
  value: string;
  tone: "good" | "warn" | "bad" | "neutral";
}

const AUTO_REFRESH_MS = 30_000;

function formatTimestamp(value?: string): string {
  if (!value) {
    return "Not checked yet";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Unknown";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "medium",
  }).format(date);
}

function formatBuildDate(value: string): string {
  return value === "unknown" ? "Unknown" : formatDateTime(value);
}

function getStatusIcon(status: HealthLevel) {
  switch (status) {
    case "checking":
      return <Loader2 className="text-muted-foreground h-4 w-4 animate-spin" />;
    case "healthy":
      return (
        <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
      );
    case "degraded":
      return (
        <AlertCircle className="h-4 w-4 text-amber-500 dark:text-amber-400" />
      );
    case "unhealthy":
    case "error":
      return <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />;
  }
}

function getStatusBadge(status: HealthLevel) {
  switch (status) {
    case "checking":
      return <Badge variant="secondary">Checking</Badge>;
    case "healthy":
      return (
        <Badge className="border-emerald-500/25 bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/15 dark:text-emerald-300">
          Healthy
        </Badge>
      );
    case "degraded":
      return (
        <Badge className="border-amber-500/25 bg-amber-500/15 text-amber-700 hover:bg-amber-500/15 dark:text-amber-300">
          Degraded
        </Badge>
      );
    case "unhealthy":
      return <Badge variant="destructive">Unhealthy</Badge>;
    case "error":
      return <Badge variant="destructive">Error</Badge>;
  }
}

function getSummaryCardToneClass(tone: SummaryCardProps["tone"]): string {
  switch (tone) {
    case "good":
      return "border-emerald-500/25 bg-emerald-500/10";
    case "warn":
      return "border-amber-500/25 bg-amber-500/10";
    case "bad":
      return "border-red-500/25 bg-red-500/10";
    case "neutral":
      return "border-border bg-card";
  }
}

function StatusRow({ label, status, message, metric }: StatusRowProps) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex items-start gap-3">
        <div className="mt-0.5">{getStatusIcon(status)}</div>
        <div className="space-y-1">
          <div className="font-medium">{label}</div>
          {message ? (
            <p className="text-muted-foreground text-sm leading-6">{message}</p>
          ) : null}
        </div>
      </div>
      <div className="flex items-center gap-2 sm:shrink-0">
        {metric ? (
          <span className="text-muted-foreground text-xs tracking-[0.22em] uppercase">
            {metric}
          </span>
        ) : null}
        {getStatusBadge(status)}
      </div>
    </div>
  );
}

function SummaryCard({ label, value, tone }: SummaryCardProps) {
  return (
    <div
      className={`rounded-2xl border p-4 sm:p-5 ${getSummaryCardToneClass(tone)}`}
    >
      <div className="text-muted-foreground text-xs tracking-[0.22em] uppercase">
        {label}
      </div>
      <div className="mt-3 text-xl leading-tight font-semibold tracking-tight text-balance sm:text-2xl">
        {value}
      </div>
    </div>
  );
}

function getOptionalServiceStatus(
  configured: boolean,
  connected: boolean,
): HealthLevel {
  if (!configured) {
    return "healthy";
  }

  return connected ? "healthy" : "unhealthy";
}

export function SystemHealthPage() {
  const [health, setHealth] = useState<HealthState>({ status: "checking" });
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    let active = true;

    const loadHealth = async (background = false) => {
      if (!background) {
        setHealth((current) => ({
          ...current,
          status: current.data ? current.status : "checking",
          error: undefined,
        }));
      }

      setIsRefreshing(true);

      try {
        const response = await fetch("/api/system-health", {
          cache: "no-store",
        });

        const payload = (await response.json()) as HealthApiResponse;

        if (!active) {
          return;
        }

        if (!response.ok || !payload.success || !payload.data) {
          setHealth({
            status: payload.status ?? "error",
            checkedAt: payload.checkedAt,
            error: payload.error ?? "Failed to load system health",
          });
          return;
        }

        setHealth({
          status: payload.status,
          checkedAt: payload.checkedAt,
          data: payload.data,
        });
      } catch (error) {
        if (!active) {
          return;
        }

        setHealth({
          status: "error",
          error:
            error instanceof Error
              ? error.message
              : "Unexpected error during health check",
        });
      } finally {
        if (active) {
          setIsRefreshing(false);
        }
      }
    };

    void loadHealth();

    const interval = window.setInterval(() => {
      void loadHealth(true);
    }, AUTO_REFRESH_MS);

    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, []);

  const data = health.data;
  const coreServicesHealthy = data?.coreServicesHealthy ?? false;
  const overallHealthy = data?.overall ?? false;
  const workerWarning = coreServicesHealthy && !overallHealthy;
  const envMissing = data?.environment.missing ?? [];
  const integrationsHealthy = data?.integrationsHealthy ?? false;
  const integrationStatus: HealthLevel = !data
    ? "checking"
    : integrationsHealthy
      ? "healthy"
      : "degraded";
  const optionalServices = data
    ? [
        {
          label: "Microsoft Graph SSO",
          status: getOptionalServiceStatus(
            data.msGraphSSO.configured,
            data.msGraphSSO.connected,
          ),
          message: data.msGraphSSO.message ?? data.msGraphSSO.error,
          metric:
            data.msGraphSSO.responseTimeMs !== undefined
              ? `${data.msGraphSSO.responseTimeMs} ms`
              : data.msGraphSSO.configured
                ? undefined
                : "Optional",
        },
        {
          label: "Intune Connectivity",
          status: getOptionalServiceStatus(
            data.intune.configured,
            data.intune.connected,
          ),
          message: data.intune.message ?? data.intune.error,
          metric:
            data.intune.responseTimeMs !== undefined
              ? `${data.intune.responseTimeMs} ms`
              : data.intune.configured
                ? undefined
                : "Optional",
        },
        {
          label: "Email Service",
          status: getOptionalServiceStatus(
            data.email.configured,
            data.email.connected,
          ),
          message: data.email.message ?? data.email.error,
          metric:
            data.email.responseTimeMs !== undefined
              ? `${data.email.responseTimeMs} ms`
              : data.email.configured
                ? undefined
                : "Optional",
        },
      ]
    : [];

  return (
    <div className="bg-background relative isolate min-h-[100dvh] px-3 py-4 sm:px-5 sm:py-6 lg:px-8 lg:py-8">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(circle_at_top,hsl(var(--primary)/0.14),transparent_38%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-24 h-64 bg-[linear-gradient(180deg,hsl(var(--muted)/0.4),transparent)]" />
      <div className="relative z-10 mx-auto flex min-h-[calc(100dvh-2rem)] w-full max-w-screen-2xl flex-col gap-4 sm:min-h-[calc(100dvh-3rem)] lg:gap-6">
        <div className="grid items-stretch gap-4 lg:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.85fr)] lg:gap-6">
          <Card className="border-border/70 bg-card/95 relative flex h-full flex-col overflow-hidden shadow-sm backdrop-blur">
            <CardHeader className="border-border/60 bg-background/60 border-b backdrop-blur">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Activity className="text-primary h-5 w-5" />
                    {getStatusBadge(health.status)}
                  </div>
                  <CardTitle className="text-3xl tracking-tight">
                    TechHub System Health
                  </CardTitle>
                  <CardDescription className="max-w-2xl text-base leading-7">
                    Public status page for the core application runtime,
                    background worker, environment validation, and optional
                    integrations.
                  </CardDescription>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between lg:justify-end">
                  <div className="text-muted-foreground text-left text-sm sm:text-right">
                    <div>Last checked</div>
                    <div className="text-foreground font-medium">
                      {formatTimestamp(health.checkedAt)}
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => window.location.reload()}
                    disabled={isRefreshing}
                  >
                    <RefreshCw
                      className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
                    />
                    Refresh
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="grid gap-3 p-4 sm:p-6 md:grid-cols-2 xl:grid-cols-5">
              <SummaryCard
                label="Overall"
                value={
                  health.status === "checking"
                    ? "Checking"
                    : health.status === "healthy"
                      ? "Operational"
                      : health.status === "degraded"
                        ? "Degraded"
                        : "Incident"
                }
                tone={
                  health.status === "healthy"
                    ? "good"
                    : health.status === "degraded"
                      ? "warn"
                      : health.status === "checking"
                        ? "neutral"
                        : "bad"
                }
              />
              <SummaryCard
                label="Core Services"
                value={
                  data
                    ? coreServicesHealthy
                      ? "Healthy"
                      : "Unhealthy"
                    : "Pending"
                }
                tone={!data ? "neutral" : coreServicesHealthy ? "good" : "bad"}
              />
              <SummaryCard
                label="Worker"
                value={
                  data ? (data.worker.active ? "Online" : "Offline") : "Pending"
                }
                tone={
                  !data
                    ? "neutral"
                    : data.worker.active
                      ? "good"
                      : coreServicesHealthy
                        ? "warn"
                        : "bad"
                }
              />
              <SummaryCard
                label="Integrations"
                value={
                  data
                    ? integrationsHealthy
                      ? "Healthy"
                      : "Attention"
                    : "Pending"
                }
                tone={!data ? "neutral" : integrationsHealthy ? "good" : "warn"}
              />
              <SummaryCard
                label="Environment"
                value={
                  data
                    ? data.environment.valid
                      ? "Valid"
                      : `${envMissing.length} Missing`
                    : "Pending"
                }
                tone={
                  !data ? "neutral" : data.environment.valid ? "good" : "bad"
                }
              />
            </CardContent>
          </Card>

          <Card className="border-border/70 bg-card/95 flex h-full flex-col shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Tag className="text-foreground h-5 w-5" />
                Deployed Build
              </CardTitle>
              <CardDescription>
                CI-calculated release version plus immutable build metadata
                baked into the running image.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {data?.buildInfo ? (
                <dl className="space-y-3 text-sm">
                  {[
                    {
                      label: "Release Version",
                      value: data.buildInfo.version,
                    },
                    {
                      label: "Build ID",
                      value: data.buildInfo.imageTag,
                    },
                    {
                      label: "Git Ref",
                      value: data.buildInfo.gitRef,
                    },
                    {
                      label: "Git Commit",
                      value: data.buildInfo.gitCommit,
                      secondary:
                        data.buildInfo.gitCommitFull !==
                        data.buildInfo.gitCommit
                          ? data.buildInfo.gitCommitFull
                          : undefined,
                      href:
                        data.buildInfo.projectUrl &&
                        data.buildInfo.gitCommitFull !== "local"
                          ? `${data.buildInfo.projectUrl}/-/commit/${data.buildInfo.gitCommitFull}`
                          : undefined,
                    },
                    {
                      label: "Pipeline",
                      value:
                        data.buildInfo.pipelineId === "local"
                          ? "Local build"
                          : `#${data.buildInfo.pipelineId}`,
                      href: data.buildInfo.pipelineUrl,
                    },
                    {
                      label: "GitLab Job",
                      value:
                        data.buildInfo.jobId === "local"
                          ? "Unavailable"
                          : `#${data.buildInfo.jobId}`,
                      href: data.buildInfo.jobUrl,
                    },
                    {
                      label: "Built At",
                      value: formatBuildDate(data.buildInfo.buildDate),
                      secondary:
                        data.buildInfo.buildDate !== "unknown"
                          ? data.buildInfo.buildDate
                          : undefined,
                    },
                  ].map(({ label, value, secondary, href }) => (
                    <div
                      key={label}
                      className="border-border/70 bg-muted/35 flex items-start justify-between gap-3 rounded-xl border px-4 py-3"
                    >
                      <dt className="text-muted-foreground shrink-0">
                        {label}
                      </dt>
                      <dd className="space-y-1 text-right">
                        <div className="font-mono text-xs break-all">
                          {href ? (
                            <a
                              href={href}
                              target="_blank"
                              rel="noreferrer"
                              className="text-foreground inline-flex items-center justify-end gap-1 hover:underline"
                            >
                              {value}
                              <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                          ) : (
                            value
                          )}
                        </div>
                        {secondary ? (
                          <div className="text-muted-foreground text-[11px] break-all">
                            {secondary}
                          </div>
                        ) : null}
                      </dd>
                    </div>
                  ))}
                </dl>
              ) : (
                <p className="text-muted-foreground text-sm">Loading…</p>
              )}
            </CardContent>
          </Card>
        </div>

        {health.error ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Unable to load health status</AlertTitle>
            <AlertDescription>{health.error}</AlertDescription>
          </Alert>
        ) : null}

        <div className="grid content-start items-start gap-4 lg:gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
          <div className="grid content-start gap-4 self-start lg:gap-6">
            <Card className="flex flex-col self-start">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="text-foreground h-5 w-5" />
                  Core Runtime Checks
                </CardTitle>
                <CardDescription>
                  Dependencies required for the app to serve requests correctly.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <StatusRow
                  label="Database"
                  status={
                    data
                      ? data.database.connected
                        ? "healthy"
                        : "unhealthy"
                      : "checking"
                  }
                  message={data?.database.error ?? data?.database.message}
                  metric={
                    data?.database.responseTimeMs !== undefined
                      ? `${data.database.responseTimeMs} ms`
                      : undefined
                  }
                />
                <StatusRow
                  label="Redis"
                  status={
                    data
                      ? data.redis.connected
                        ? "healthy"
                        : "unhealthy"
                      : "checking"
                  }
                  message={data?.redis.error ?? data?.redis.message}
                  metric={
                    data?.redis.responseTimeMs !== undefined
                      ? `${data.redis.responseTimeMs} ms`
                      : undefined
                  }
                />
                <StatusRow
                  label="Database Migrations"
                  status={
                    data
                      ? data.migrations.applied
                        ? "healthy"
                        : "unhealthy"
                      : "checking"
                  }
                  message={data?.migrations.error ?? data?.migrations.message}
                  metric={
                    data?.migrations.pending !== undefined
                      ? `${data.migrations.pending} pending`
                      : undefined
                  }
                />
                <StatusRow
                  label="Environment Validation"
                  status={
                    data
                      ? data.environment.valid
                        ? "healthy"
                        : "unhealthy"
                      : "checking"
                  }
                  message={
                    data
                      ? data.environment.valid
                        ? "All required environment variables are present."
                        : `Missing: ${envMissing.join(", ")}`
                      : undefined
                  }
                />
                <StatusRow
                  label="Maintenance Worker"
                  status={
                    data
                      ? data.worker.active
                        ? "healthy"
                        : coreServicesHealthy
                          ? "degraded"
                          : "unhealthy"
                      : "checking"
                  }
                  message={data?.worker.error ?? data?.worker.message}
                  metric={data?.worker.queue}
                />
              </CardContent>
            </Card>

            <Card className="flex flex-col self-start">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wifi className="text-foreground h-5 w-5" />
                  Optional Integrations
                </CardTitle>
                <CardDescription>
                  Connectivity checks for external services that extend the
                  platform but do not block core availability.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="border-border/70 bg-muted/35 flex flex-col gap-3 rounded-xl border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="text-sm font-medium">
                      Integration summary
                    </div>
                    <div className="text-muted-foreground text-sm">
                      Separate from deployment-critical runtime checks.
                    </div>
                  </div>
                  {getStatusBadge(integrationStatus)}
                </div>
                {optionalServices.map((service) => (
                  <StatusRow
                    key={service.label}
                    label={service.label}
                    status={service.status}
                    message={service.message}
                    metric={service.metric}
                  />
                ))}
              </CardContent>
            </Card>
          </div>

          <div className="grid content-start gap-4 self-start lg:gap-6">
            <Card className="flex flex-col self-start">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShieldCheck className="text-foreground h-5 w-5" />
                  Status Guidance
                </CardTitle>
                <CardDescription>
                  What the current health state means operationally.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col gap-3 text-sm leading-6">
                {health.status === "healthy" ? (
                  <Alert>
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    <AlertTitle>All systems operational</AlertTitle>
                    <AlertDescription>
                      Core services and the background worker are healthy.
                    </AlertDescription>
                  </Alert>
                ) : null}

                {workerWarning ? (
                  <Alert>
                    <AlertCircle className="h-4 w-4 text-amber-500 dark:text-amber-400" />
                    <AlertTitle>
                      Serving traffic with reduced capability
                    </AlertTitle>
                    <AlertDescription>
                      Core dependencies are healthy, but the maintenance worker
                      is offline. Background jobs are affected.
                    </AlertDescription>
                  </Alert>
                ) : null}

                {data && !integrationsHealthy ? (
                  <Alert>
                    <AlertCircle className="h-4 w-4 text-amber-500 dark:text-amber-400" />
                    <AlertTitle>
                      Optional integrations need attention
                    </AlertTitle>
                    <AlertDescription>
                      External integrations are not fully connected. Core app
                      availability is unaffected, but related features may be
                      degraded.
                    </AlertDescription>
                  </Alert>
                ) : null}

                {health.status === "unhealthy" || health.status === "error" ? (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Core service issue detected</AlertTitle>
                    <AlertDescription>
                      One or more deployment-critical dependencies are
                      unhealthy. Requests may fail even if the web process is
                      running.
                    </AlertDescription>
                  </Alert>
                ) : null}

                <div className="border-border/70 bg-muted/40 rounded-xl border p-4">
                  <div className="font-medium">Auto-refresh</div>
                  <p className="text-muted-foreground mt-1">
                    This page refreshes every 30 seconds and can be reloaded
                    manually at any time.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="flex flex-col self-start">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ServerCog className="text-foreground h-5 w-5" />
                  Seed Status
                </CardTitle>
                <CardDescription>
                  Indicates whether foundational application data has been
                  initialized.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <SummaryCard
                  label="Initialization"
                  value={
                    data
                      ? data.seeding.initialized
                        ? "Initialized"
                        : "Not Seeded"
                      : "Pending"
                  }
                  tone={
                    !data
                      ? "neutral"
                      : data.seeding.initialized
                        ? "good"
                        : "warn"
                  }
                />
                <SummaryCard
                  label="Services"
                  value={data ? String(data.seeding.services) : "Pending"}
                  tone="neutral"
                />
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-2">
                  <SummaryCard
                    label="Org Units"
                    value={
                      data ? String(data.seeding.organizationUnits) : "Pending"
                    }
                    tone="neutral"
                  />
                  <SummaryCard
                    label="Locations"
                    value={data ? String(data.seeding.locations) : "Pending"}
                    tone="neutral"
                  />
                  <SummaryCard
                    label="Vendors"
                    value={data ? String(data.seeding.vendors) : "Pending"}
                    tone="neutral"
                  />
                  <SummaryCard
                    label="Feature Flags"
                    value={data ? String(data.seeding.featureFlags) : "Pending"}
                    tone="neutral"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="flex flex-col self-start">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="text-foreground h-5 w-5" />
                  Monitoring Notes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm leading-6">
                <p className="text-muted-foreground">
                  `/api/system-health` powers this dashboard, while
                  `/api/health` remains the lightweight probe endpoint for
                  liveness/readiness and monitoring. It returns `200` when core
                  services are healthy and `503` when they are not.
                </p>
                <p className="text-muted-foreground">
                  This `/health` page is the human-readable view layered on top
                  of that API.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
