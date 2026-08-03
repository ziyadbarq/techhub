import { NextResponse, type NextRequest } from "next/server";

import { getContainer } from "@/di/container";
import { DI_TOKENS } from "@/di/types";
import { FEATURE_FLAGS } from "@/lib/features/feature-flag-keys";
import { isFeatureEnabled } from "@/lib/features/server";
import type { IScheduleTickService } from "@/infrastructure/services/workflow/schedule-tick.service";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Auto-completes any ACTIVE SCHEDULE step whose `scheduledFor` time has passed.
 *
 * Auth: requires the `x-cron-secret` header to match the CRON_SECRET env var.
 * No user session or permission check (runs as system).
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

  const runner = getContainer().get<IScheduleTickService>(
    DI_TOKENS.IWorkflowScheduleTickService,
  );
  const result = await runner.tick();
  return NextResponse.json(result);
}
