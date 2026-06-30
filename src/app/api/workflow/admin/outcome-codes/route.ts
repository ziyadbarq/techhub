import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { prisma } from "@/infrastructure/database/prisma/client";
import { FEATURE_FLAGS } from "@/lib/features/feature-flag-keys";
import { requireFeature } from "@/lib/features/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { requirePermission } from "@/lib/permissions/server";

export const dynamic = "force-dynamic";

const ALL_OUTCOMES = [
  "SUCCESSFUL",
  "SUCCESSFUL_WITH_ISSUES",
  "UNSUCCESSFUL",
  "WITHDRAWN",
  "REJECTED",
  "SUPERSEDED",
  "ABANDONED",
  "EXPIRED",
] as const;

const createSchema = z.object({
  key: z
    .string()
    .min(1)
    .max(80)
    .regex(/^[A-Z0-9_]+$/, "Use SCREAMING_SNAKE_CASE"),
  label: z.string().min(1).max(200),
  description: z.string().optional(),
  genericOutcome: z.enum(ALL_OUTCOMES),
  formId: z.string().optional(),
});

export async function GET() {
  await requireFeature(FEATURE_FLAGS.WORKFLOW_ENGINE);
  await requirePermission(PERMISSIONS.WORKFLOWS_OUTCOME_CODES_MANAGE);

  const codes = await prisma.outcomeCode.findMany({
    include: { form: { select: { id: true, name: true } } },
    orderBy: { key: "asc" },
  });
  return NextResponse.json({ codes });
}

export async function POST(request: NextRequest) {
  await requireFeature(FEATURE_FLAGS.WORKFLOW_ENGINE);
  await requirePermission(PERMISSIONS.WORKFLOWS_OUTCOME_CODES_MANAGE);

  const parsed = createSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "INVALID_INPUT", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  if (parsed.data.formId) {
    const form = await prisma.form.findUnique({
      where: { id: parsed.data.formId },
      select: { id: true },
    });
    if (!form) {
      return NextResponse.json({ error: "FORM_NOT_FOUND" }, { status: 400 });
    }
  }

  const created = await prisma.outcomeCode.create({
    data: {
      key: parsed.data.key,
      label: parsed.data.label,
      description: parsed.data.description ?? null,
      genericOutcome: parsed.data.genericOutcome,
      formId: parsed.data.formId ?? null,
    },
  });
  return NextResponse.json({ code: created }, { status: 201 });
}
