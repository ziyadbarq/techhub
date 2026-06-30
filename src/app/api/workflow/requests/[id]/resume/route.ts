import { NextResponse, type NextRequest } from "next/server";

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

export async function POST(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  await requireFeature(FEATURE_FLAGS.WORKFLOW_ENGINE);
  await requirePermission(PERMISSIONS.WORKFLOWS_REQUESTS_HOLD);

  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const { id } = await context.params;

  const actor: ActorContext = { userId };

  try {
    const engine = getContainer().get<IWorkflowEngine>(
      DI_TOKENS.IWorkflowEngine,
    );
    await engine.resume(id, actor);
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
