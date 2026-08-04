import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { prisma } from "@/infrastructure/database/prisma/client";
import { FEATURE_FLAGS } from "@/lib/features/feature-flag-keys";
import { requireFeature } from "@/lib/features/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { requirePermission } from "@/lib/permissions/server";

export const dynamic = "force-dynamic";

const createSchema = z.object({
  name: z.string().min(1).max(120),
  description: z.string().optional(),
});

export async function GET() {
  await requireFeature(FEATURE_FLAGS.WORKFLOW_ENGINE);
  await requirePermission(PERMISSIONS.WORKFLOWS_DEFINITIONS_VIEW);

  const definitions = await prisma.workflowDefinition.findMany({
    include: {
      publishedVersion: {
        select: { id: true, versionNumber: true, publishedAt: true },
      },
      _count: { select: { versions: true, forms: true } },
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json({
    definitions: definitions.map((d) => ({
      id: d.id,
      name: d.name,
      description: d.description,
      publishedVersion: d.publishedVersion,
      versionCount: d._count.versions,
      formCount: d._count.forms,
      updatedAt: d.updatedAt.toISOString(),
    })),
  });
}

export async function POST(request: NextRequest) {
  await requireFeature(FEATURE_FLAGS.WORKFLOW_ENGINE);
  await requirePermission(PERMISSIONS.WORKFLOWS_DEFINITIONS_CREATE);

  const parsed = createSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "INVALID_INPUT", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const def = await prisma.workflowDefinition.create({
    data: {
      name: parsed.data.name,
      description: parsed.data.description ?? null,
    },
  });

  const draft = await prisma.workflowVersion.create({
    data: {
      workflowDefinitionId: def.id,
      versionNumber: 1,
      status: "DRAFT",
      graphJson: { start: "", steps: [] } as object,
    },
  });

  return NextResponse.json(
    { definition: def, draftVersionId: draft.id },
    { status: 201 },
  );
}
