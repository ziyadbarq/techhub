import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { getContainer } from "@/di/container";
import { DI_TOKENS } from "@/di/types";
import { FEATURE_FLAGS } from "@/lib/features/feature-flag-keys";
import { requireFeature } from "@/lib/features/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { requirePermission } from "@/lib/permissions/server";
import { getCurrentUserId } from "@/lib/auth/session";
import type { IWorkflowEngine } from "@/core/repositories/workflow";
import {
  WorkflowEngineError,
  type ActorContext,
} from "@/core/domain/workflow";

export const dynamic = "force-dynamic";

const schema = z.object({
  requestIds: z.array(z.string().min(1)).min(1).max(200),
  outcome: z
    .enum(["WITHDRAWN", "REJECTED", "SUPERSEDED", "ABANDONED", "EXPIRED"])
    .default("WITHDRAWN"),
  note: z.string().min(1, "Notes are required when cancelling (PRD §10.2)"),
});

export async function POST(request: NextRequest) {
  await requireFeature(FEATURE_FLAGS.WORKFLOW_ENGINE);
  await requirePermission(PERMISSIONS.WORKFLOWS_REQUESTS_CANCEL);

  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "INVALID_INPUT", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const actor: ActorContext = { userId };
  const engine = getContainer().get<IWorkflowEngine>(DI_TOKENS.IWorkflowEngine);
  const results: Array<{ requestId: string; ok: boolean; error?: string }> = [];

  for (const id of parsed.data.requestIds) {
    try {
      await engine.cancel(id, parsed.data.outcome, parsed.data.note, actor);
      results.push({ requestId: id, ok: true });
    } catch (error) {
      const message =
        error instanceof WorkflowEngineError
          ? error.message
          : error instanceof Error
            ? error.message
            : String(error);
      results.push({ requestId: id, ok: false, error: message });
    }
  }

  const succeeded = results.filter((r) => r.ok).length;
  return NextResponse.json({
    total: results.length,
    succeeded,
    failed: results.length - succeeded,
    results,
  });
}
