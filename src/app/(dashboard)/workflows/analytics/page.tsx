import { AnimatedCount, Card } from "@/components/design";
import { prisma } from "@/infrastructure/database/prisma/client";
import { FEATURE_FLAGS } from "@/lib/features/feature-flag-keys";
import { requireFeature } from "@/lib/features/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { requirePermission } from "@/lib/permissions/server";

import { AnalyticsCharts } from "./analytics-charts";

export const dynamic = "force-dynamic";

const DAYS_BACK = 30;

export default async function AnalyticsPage() {
  await requireFeature(FEATURE_FLAGS.WORKFLOW_ENGINE);
  await requirePermission(PERMISSIONS.WORKFLOWS_ANALYTICS_VIEW);

  const since = new Date(Date.now() - DAYS_BACK * 86_400_000);

  const [byStatus, byOutcome, byForm, recent, recentClosed] = await Promise.all(
    [
      prisma.request.groupBy({
        by: ["status"],
        _count: { _all: true },
      }),
      prisma.request.groupBy({
        by: ["outcome"],
        where: {
          outcome: { not: null },
        },
        _count: { _all: true },
      }),
      prisma.request.groupBy({
        by: ["formId"],
        where: { createdAt: { gte: since } },
        _count: { _all: true },
      }),
      prisma.request.findMany({
        where: { createdAt: { gte: since } },
        select: { id: true, createdAt: true, status: true },
        orderBy: { createdAt: "asc" },
      }),
      prisma.request.findMany({
        where: {
          closedAt: { not: null, gte: since },
        },
        select: { submittedAt: true, closedAt: true, outcome: true },
      }),
    ],
  );

  const formNames = await prisma.form.findMany({
    where: { id: { in: byForm.map((g) => g.formId) } },
    select: { id: true, name: true },
  });
  const nameById = new Map(formNames.map((f) => [f.id, f.name]));

  const statusData = byStatus
    .map((g) => ({ name: g.status, value: g._count._all }))
    .sort((a, b) => b.value - a.value);

  const outcomeData = byOutcome
    .map((g) => ({ name: String(g.outcome), value: g._count._all }))
    .sort((a, b) => b.value - a.value);

  const formData = byForm
    .map((g) => ({
      name: nameById.get(g.formId) ?? g.formId.slice(0, 8),
      value: g._count._all,
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  // Per-day buckets — separate "submitted" from "closed" so the trend
  // chart can show two series.
  const dayKeys: string[] = [];
  for (let i = DAYS_BACK - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86_400_000);
    dayKeys.push(d.toISOString().slice(0, 10));
  }
  const submittedByDay: Record<string, number> = Object.fromEntries(
    dayKeys.map((k) => [k, 0]),
  );
  const closedByDay: Record<string, number> = Object.fromEntries(
    dayKeys.map((k) => [k, 0]),
  );
  for (const r of recent) {
    const key = r.createdAt.toISOString().slice(0, 10);
    if (key in submittedByDay) submittedByDay[key]!++;
  }
  for (const r of recentClosed) {
    const at = r.closedAt;
    if (!at) continue;
    const key = at.toISOString().slice(0, 10);
    if (key in closedByDay) closedByDay[key]!++;
  }

  const trendData = dayKeys.map((day) => ({
    day: day.slice(5),
    submitted: submittedByDay[day] ?? 0,
    closed: closedByDay[day] ?? 0,
  }));

  const totalRequests = byStatus.reduce((sum, g) => sum + g._count._all, 0);
  const closed = byStatus.find((g) => g.status === "CLOSED")?._count._all ?? 0;
  const cancelled =
    byStatus.find((g) => g.status === "CANCELLED")?._count._all ?? 0;
  const open = totalRequests - closed - cancelled;
  const onHold = byStatus.find((g) => g.status === "ON_HOLD")?._count._all ?? 0;

  const cycleSamples: number[] = [];
  let successful = 0;
  for (const r of recentClosed) {
    if (r.outcome === "SUCCESSFUL") successful++;
    if (r.submittedAt && r.closedAt) {
      cycleSamples.push(r.closedAt.getTime() - r.submittedAt.getTime());
    }
  }
  const avgCycleMs =
    cycleSamples.length > 0
      ? cycleSamples.reduce((a, b) => a + b, 0) / cycleSamples.length
      : 0;
  const avgCycleHours = avgCycleMs / 3_600_000;
  const successRate =
    recentClosed.length > 0
      ? Math.round((successful / recentClosed.length) * 100)
      : 0;

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <span className="text-micro-uppercase text-stone">Analytics</span>
        <h1 className="text-h2">Workflow analytics</h1>
        <p className="text-subtitle text-slate">
          Last {DAYS_BACK} days · <AnimatedCount value={totalRequests} /> total
          requests in this organization.
        </p>
      </header>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
        <Stat label="Open" value={open} tone="yellow" />
        <Stat label="On hold" value={onHold} tone="blush" />
        <Stat label="Closed" value={closed} tone="mint" />
        <Stat label="Cancelled" value={cancelled} tone="sand" />
        <Stat
          label="Success rate"
          value={successRate}
          suffix="%"
          tone="lavender"
        />
      </div>

      {recentClosed.length > 0 ? (
        <Card className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <span className="text-micro-uppercase text-stone">
              Avg cycle time (last {DAYS_BACK} days)
            </span>
            <p className="text-h3 text-ink mt-2">
              {avgCycleHours < 1 ? (
                <>
                  <AnimatedCount value={Math.round(avgCycleMs / 60_000)} />{" "}
                  <span className="text-body-md text-stone">min</span>
                </>
              ) : avgCycleHours < 24 ? (
                <>
                  <AnimatedCount value={Math.round(avgCycleHours * 10) / 10} />{" "}
                  <span className="text-body-md text-stone">hours</span>
                </>
              ) : (
                <>
                  <AnimatedCount
                    value={Math.round((avgCycleHours / 24) * 10) / 10}
                  />{" "}
                  <span className="text-body-md text-stone">days</span>
                </>
              )}
            </p>
            <p className="text-caption text-stone">
              Across {recentClosed.length} closed/cancelled request
              {recentClosed.length === 1 ? "" : "s"}.
            </p>
          </div>
          <div>
            <span className="text-micro-uppercase text-stone">
              Closed vs cancelled
            </span>
            <p className="text-h3 text-ink mt-2">
              <AnimatedCount value={closed} />{" "}
              <span className="text-body-md text-stone">closed</span>{" "}
              <span className="text-stone mx-1">·</span>
              <AnimatedCount value={cancelled} />{" "}
              <span className="text-body-md text-stone">cancelled</span>
            </p>
            <p className="text-caption text-stone">All-time totals.</p>
          </div>
        </Card>
      ) : null}

      <AnalyticsCharts
        statusData={statusData}
        outcomeData={outcomeData}
        formData={formData}
        trendData={trendData}
      />
    </div>
  );
}

const STAT_TONES: Record<string, { card: string; label: string }> = {
  yellow: {
    card: "bg-[var(--color-yellow-light)]",
    label: "text-[var(--color-yellow-dark)]",
  },
  mint: {
    card: "bg-[var(--color-mint-light)]",
    label: "text-[var(--color-moss-dark)]",
  },
  blush: {
    card: "bg-[var(--color-blush-light)]",
    label: "text-[var(--color-coral-dark)]",
  },
  sand: {
    card: "bg-[var(--color-sand-light)]",
    label: "text-[var(--color-charcoal)]",
  },
  lavender: {
    card: "bg-[var(--color-surface-featured)]",
    label: "text-[var(--color-ink-deep)]",
  },
  white: {
    card: "bg-[var(--color-canvas)]",
    label: "text-[var(--color-stone)]",
  },
};

function Stat({
  label,
  value,
  suffix,
  tone = "white",
}: {
  label: string;
  value: number;
  suffix?: string;
  tone?: keyof typeof STAT_TONES;
}) {
  const t = STAT_TONES[tone] ?? STAT_TONES.white;
  return (
    <div className={`rounded-xl ${t.card} p-4`}>
      <span className={`text-micro-uppercase ${t.label}`}>{label}</span>
      <p className="text-h3 text-ink mt-2">
        <AnimatedCount value={value} />
        {suffix ? (
          <span className="text-body-md text-stone">{suffix}</span>
        ) : null}
      </p>
    </div>
  );
}
