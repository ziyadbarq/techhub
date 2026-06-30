import { NextResponse } from "next/server";

import { prisma } from "@/infrastructure/database/prisma/client";
import { FEATURE_FLAGS } from "@/lib/features/feature-flag-keys";
import { requireFeature } from "@/lib/features/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { requirePermission } from "@/lib/permissions/server";
import { getCurrentUserId } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function GET() {
  await requireFeature(FEATURE_FLAGS.WORKFLOW_ENGINE);
  await requirePermission(PERMISSIONS.WORKFLOWS_INBOX_VIEW);

  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const steps = await prisma.stepInstance.findMany({
    where: {
      status: "ACTIVE",
      snapshots: { some: { userId } },
    },
    include: {
      request: {
        select: {
          id: true,
          referenceNumber: true,
          status: true,
          createdAt: true,
          form: { select: { id: true, name: true } },
          requester: { select: { id: true, name: true, email: true } },
        },
      },
    },
    orderBy: { activatedAt: "desc" },
    take: 100,
  });

  return NextResponse.json({
    inbox: steps.map((s) => ({
      stepInstanceId: s.id,
      stepKey: s.stepKey,
      activatedAt: s.activatedAt?.toISOString() ?? null,
      request: {
        ...s.request,
        createdAt: s.request.createdAt.toISOString(),
      },
    })),
  });
}
