import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { prisma } from "@/infrastructure/database/prisma/client";
import { FEATURE_FLAGS } from "@/lib/features/feature-flag-keys";
import { requireFeature } from "@/lib/features/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { requirePermission } from "@/lib/permissions/server";

export const dynamic = "force-dynamic";

const updateSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  description: z.string().nullable().optional(),
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
    include: {
      versions: {
        orderBy: { versionNumber: "desc" },
        select: {
          id: true,
          versionNumber: true,
          status: true,
          publishedAt: true,
          createdAt: true,
        },
      },
      forms: { select: { id: true, name: true } },
    },
  });

  if (!def) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  return NextResponse.json({ definition: def });
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ workflowId: string }> },
) {
  await requireFeature(FEATURE_FLAGS.WORKFLOW_ENGINE);
  await requirePermission(PERMISSIONS.WORKFLOWS_DEFINITIONS_UPDATE);

  const { workflowId } = await context.params;

  const parsed = updateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "INVALID_INPUT", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const existing = await prisma.workflowDefinition.findUnique({
    where: { id: workflowId },
    select: { id: true, isBuiltIn: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }
  if (existing.isBuiltIn) {
    return NextResponse.json(
      {
        error: "BUILT_IN_READ_ONLY",
        message: "Built-in workflows cannot be modified.",
      },
      { status: 403 },
    );
  }

  const def = await prisma.workflowDefinition.update({
    where: { id: workflowId },
    data: parsed.data,
  });
  return NextResponse.json({ definition: def });
}
