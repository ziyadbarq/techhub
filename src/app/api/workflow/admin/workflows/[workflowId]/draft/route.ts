import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { prisma } from "@/infrastructure/database/prisma/client";
import { FEATURE_FLAGS } from "@/lib/features/feature-flag-keys";
import { requireFeature } from "@/lib/features/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { requirePermission } from "@/lib/permissions/server";
import type { Prisma } from "@/generated/prisma";

export const dynamic = "force-dynamic";

const stepSchema = z.object({
  key: z
    .string()
    .min(1)
    .max(80)
    .regex(/^[a-z0-9_]+$/i),
  type: z.enum([
    "APPROVAL",
    "EXECUTION",
    "INFO_ACK",
    "AUTOMATION",
    "NOTIFICATION",
    "CONDITIONAL_BRANCH",
    "DELAY",
    "SCHEDULE",
    "WEBHOOK",
    "SUB_WORKFLOW",
  ]),
  position: z.number().int(),
  next: z
    .union([
      z.object({ default: z.string() }),
      z.object({ onAction: z.record(z.string(), z.string()) }),
    ])
    .optional(),
  config: z.record(z.string(), z.unknown()),
});

const draftSchema = z.object({
  start: z.string(),
  steps: z.array(stepSchema),
});

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ workflowId: string }> },
) {
  await requireFeature(FEATURE_FLAGS.WORKFLOW_ENGINE);
  await requirePermission(PERMISSIONS.WORKFLOWS_DEFINITIONS_VIEW);

  const { workflowId } = await context.params;

  const def = await prisma.workflowDefinition.findUnique({
    where: { id: workflowId },
    select: { id: true },
  });
  if (!def) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  let draft = await prisma.workflowVersion.findFirst({
    where: { workflowDefinitionId: workflowId, status: "DRAFT" },
    orderBy: { versionNumber: "desc" },
  });

  if (!draft) {
    const latest = await prisma.workflowVersion.findFirst({
      where: { workflowDefinitionId: workflowId },
      orderBy: { versionNumber: "desc" },
    });
    const next = (latest?.versionNumber ?? 0) + 1;
    draft = await prisma.workflowVersion.create({
      data: {
        workflowDefinitionId: workflowId,
        versionNumber: next,
        status: "DRAFT",
        graphJson: (latest?.graphJson ?? { start: "", steps: [] }) as object,
      },
    });
  }

  return NextResponse.json({ draft });
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ workflowId: string }> },
) {
  await requireFeature(FEATURE_FLAGS.WORKFLOW_ENGINE);
  await requirePermission(PERMISSIONS.WORKFLOWS_DEFINITIONS_UPDATE);

  const { workflowId } = await context.params;

  const parsed = draftSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "INVALID_INPUT", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const def = await prisma.workflowDefinition.findUnique({
    where: { id: workflowId },
    select: { id: true, isBuiltIn: true },
  });
  if (!def) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  if (def.isBuiltIn) {
    return NextResponse.json(
      {
        error: "BUILT_IN_READ_ONLY",
        message: "Built-in workflows cannot be modified.",
      },
      { status: 403 },
    );
  }

  const draft = await prisma.workflowVersion.findFirst({
    where: { workflowDefinitionId: workflowId, status: "DRAFT" },
    orderBy: { versionNumber: "desc" },
  });
  if (!draft) {
    return NextResponse.json({ error: "NO_DRAFT_VERSION" }, { status: 409 });
  }

  const updated = await prisma.workflowVersion.update({
    where: { id: draft.id },
    data: { graphJson: parsed.data as unknown as Prisma.InputJsonValue },
  });

  return NextResponse.json({ draft: updated });
}
