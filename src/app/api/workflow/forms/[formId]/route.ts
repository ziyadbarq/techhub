import { NextResponse, type NextRequest } from "next/server";

import { prisma } from "@/infrastructure/database/prisma/client";
import { FEATURE_FLAGS } from "@/lib/features/feature-flag-keys";
import { requireFeature } from "@/lib/features/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { requirePermission } from "@/lib/permissions/server";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ formId: string }> },
) {
  await requireFeature(FEATURE_FLAGS.WORKFLOW_ENGINE);
  await requirePermission(PERMISSIONS.WORKFLOWS_FORMS_VIEW);

  const { formId } = await context.params;

  const form = await prisma.form.findUnique({
    where: { id: formId },
    select: {
      id: true,
      name: true,
      description: true,
      referenceNumberFormat: true,
      isActive: true,
      publishedVersionId: true,
      workflowDefinitionId: true,
    },
  });

  if (!form) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  if (!form.publishedVersionId) {
    return NextResponse.json({ error: "FORM_NOT_PUBLISHED" }, { status: 409 });
  }

  const version = await prisma.formVersion.findUnique({
    where: { id: form.publishedVersionId },
    select: {
      id: true,
      versionNumber: true,
      schemaJson: true,
      publishedAt: true,
    },
  });

  return NextResponse.json({
    form: {
      id: form.id,
      name: form.name,
      description: form.description,
      isActive: form.isActive,
      referenceNumberFormat: form.referenceNumberFormat,
      workflowDefinitionId: form.workflowDefinitionId,
    },
    version,
  });
}
