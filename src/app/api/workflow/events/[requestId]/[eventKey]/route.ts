import { NextResponse, type NextRequest } from "next/server";

import { prisma } from "@/infrastructure/database/prisma/client";
import { getContainer } from "@/di/container";
import { DI_TOKENS } from "@/di/types";
import { FEATURE_FLAGS } from "@/lib/features/feature-flag-keys";
import { isFeatureEnabled } from "@/lib/features/server";
import type { IWorkflowEngine } from "@/core/repositories/workflow";
import {
  WorkflowEngineError,
  type WorkflowGraph,
} from "@/core/domain/workflow";

export const dynamic = "force-dynamic";

/**
 * Public callback for WAIT_FOR_EVENT steps. Auth = (request id + event key +
 * optional secret). External systems POST here when their async work is done.
 *
 * If the matching step is found and ACTIVE, optional payload field mappings
 * are applied, then the engine force-advances the step (system actor).
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ requestId: string; eventKey: string }> },
) {
  const { requestId, eventKey } = await context.params;

  // Engine kill-switch — return 503 JSON rather than redirecting external callers.
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

  const payload = (await request.json().catch(() => ({}))) as
    | (Record<string, unknown> & { secret?: string })
    | null;
  const secret =
    payload && typeof payload === "object" ? payload.secret : undefined;

  const req = await prisma.request.findUnique({
    where: { id: requestId },
    select: {
      id: true,
      formVersionId: true,
      workflowVersionId: true,
      status: true,
    },
  });
  if (!req) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  if (req.status === "CLOSED" || req.status === "CANCELLED") {
    return NextResponse.json({ error: "REQUEST_TERMINAL" }, { status: 409 });
  }

  // Find a WAIT_FOR_EVENT step that is currently ACTIVE on this request and
  // whose config eventKey matches.
  const wfv = await prisma.workflowVersion.findUnique({
    where: { id: req.workflowVersionId },
    select: { graphJson: true },
  });
  if (!wfv) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  const graph = wfv.graphJson as unknown as WorkflowGraph;
  const stepDef = graph.steps.find(
    (s) =>
      s.type === "WAIT_FOR_EVENT" &&
      (s.config as { eventKey?: string }).eventKey === eventKey,
  );
  if (!stepDef) {
    return NextResponse.json({ error: "EVENT_NOT_DEFINED" }, { status: 404 });
  }

  const expectedSecret = (stepDef.config as { expectedSecret?: string })
    .expectedSecret;
  if (expectedSecret && secret !== expectedSecret) {
    return NextResponse.json({ error: "INVALID_SECRET" }, { status: 403 });
  }

  const stepInstance = await prisma.stepInstance.findFirst({
    where: { requestId: req.id, stepKey: stepDef.key, status: "ACTIVE" },
    select: { id: true },
  });
  if (!stepInstance) {
    return NextResponse.json({ error: "STEP_NOT_ACTIVE" }, { status: 409 });
  }

  const mapping = (
    stepDef.config as { payloadFieldMapping?: Record<string, string> }
  ).payloadFieldMapping;
  const fieldUpdates: Record<string, unknown> = {};
  if (mapping && payload) {
    for (const [fieldKey, payloadPath] of Object.entries(mapping)) {
      fieldUpdates[fieldKey] = readPath(payload, payloadPath) ?? null;
    }
  }

  if (Object.keys(fieldUpdates).length > 0) {
    for (const [k, v] of Object.entries(fieldUpdates)) {
      await prisma.requestFieldValue.upsert({
        where: { requestId_fieldKey: { requestId: req.id, fieldKey: k } },
        update: {
          valueJson: { value: v } as object,
          formVersionId: req.formVersionId,
        },
        create: {
          requestId: req.id,
          fieldKey: k,
          formVersionId: req.formVersionId,
          valueJson: { value: v } as object,
        },
      });
    }
  }

  try {
    const engine = getContainer().get<IWorkflowEngine>(
      DI_TOKENS.IWorkflowEngine,
    );
    await engine.forceAdvance(stepInstance.id, {
      userId: null,
      system: "wait_for_event",
    });
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

function readPath(obj: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((acc, part) => {
    if (acc && typeof acc === "object")
      return (acc as Record<string, unknown>)[part];
    return undefined;
  }, obj);
}
