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
  workflowDefinitionId: z.string().min(1),
  referenceNumberFormat: z.string().optional(),
});

export async function GET() {
  await requireFeature(FEATURE_FLAGS.WORKFLOW_ENGINE);
  await requirePermission(PERMISSIONS.WORKFLOWS_FORMS_VIEW);

  const forms = await prisma.form.findMany({
    include: {
      workflowDefinition: { select: { id: true, name: true } },
      publishedVersion: {
        select: { id: true, versionNumber: true, publishedAt: true },
      },
      _count: { select: { versions: true, requests: true } },
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json({
    forms: forms.map((f) => ({
      id: f.id,
      name: f.name,
      description: f.description,
      isActive: f.isActive,
      referenceNumberFormat: f.referenceNumberFormat,
      workflowDefinition: f.workflowDefinition,
      publishedVersion: f.publishedVersion,
      versionCount: f._count.versions,
      requestCount: f._count.requests,
      updatedAt: f.updatedAt.toISOString(),
    })),
  });
}

export async function POST(request: NextRequest) {
  await requireFeature(FEATURE_FLAGS.WORKFLOW_ENGINE);
  await requirePermission(PERMISSIONS.WORKFLOWS_FORMS_CREATE);

  const parsed = createSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "INVALID_INPUT", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  // Verify the workflow definition exists.
  const wf = await prisma.workflowDefinition.findUnique({
    where: { id: parsed.data.workflowDefinitionId },
    select: { id: true },
  });
  if (!wf) {
    return NextResponse.json({ error: "WORKFLOW_NOT_FOUND" }, { status: 400 });
  }

  const form = await prisma.form.create({
    data: {
      name: parsed.data.name,
      description: parsed.data.description ?? null,
      workflowDefinitionId: parsed.data.workflowDefinitionId,
      referenceNumberFormat:
        parsed.data.referenceNumberFormat ?? "REQ-{YYYY}-{seq:04}",
    },
  });

  // Create an initial DRAFT version with empty schema
  const draft = await prisma.formVersion.create({
    data: {
      formId: form.id,
      versionNumber: 1,
      status: "DRAFT",
      schemaJson: { fields: [] } as object,
    },
  });

  return NextResponse.json({ form, draftVersionId: draft.id }, { status: 201 });
}
