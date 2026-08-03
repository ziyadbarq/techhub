import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { prisma } from "@/infrastructure/database/prisma/client";
import { FEATURE_FLAGS } from "@/lib/features/feature-flag-keys";
import { requireFeature } from "@/lib/features/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { requirePermission } from "@/lib/permissions/server";

export const dynamic = "force-dynamic";

const createSchema = z.object({
  name: z.string().min(1).max(120),
  restartMode: z
    .enum(["FULL_RESTART", "RESUME_FROM_REJECTION_STEP"])
    .default("FULL_RESTART"),
});

export async function GET() {
  await requireFeature(FEATURE_FLAGS.WORKFLOW_ENGINE);
  await requirePermission(PERMISSIONS.WORKFLOWS_REJECTION_POLICIES_MANAGE);

  const policies = await prisma.rejectionPolicy.findMany({
    orderBy: { name: "asc" },
  });
  return NextResponse.json({ policies });
}

export async function POST(request: NextRequest) {
  await requireFeature(FEATURE_FLAGS.WORKFLOW_ENGINE);
  await requirePermission(PERMISSIONS.WORKFLOWS_REJECTION_POLICIES_MANAGE);

  const parsed = createSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "INVALID_INPUT", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const created = await prisma.rejectionPolicy.create({
    data: {
      name: parsed.data.name,
      restartMode: parsed.data.restartMode,
    },
  });
  return NextResponse.json({ policy: created }, { status: 201 });
}
