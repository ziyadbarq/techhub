import { NextResponse } from "next/server";

import { prisma } from "@/infrastructure/database/prisma/client";
import { FEATURE_FLAGS } from "@/lib/features/feature-flag-keys";
import { requireFeature } from "@/lib/features/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { requirePermission } from "@/lib/permissions/server";

export const dynamic = "force-dynamic";

/**
 * Workflow-instance metrics. Returns:
 *  - status counts
 *  - average time-in-step (per stepKey, completed instances only)
 *  - SLA breach counts (firedAt within last 30 days)
 */
export async function GET() {
  await requireFeature(FEATURE_FLAGS.WORKFLOW_ENGINE);
  await requirePermission(PERMISSIONS.WORKFLOWS_ANALYTICS_VIEW);

  // Status counts via groupBy
  const statusGroups = await prisma.request.groupBy({
    by: ["status"],
    _count: { _all: true },
  });
  const statusCounts: Record<string, number> = {};
  for (const g of statusGroups) statusCounts[g.status] = g._count._all;

  // Outcome counts (CLOSED only)
  const outcomeGroups = await prisma.request.groupBy({
    by: ["outcome"],
    where: { status: "CLOSED", outcome: { not: null } },
    _count: { _all: true },
  });
  const outcomeCounts: Record<string, number> = {};
  for (const g of outcomeGroups) {
    if (g.outcome) outcomeCounts[g.outcome] = g._count._all;
  }

  // Time in step (completed step instances): avg ms from activatedAt to completedAt
  const completed = await prisma.stepInstance.findMany({
    where: {
      status: "COMPLETED",
      activatedAt: { not: null },
      completedAt: { not: null },
    },
    select: { stepKey: true, activatedAt: true, completedAt: true },
    take: 1000,
  });
  const stepStats = new Map<string, { totalMs: number; count: number }>();
  for (const s of completed) {
    if (!s.activatedAt || !s.completedAt) continue;
    const dur = s.completedAt.getTime() - s.activatedAt.getTime();
    const cur = stepStats.get(s.stepKey) ?? { totalMs: 0, count: 0 };
    cur.totalMs += dur;
    cur.count += 1;
    stepStats.set(s.stepKey, cur);
  }
  const timeInStepMs: Record<string, { avgMs: number; count: number }> = {};
  for (const [key, val] of stepStats) {
    timeInStepMs[key] = {
      avgMs: Math.round(val.totalMs / val.count),
      count: val.count,
    };
  }

  // SLA breaches in the last 30 days
  const since = new Date(Date.now() - 30 * 86_400_000);
  const breaches = await prisma.sLAEscalationLog.count({
    where: {
      firedAt: { gte: since },
    },
  });

  return NextResponse.json({
    statusCounts,
    outcomeCounts,
    timeInStepMs,
    slaBreachesLast30d: breaches,
  });
}
