/**
 * The people of one form: its owners, managers and viewers.
 *
 * GET — the current list. PUT — replaces it. People are picked from Persons
 * (Active Directory); someone without a TechHub account gets one on save
 * (Viewer role, Microsoft sign-in links to it), as for access services.
 */

import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { getContainer } from "@/di/container";
import { DI_TOKENS } from "@/di/types";
import { prisma } from "@/infrastructure/database/prisma/client";
import { getCurrentUserId } from "@/lib/auth/session";
import { FEATURE_FLAGS } from "@/lib/features/feature-flag-keys";
import { requireFeature } from "@/lib/features/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { requirePermission } from "@/lib/permissions/server";
import { FORM_MEMBER_ROLES } from "@/core/domain/workflow";
import type { EnsureUserAccountsForPeopleUseCase } from "@/core/use-cases/user-provisioning";

export const dynamic = "force-dynamic";

const putSchema = z.object({
  members: z
    .array(
      z
        .object({
          role: z.enum(FORM_MEMBER_ROLES),
          userId: z.string().min(1).optional(),
          personId: z.string().min(1).optional(),
        })
        .refine((m) => !!m.userId || !!m.personId, {
          message: "Each member needs a userId or a personId",
        }),
    )
    .max(500),
});

async function loadForm(formId: string) {
  return prisma.form.findUnique({
    where: { id: formId },
    select: { id: true },
  });
}

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ formId: string }> },
) {
  await requireFeature(FEATURE_FLAGS.WORKFLOW_ENGINE);
  await requirePermission(PERMISSIONS.WORKFLOWS_FORMS_VIEW);

  const { formId } = await context.params;
  if (!(await loadForm(formId))) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  const members = await prisma.formMember.findMany({
    where: { formId },
    orderBy: { createdAt: "asc" },
    select: {
      role: true,
      user: { select: { id: true, name: true, email: true } },
    },
  });
  return NextResponse.json({ members });
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ formId: string }> },
) {
  await requireFeature(FEATURE_FLAGS.WORKFLOW_ENGINE);
  await requirePermission(PERMISSIONS.WORKFLOWS_FORMS_UPDATE);

  const actorId = await getCurrentUserId();
  if (!actorId) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const { formId } = await context.params;
  if (!(await loadForm(formId))) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  const parsed = putSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "INVALID_INPUT", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  // People without an account get one; inactive or excluded people don't.
  const personIds = [
    ...new Set(
      parsed.data.members
        .filter((m) => !m.userId && m.personId)
        .map((m) => m.personId!),
    ),
  ];
  const accounts = personIds.length
    ? await getContainer()
        .get<EnsureUserAccountsForPeopleUseCase>(
          DI_TOKENS.EnsureUserAccountsForPeopleUseCase,
        )
        .execute({ personIds, requestedBy: actorId })
    : null;

  const rows = new Map<string, { userId: string; role: string }>();
  const notAdded: string[] = [];
  for (const m of parsed.data.members) {
    const userId =
      m.userId ??
      (m.personId ? accounts?.userIdByPerson.get(m.personId) : null);
    if (!userId) {
      notAdded.push(m.personId ?? "");
      continue;
    }
    rows.set(`${userId}:${m.role}`, { userId, role: m.role });
  }

  await prisma.$transaction([
    prisma.formMember.deleteMany({ where: { formId } }),
    prisma.formMember.createMany({
      data: [...rows.values()].map((r) => ({
        formId,
        userId: r.userId,
        role: r.role as (typeof FORM_MEMBER_ROLES)[number],
        createdById: actorId,
      })),
      skipDuplicates: true,
    }),
  ]);

  return NextResponse.json({ ok: true, saved: rows.size, notAdded });
}
