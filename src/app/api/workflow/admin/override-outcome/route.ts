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
  requestId: z.string().min(1),
  outcome: z.enum([
    "SUCCESSFUL",
    "SUCCESSFUL_WITH_ISSUES",
    "UNSUCCESSFUL",
    "WITHDRAWN",
    "REJECTED",
    "SUPERSEDED",
    "ABANDONED",
    "EXPIRED",
  ]),
  notes: z.string().optional(),
  outcomeCodeId: z.string().optional(),
});

export async function POST(request: NextRequest) {
  await requireFeature(FEATURE_FLAGS.WORKFLOW_ENGINE);
  await requirePermission(PERMISSIONS.WORKFLOWS_REQUESTS_OVERRIDE);

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

  try {
    const engine = getContainer().get<IWorkflowEngine>(DI_TOKENS.IWorkflowEngine);
    await engine.overrideOutcome(
      parsed.data.requestId,
      parsed.data.outcome,
      actor,
      parsed.data.notes,
      parsed.data.outcomeCodeId ?? null,
    );
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof WorkflowEngineError) {
      return NextResponse.json(
        { error: error.code, message: error.message },
        { status: 400 },
      );
    }
    throw error;
  }
}
