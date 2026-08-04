import { NextResponse } from "next/server";

import { prisma } from "@/infrastructure/database/prisma/client";
import { FEATURE_FLAGS } from "@/lib/features/feature-flag-keys";
import { requireFeature } from "@/lib/features/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { requirePermission } from "@/lib/permissions/server";

export const dynamic = "force-dynamic";

export async function GET() {
  await requireFeature(FEATURE_FLAGS.WORKFLOW_ENGINE);
  await requirePermission(PERMISSIONS.WORKFLOWS_FORMS_VIEW);

  const forms = await prisma.form.findMany({
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      description: true,
      referenceNumberFormat: true,
      publishedVersionId: true,
      updatedAt: true,
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json({
    forms: forms.map((f) => ({
      id: f.id,
      name: f.name,
      description: f.description,
      referenceNumberFormat: f.referenceNumberFormat,
      hasPublishedVersion: f.publishedVersionId !== null,
      updatedAt: f.updatedAt.toISOString(),
    })),
  });
}
