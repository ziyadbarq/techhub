import { NextResponse, type NextRequest } from "next/server";

import { getContainer } from "@/di/container";
import { DI_TOKENS } from "@/di/types";
import { FEATURE_FLAGS } from "@/lib/features/feature-flag-keys";
import { isFeatureEnabled } from "@/lib/features/server";
import type { ISLAEscalator } from "@/infrastructure/services/workflow/sla-escalator.service";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Scheduled cron — fires every minute via the configured scheduler.
 *
 * Auth: requires the `x-cron-secret` header to match the CRON_SECRET env var.
 * No user session or permission check (runs as system).
 *
 * Skips work entirely if the WORKFLOW_ENGINE feature flag is off.
 */
export async function POST(request: NextRequest) {
  const secret = request.headers.get("x-cron-secret");
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const enabled = await isFeatureEnabled(FEATURE_FLAGS.WORKFLOW_ENGINE);
  if (!enabled) {
    return NextResponse.json({ skipped: "ENGINE_DISABLED" }, { status: 200 });
  }

  const escalator = getContainer().get<ISLAEscalator>(
    DI_TOKENS.IWorkflowSLAEscalator,
  );
  const result = await escalator.tick();
  return NextResponse.json({
    scanned: result.scanned,
    fired: result.fired,
    skipped: result.skipped,
    errors: result.errors,
  });
}
