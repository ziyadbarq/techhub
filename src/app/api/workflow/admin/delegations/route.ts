import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { prisma } from "@/infrastructure/database/prisma/client";
import { FEATURE_FLAGS } from "@/lib/features/feature-flag-keys";
import { requireFeature } from "@/lib/features/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { requirePermission } from "@/lib/permissions/server";

export const dynamic = "force-dynamic";

const createSchema = z.object({
  fromUserId: z.string().min(1),
  toUserId: z.string().min(1),
  startsAt: z.string().min(1),
  endsAt: z.string().min(1).optional(),
});

export async function GET() {
  await requireFeature(FEATURE_FLAGS.WORKFLOW_ENGINE);
  await requirePermission(PERMISSIONS.WORKFLOWS_DELEGATIONS_MANAGE);

  const delegations = await prisma.delegation.findMany({
    include: {
      fromUser: { select: { id: true, name: true, email: true } },
      toUser: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ delegations });
}

export async function POST(request: NextRequest) {
  await requireFeature(FEATURE_FLAGS.WORKFLOW_ENGINE);
  await requirePermission(PERMISSIONS.WORKFLOWS_DELEGATIONS_MANAGE);

  const parsed = createSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "INVALID_INPUT", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  if (parsed.data.fromUserId === parsed.data.toUserId) {
    return NextResponse.json({ error: "FROM_TO_SAME" }, { status: 400 });
  }

  const created = await prisma.delegation.create({
    data: {
      fromUserId: parsed.data.fromUserId,
      toUserId: parsed.data.toUserId,
      startsAt: new Date(parsed.data.startsAt),
      endsAt: parsed.data.endsAt ? new Date(parsed.data.endsAt) : null,
      isActive: true,
    },
  });
  return NextResponse.json({ delegation: created }, { status: 201 });
}
