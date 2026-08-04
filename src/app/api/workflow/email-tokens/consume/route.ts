import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { getContainer } from "@/di/container";
import { DI_TOKENS } from "@/di/types";
import { FEATURE_FLAGS } from "@/lib/features/feature-flag-keys";
import { isFeatureEnabled } from "@/lib/features/server";
import type { IEmailActionTokenService } from "@/infrastructure/services/workflow/email-action-tokens.service";
import { WorkflowEngineError } from "@/core/domain/workflow";

export const dynamic = "force-dynamic";

const schema = z.object({
  token: z.string().min(10),
  comment: z.string().optional(),
});

/**
 * Public endpoint: anyone with a valid token can consume it. Auth is the token
 * itself (single-use, expiring, tied to a specific user/step/action).
 *
 * Engine kill-switch is checked manually (not via requireFeature) so that we
 * return a 503 JSON payload rather than redirecting an XHR caller.
 */
export async function POST(request: NextRequest) {
  const engineEnabled = await isFeatureEnabled(FEATURE_FLAGS.WORKFLOW_ENGINE);
  if (!engineEnabled) {
    return NextResponse.json(
      {
        error: "ENGINE_DISABLED",
        message:
          "The workflow engine is currently disabled. Contact an administrator to enable it.",
      },
      { status: 503 },
    );
  }

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "INVALID_INPUT", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const service = getContainer().get<IEmailActionTokenService>(
    DI_TOKENS.IWorkflowEmailActionTokenService,
  );
  try {
    await service.consume(parsed.data.token, parsed.data.comment);
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
