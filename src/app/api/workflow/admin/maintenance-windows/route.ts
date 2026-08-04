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
  recurrence: z.record(z.string(), z.unknown()),
});

export async function GET() {
  await requireFeature(FEATURE_FLAGS.WORKFLOW_ENGINE);
  await requirePermission(PERMISSIONS.WORKFLOWS_MAINTENANCE_WINDOWS_MANAGE);

  const windows = await prisma.maintenanceWindow.findMany({
    orderBy: { name: "asc" },
  });
  return NextResponse.json({ windows });
}

export async function POST(request: NextRequest) {
  await requireFeature(FEATURE_FLAGS.WORKFLOW_ENGINE);
  await requirePermission(PERMISSIONS.WORKFLOWS_MAINTENANCE_WINDOWS_MANAGE);

  const parsed = createSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "INVALID_INPUT", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const created = await prisma.maintenanceWindow.create({
    data: {
      name: parsed.data.name,
      recurrenceJson: parsed.data.recurrence as Prisma.InputJsonValue,
    },
  });
  return NextResponse.json({ window: created }, { status: 201 });
}
