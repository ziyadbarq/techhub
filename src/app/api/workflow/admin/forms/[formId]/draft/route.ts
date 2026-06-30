import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { prisma } from "@/infrastructure/database/prisma/client";
import { FEATURE_FLAGS } from "@/lib/features/feature-flag-keys";
import { requireFeature } from "@/lib/features/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { requirePermission } from "@/lib/permissions/server";
import type { Prisma } from "@/generated/prisma";

export const dynamic = "force-dynamic";

const fieldSchema = z.object({
  key: z
    .string()
    .min(1)
    .max(80)
    .regex(/^[a-z0-9_]+$/i, "Field key must be alphanumeric/underscore"),
  label: z.string().min(1).max(200),
  type: z.string().min(1),
  required: z.boolean().optional(),
  position: z.number().int(),
  config: z.record(z.string(), z.unknown()).optional(),
  visibilityRules: z.unknown().optional(),
  computedFormula: z.unknown().optional(),
  visibility: z.enum(["VISIBLE", "HIDDEN", "ADMINISTRATIVE"]).optional(),
});

const draftSchema = z.object({
  fields: z.array(fieldSchema),
  perStepFieldState: z
    .record(
      z.string(),
      z.record(z.string(), z.enum(["EDITABLE", "READ_ONLY", "HIDDEN"])),
    )
    .optional(),
});

/** GET the current draft version (latest non-PUBLISHED) — creating one if all are published. */
export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ formId: string }> },
) {
  await requireFeature(FEATURE_FLAGS.WORKFLOW_ENGINE);
  await requirePermission(PERMISSIONS.WORKFLOWS_FORMS_VIEW);

  const { formId } = await context.params;

  const form = await prisma.form.findUnique({
    where: { id: formId },
    select: { id: true },
  });
  if (!form) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  let draft = await prisma.formVersion.findFirst({
    where: { formId, status: "DRAFT" },
    orderBy: { versionNumber: "desc" },
  });

  if (!draft) {
    // Bootstrap a new draft from the latest published version's content.
    const latest = await prisma.formVersion.findFirst({
      where: { formId },
      orderBy: { versionNumber: "desc" },
    });
    const next = (latest?.versionNumber ?? 0) + 1;
    draft = await prisma.formVersion.create({
      data: {
        formId,
        versionNumber: next,
        status: "DRAFT",
        schemaJson: (latest?.schemaJson ?? { fields: [] }) as object,
      },
    });
  }

  return NextResponse.json({ draft });
}

/** Save the current draft schema. */
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ formId: string }> },
) {
  await requireFeature(FEATURE_FLAGS.WORKFLOW_ENGINE);
  await requirePermission(PERMISSIONS.WORKFLOWS_FORMS_UPDATE);

  const { formId } = await context.params;

  const parsed = draftSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "INVALID_INPUT", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const form = await prisma.form.findUnique({
    where: { id: formId },
    select: { id: true, isBuiltIn: true },
  });
  if (!form) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  if (form.isBuiltIn) {
    return NextResponse.json(
      {
        error: "BUILT_IN_READ_ONLY",
        message: "Built-in forms cannot be modified.",
      },
      { status: 403 },
    );
  }

  const draft = await prisma.formVersion.findFirst({
    where: { formId, status: "DRAFT" },
    orderBy: { versionNumber: "desc" },
  });
  if (!draft) {
    return NextResponse.json(
      {
        error: "NO_DRAFT_VERSION",
        message:
          "Open the editor with GET /draft first to create a draft",
      },
      { status: 409 },
    );
  }

  const updated = await prisma.formVersion.update({
    where: { id: draft.id },
    data: { schemaJson: parsed.data as unknown as Prisma.InputJsonValue },
  });

  return NextResponse.json({ draft: updated });
}
