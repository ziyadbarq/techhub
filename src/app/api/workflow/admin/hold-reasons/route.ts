import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { prisma } from "@/infrastructure/database/prisma/client";
import { FEATURE_FLAGS } from "@/lib/features/feature-flag-keys";
import { requireFeature } from "@/lib/features/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { requirePermission } from "@/lib/permissions/server";

export const dynamic = "force-dynamic";

const upsertSchema = z.object({
  key: z
    .string()
    .min(1)
    .max(80)
    .regex(/^[a-z0-9_]+$/i),
  label: z.string().min(1).max(200),
  isActive: z.boolean().optional(),
});

export async function GET() {
  await requireFeature(FEATURE_FLAGS.WORKFLOW_ENGINE);
  await requirePermission(PERMISSIONS.WORKFLOWS_HOLD_REASONS_MANAGE);

  const reasons = await prisma.holdReason.findMany({
    orderBy: { label: "asc" },
  });
  return NextResponse.json({ holdReasons: reasons });
}

export async function POST(request: NextRequest) {
  await requireFeature(FEATURE_FLAGS.WORKFLOW_ENGINE);
  await requirePermission(PERMISSIONS.WORKFLOWS_HOLD_REASONS_MANAGE);

  const parsed = upsertSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "INVALID_INPUT", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const created = await prisma.holdReason.create({
    data: {
      key: parsed.data.key,
      label: parsed.data.label,
      isActive: parsed.data.isActive ?? true,
    },
  });
  return NextResponse.json({ holdReason: created }, { status: 201 });
}
