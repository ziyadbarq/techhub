import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { prisma } from "@/infrastructure/database/prisma/client";
import { FEATURE_FLAGS } from "@/lib/features/feature-flag-keys";
import { requireFeature } from "@/lib/features/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { requirePermission } from "@/lib/permissions/server";

export const dynamic = "force-dynamic";

const createSchema = z.object({
  key: z
    .string()
    .min(1)
    .max(80)
    .regex(/^[a-z0-9_.]+$/i),
  subject: z.string().min(1),
  bodyHtml: z.string().min(1),
  bodyText: z.string().optional(),
});

export async function GET() {
  await requireFeature(FEATURE_FLAGS.WORKFLOW_ENGINE);
  await requirePermission(PERMISSIONS.WORKFLOWS_EMAIL_TEMPLATES_MANAGE);

  const templates = await prisma.emailTemplate.findMany({
    orderBy: { key: "asc" },
  });
  return NextResponse.json({ templates });
}

export async function POST(request: NextRequest) {
  await requireFeature(FEATURE_FLAGS.WORKFLOW_ENGINE);
  await requirePermission(PERMISSIONS.WORKFLOWS_EMAIL_TEMPLATES_MANAGE);

  const parsed = createSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "INVALID_INPUT", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const created = await prisma.emailTemplate.create({
    data: {
      key: parsed.data.key,
      subject: parsed.data.subject,
      bodyHtml: parsed.data.bodyHtml,
      bodyText: parsed.data.bodyText ?? null,
    },
  });
  return NextResponse.json({ template: created }, { status: 201 });
}
