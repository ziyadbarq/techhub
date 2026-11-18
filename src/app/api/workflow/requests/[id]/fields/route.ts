/**
 * POST /api/workflow/requests/[id]/fields
 *
 * A form manager (or owner) corrects field values of a submitted request.
 * Who may is decided by the engine from the form's people (Form → People);
 * the change is audited with the previous values.
 */

import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { getContainer } from "@/di/container";
import { DI_TOKENS } from "@/di/types";
import { FEATURE_FLAGS } from "@/lib/features/feature-flag-keys";
import { requireFeature } from "@/lib/features/server";
import { getCurrentUserId } from "@/lib/auth/session";
import type { IWorkflowEngine } from "@/core/repositories/workflow";
import { WorkflowEngineError } from "@/core/domain/workflow";

export const dynamic = "force-dynamic";

const schema = z.object({
  updates: z.record(z.string(), z.unknown()),
});

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  await requireFeature(FEATURE_FLAGS.WORKFLOW_ENGINE);

  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const { id } = await context.params;
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "INVALID_INPUT", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const engine = getContainer().get<IWorkflowEngine>(DI_TOKENS.IWorkflowEngine);
  try {
    await engine.correctFields(id, parsed.data.updates, { userId });
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof WorkflowEngineError) {
      return NextResponse.json(
        { error: error.code, message: error.message },
        { status: error.code === "NOT_FOUND" ? 404 : 400 },
      );
    }
    throw error;
  }
}
