import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { prisma } from "@/infrastructure/database/prisma/client";
import { FEATURE_FLAGS } from "@/lib/features/feature-flag-keys";
import { requireFeature } from "@/lib/features/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { requirePermission } from "@/lib/permissions/server";

export const dynamic = "force-dynamic";

const createSchema = z.object({
  event: z.string().min(1).max(80),
  emailTemplateKey: z.string().min(1).max(80),
  recipientKind: z.enum(["REQUESTER", "STEP_ASSIGNEES", "WATCHERS", "ROLE"]),
  recipientRoleId: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
});

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

  const bindings = await prisma.formNotificationBinding.findMany({
    where: { formId },
    orderBy: { createdAt: "asc" },
    include: { role: { select: { id: true, name: true } } },
  });
  return NextResponse.json({ bindings });
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ formId: string }> },
) {
  await requireFeature(FEATURE_FLAGS.WORKFLOW_ENGINE);
  await requirePermission(PERMISSIONS.WORKFLOWS_FORMS_MANAGE_NOTIFICATIONS);

  const { formId } = await context.params;

  const form = await prisma.form.findUnique({
    where: { id: formId },
    select: { id: true, isBuiltIn: true },
  });
  if (!form) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  if (form.isBuiltIn) {
    return NextResponse.json({ error: "BUILT_IN_READ_ONLY" }, { status: 403 });
  }

  const parsed = createSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "INVALID_INPUT", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const created = await prisma.formNotificationBinding.create({
    data: {
      formId,
      event: parsed.data.event,
      emailTemplateKey: parsed.data.emailTemplateKey,
      recipientKind: parsed.data.recipientKind,
      recipientRoleId: parsed.data.recipientRoleId ?? null,
      isActive: parsed.data.isActive ?? true,
    },
  });

  return NextResponse.json({ binding: created }, { status: 201 });
}
