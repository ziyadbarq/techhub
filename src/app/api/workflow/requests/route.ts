import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { prisma } from "@/infrastructure/database/prisma/client";
import { getContainer } from "@/di/container";
import { DI_TOKENS } from "@/di/types";
import { FEATURE_FLAGS } from "@/lib/features/feature-flag-keys";
import { requireFeature } from "@/lib/features/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { requirePermission } from "@/lib/permissions/server";
import { getCurrentUserId } from "@/lib/auth/session";
import type { IWorkflowEngine } from "@/core/repositories/workflow";
import { WorkflowEngineError, type ActorContext } from "@/core/domain/workflow";

export const dynamic = "force-dynamic";

const submitSchema = z.object({
  formId: z.string().min(1),
  fieldValues: z.record(z.string(), z.unknown()),
});

export async function GET(request: NextRequest) {
  await requireFeature(FEATURE_FLAGS.WORKFLOW_ENGINE);
  await requirePermission(PERMISSIONS.WORKFLOWS_REQUESTS_VIEW);

  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const url = new URL(request.url);
  const scope = url.searchParams.get("scope") ?? "all"; // all | mine
  const status = url.searchParams.get("status"); // optional
  const limit = Math.min(Number(url.searchParams.get("limit") ?? "50"), 200);

  const requests = await prisma.request.findMany({
    where: {
      ...(scope === "mine" ? { requesterId: userId } : {}),
      ...(status ? { status: status as never } : {}),
    },
    include: {
      form: { select: { id: true, name: true } },
      requester: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return NextResponse.json({
    requests: requests.map((r) => ({
      id: r.id,
      referenceNumber: r.referenceNumber,
      status: r.status,
      outcome: r.outcome,
      createdAt: r.createdAt.toISOString(),
      submittedAt: r.submittedAt?.toISOString() ?? null,
      closedAt: r.closedAt?.toISOString() ?? null,
      form: r.form,
      requester: r.requester,
    })),
  });
}

export async function POST(request: NextRequest) {
  await requireFeature(FEATURE_FLAGS.WORKFLOW_ENGINE);
  await requirePermission(PERMISSIONS.WORKFLOWS_REQUESTS_SUBMIT);

  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const parsed = submitSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "INVALID_INPUT", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const actor: ActorContext = { userId };
  const engine = getContainer().get<IWorkflowEngine>(DI_TOKENS.IWorkflowEngine);
  try {
    const r = await engine.submit(
      { formId: parsed.data.formId, fieldValues: parsed.data.fieldValues },
      actor,
    );
    return NextResponse.json(r, { status: 201 });
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
