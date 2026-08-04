import { NextResponse, type NextRequest } from "next/server";

import { prisma } from "@/infrastructure/database/prisma/client";
import { FEATURE_FLAGS } from "@/lib/features/feature-flag-keys";
import { requireFeature } from "@/lib/features/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { requirePermission } from "@/lib/permissions/server";
import { getCurrentUserId } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

/** Publish the current DRAFT version of a form. */
export async function POST(
  _request: NextRequest,
  context: { params: Promise<{ formId: string }> },
) {
  await requireFeature(FEATURE_FLAGS.WORKFLOW_ENGINE);
  await requirePermission(PERMISSIONS.WORKFLOWS_FORMS_PUBLISH);

  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const { formId } = await context.params;

  const form = await prisma.form.findUnique({
    where: { id: formId },
    select: { id: true, publishedVersionId: true, isBuiltIn: true },
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
    return NextResponse.json({ error: "NO_DRAFT" }, { status: 409 });
  }

  // Validate: at least one field
  const schema = draft.schemaJson as { fields?: Array<{ key: string }> };
  if (!schema.fields || schema.fields.length === 0) {
    return NextResponse.json(
      {
        error: "EMPTY_FORM",
        message: "Form must have at least one field before publishing",
      },
      { status: 400 },
    );
  }
  // Field keys must be unique
  const keys = schema.fields.map((f) => f.key);
  if (new Set(keys).size !== keys.length) {
    return NextResponse.json(
      {
        error: "DUPLICATE_FIELD_KEYS",
        message: "Duplicate field keys in the form",
      },
      { status: 400 },
    );
  }

  const result2 = await prisma.$transaction(async (tx) => {
    // Archive the previously-published version (allowed transition)
    if (form.publishedVersionId) {
      await tx.formVersion.update({
        where: { id: form.publishedVersionId },
        data: { status: "ARCHIVED" },
      });
    }
    const published = await tx.formVersion.update({
      where: { id: draft.id },
      data: {
        status: "PUBLISHED",
        publishedAt: new Date(),
        publishedById: userId,
      },
    });
    await tx.form.update({
      where: { id: formId },
      data: { publishedVersionId: published.id },
    });

    // Materialize FormField rows for fast indexed reads
    const fields =
      (
        published.schemaJson as {
          fields?: Array<{
            key: string;
            label: string;
            type: string;
            required?: boolean;
            position: number;
          }>;
        }
      ).fields ?? [];
    for (const f of fields) {
      await tx.formField.upsert({
        where: {
          formVersionId_key: { formVersionId: published.id, key: f.key },
        },
        update: {
          label: f.label,
          type: f.type as never,
          required: f.required ?? false,
          position: f.position,
        },
        create: {
          formVersionId: published.id,
          key: f.key,
          label: f.label,
          type: f.type as never,
          required: f.required ?? false,
          position: f.position,
        },
      });
    }

    return published;
  });

  return NextResponse.json({ published: result2 });
}
