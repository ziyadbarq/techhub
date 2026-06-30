import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { prisma } from "@/infrastructure/database/prisma/client";
import { FEATURE_FLAGS } from "@/lib/features/feature-flag-keys";
import { requireFeature } from "@/lib/features/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { requirePermission } from "@/lib/permissions/server";
import type { Prisma } from "@/generated/prisma";

export const dynamic = "force-dynamic";

const createSchema = z.object({
  name: z.string().min(1).max(120),
  startsAt: z.string().min(1),
  endsAt: z.string().min(1),
  behavior: z.enum(["BLOCK", "WARN", "IGNORE"]).default("BLOCK"),
  reason: z.string().optional(),
});

export async function GET() {
  await requireFeature(FEATURE_FLAGS.WORKFLOW_ENGINE);
  await requirePermission(PERMISSIONS.WORKFLOWS_BLACKOUT_PERIODS_MANAGE);

  const periods = await prisma.blackoutPeriod.findMany({
    orderBy: { startsAt: "asc" },
  });
  return NextResponse.json({ periods });
}

export async function POST(request: NextRequest) {
  await requireFeature(FEATURE_FLAGS.WORKFLOW_ENGINE);
  await requirePermission(PERMISSIONS.WORKFLOWS_BLACKOUT_PERIODS_MANAGE);

  const parsed = createSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "INVALID_INPUT", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const data: Prisma.BlackoutPeriodCreateInput = {
    name: parsed.data.name,
    startsAt: new Date(parsed.data.startsAt),
    endsAt: new Date(parsed.data.endsAt),
    behavior: parsed.data.behavior,
    reason: parsed.data.reason ?? null,
  };

  const created = await prisma.blackoutPeriod.create({ data });
  return NextResponse.json({ period: created }, { status: 201 });
}
