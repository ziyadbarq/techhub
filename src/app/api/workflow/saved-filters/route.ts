import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { prisma } from "@/infrastructure/database/prisma/client";
import { FEATURE_FLAGS } from "@/lib/features/feature-flag-keys";
import { requireFeature } from "@/lib/features/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { requirePermission } from "@/lib/permissions/server";
import { getCurrentUserId } from "@/lib/auth/session";
import type { Prisma } from "@/generated/prisma";

export const dynamic = "force-dynamic";

const createSchema = z.object({
  name: z.string().min(1).max(80),
  filter: z.record(z.string(), z.unknown()),
});

export async function GET() {
  await requireFeature(FEATURE_FLAGS.WORKFLOW_ENGINE);
  await requirePermission(PERMISSIONS.WORKFLOWS_REQUESTS_VIEW);

  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const filters = await prisma.savedFilter.findMany({
    where: { userId },
    orderBy: { name: "asc" },
  });
  return NextResponse.json({ filters });
}

export async function POST(request: NextRequest) {
  await requireFeature(FEATURE_FLAGS.WORKFLOW_ENGINE);
  await requirePermission(PERMISSIONS.WORKFLOWS_REQUESTS_VIEW);

  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const parsed = createSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "INVALID_INPUT", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const created = await prisma.savedFilter.upsert({
    where: {
      userId_name: { userId, name: parsed.data.name },
    },
    update: {
      filterJson: parsed.data.filter as Prisma.InputJsonValue,
    },
    create: {
      userId,
      name: parsed.data.name,
      filterJson: parsed.data.filter as Prisma.InputJsonValue,
    },
  });
  return NextResponse.json({ filter: created }, { status: 201 });
}
