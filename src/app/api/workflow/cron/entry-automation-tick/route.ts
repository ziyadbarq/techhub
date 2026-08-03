import { NextResponse, type NextRequest } from "next/server";

import { getContainer } from "@/di/container";
import { DI_TOKENS } from "@/di/types";
import { FEATURE_FLAGS } from "@/lib/features/feature-flag-keys";
import { isFeatureEnabled } from "@/lib/features/server";
import type {
  EntryAutomationRule,
  IEntryAutomationService,
} from "@/infrastructure/services/workflow/entry-automation.service";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const DEFAULT_RULES: EntryAutomationRule[] = [
  {
    key: "auto_cancel_old_drafts",
    description:
      "Auto-cancel any DRAFT request older than 90 days as ABANDONED",
    matcher: { status: "DRAFT", olderThanDays: 90 },
    action: { kind: "CANCEL", outcome: "ABANDONED" },
  },
];

/**
 * Runs configured entry-automation rules (e.g. auto-cancel stale drafts).
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

  const runner = getContainer().get<IEntryAutomationService>(
    DI_TOKENS.IWorkflowEntryAutomationService,
  );
  const result = await runner.runAll(DEFAULT_RULES);
  return NextResponse.json(result);
}
