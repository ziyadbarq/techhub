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
  timezone: z.string().min(1).max(80),
  workingHours: z.unknown(),
  holidays: z.array(z.string()).default([]),
});

export async function GET() {
  await requireFeature(FEATURE_FLAGS.WORKFLOW_ENGINE);
  await requirePermission(PERMISSIONS.WORKFLOWS_CALENDARS_VIEW);

  const calendars = await prisma.calendar.findMany({
    orderBy: { name: "asc" },
  });
  return NextResponse.json({ calendars });
}

export async function POST(request: NextRequest) {
  await requireFeature(FEATURE_FLAGS.WORKFLOW_ENGINE);
  await requirePermission(PERMISSIONS.WORKFLOWS_CALENDARS_MANAGE);

  const parsed = createSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "INVALID_INPUT", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const created = await prisma.calendar.create({
    data: {
      name: parsed.data.name,
      timezone: parsed.data.timezone,
      workingHoursJson: parsed.data.workingHours as Prisma.InputJsonValue,
      holidaysJson: parsed.data.holidays as unknown as Prisma.InputJsonValue,
    },
  });
  return NextResponse.json({ calendar: created }, { status: 201 });
}
