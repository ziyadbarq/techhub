import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { prisma } from "@/infrastructure/database/prisma/client";
import { FEATURE_FLAGS } from "@/lib/features/feature-flag-keys";
import { requireFeature } from "@/lib/features/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { requirePermission } from "@/lib/permissions/server";

export const dynamic = "force-dynamic";

const patchSchema = z.object({
  emailTemplateKey: z.string().optional(),
  recipientKind: z
    .enum(["REQUESTER", "STEP_ASSIGNEES", "WATCHERS", "ROLE"])
    .optional(),
  recipientRoleId: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
  event: z.string().optional(),
});

type AuthResult =
  | { ok: true }
  | { ok: false; response: NextResponse };

async function authorise(formId: string, bindingId: string): Promise<AuthResult> {
  await requireFeature(FEATURE_FLAGS.WORKFLOW_ENGINE);
  await requirePermission(PERMISSIONS.WORKFLOWS_FORMS_MANAGE_NOTIFICATIONS);

  const form = await prisma.form.findUnique({
    where: { id: formId },
    select: { id: true, isBuiltIn: true },
  });
  if (!form) {
    return {
      ok: false,
      response: NextResponse.json({ error: "NOT_FOUND" }, { status: 404 }),
    };
  }
  if (form.isBuiltIn) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "BUILT_IN_READ_ONLY" },
        { status: 403 },
      ),
    };
  }
  const binding = await prisma.formNotificationBinding.findFirst({
    where: { id: bindingId, formId },
    select: { id: true },
  });
  if (!binding) {
    return {
      ok: false,
      response: NextResponse.json({ error: "NOT_FOUND" }, { status: 404 }),
    };
  }
  return { ok: true };
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ formId: string; bindingId: string }> },
) {
  const { formId, bindingId } = await context.params;
  const auth = await authorise(formId, bindingId);
  if (!auth.ok) return auth.response;

  const parsed = patchSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "INVALID_INPUT", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const updated = await prisma.formNotificationBinding.update({
    where: { id: bindingId },
    data: parsed.data,
  });
  return NextResponse.json({ binding: updated });
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ formId: string; bindingId: string }> },
) {
  const { formId, bindingId } = await context.params;
  const auth = await authorise(formId, bindingId);
  if (!auth.ok) return auth.response;

  await prisma.formNotificationBinding.delete({ where: { id: bindingId } });
  return NextResponse.json({ ok: true });
}
