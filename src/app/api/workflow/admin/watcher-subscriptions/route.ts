import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { prisma } from "@/infrastructure/database/prisma/client";
import { FEATURE_FLAGS } from "@/lib/features/feature-flag-keys";
import { requireFeature } from "@/lib/features/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { requirePermission } from "@/lib/permissions/server";

export const dynamic = "force-dynamic";

const createSchema = z.object({
  formId: z.string().min(1),
  roleId: z.string().min(1),
});

export async function GET() {
  await requireFeature(FEATURE_FLAGS.WORKFLOW_ENGINE);
  await requirePermission(PERMISSIONS.WORKFLOWS_WATCHERS_MANAGE);

  const subs = await prisma.watcherSubscription.findMany({
    include: {
      form: { select: { id: true, name: true } },
      role: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ subscriptions: subs });
}

export async function POST(request: NextRequest) {
  await requireFeature(FEATURE_FLAGS.WORKFLOW_ENGINE);
  await requirePermission(PERMISSIONS.WORKFLOWS_WATCHERS_MANAGE);

  const parsed = createSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "INVALID_INPUT", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const [form, role] = await Promise.all([
    prisma.form.findUnique({
      where: { id: parsed.data.formId },
      select: { id: true },
    }),
    prisma.role.findUnique({
      where: { id: parsed.data.roleId },
      select: { id: true },
    }),
  ]);
  if (!form || !role) {
    return NextResponse.json(
      { error: "FORM_OR_ROLE_NOT_FOUND" },
      { status: 400 },
    );
  }

  const created = await prisma.watcherSubscription.upsert({
    where: {
      formId_roleId: {
        formId: parsed.data.formId,
        roleId: parsed.data.roleId,
      },
    },
    update: {},
    create: { formId: parsed.data.formId, roleId: parsed.data.roleId },
  });
  return NextResponse.json({ subscription: created }, { status: 201 });
}
