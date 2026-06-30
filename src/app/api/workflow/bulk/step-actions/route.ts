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
  stepInstanceIds: z.array(z.string().min(1)).min(1).max(200),
  action: z.enum(["APPROVE", "REJECT", "COMPLETE", "ACKNOWLEDGE"]),
  comment: z.string().optional(),
});

/**
 * Bulk take-action: runs engine.takeAction once per step instance, in series,
 * each in its own transaction. One audit entry per request (the engine writes
 * it). Returns per-id success/failure so partial outcomes are visible.
 */
export async function POST(request: NextRequest) {
  await requireFeature(FEATURE_FLAGS.WORKFLOW_ENGINE);
  await requirePermission(PERMISSIONS.WORKFLOWS_REQUESTS_ACT);

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
  const results: Array<{
    stepInstanceId: string;
    ok: boolean;
    error?: string;
  }> = [];

  for (const id of parsed.data.stepInstanceIds) {
    try {
      await engine.takeAction(
        {
          stepInstanceId: id,
          action: parsed.data.action,
          comment: parsed.data.comment,
        },
        actor,
      );
      results.push({ stepInstanceId: id, ok: true });
    } catch (error) {
      const message =
        error instanceof WorkflowEngineError
          ? error.message
          : error instanceof Error
            ? error.message
            : String(error);
      results.push({ stepInstanceId: id, ok: false, error: message });
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
