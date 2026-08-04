import { NextResponse, type NextRequest } from "next/server";

import { prisma } from "@/infrastructure/database/prisma/client";
import { FEATURE_FLAGS } from "@/lib/features/feature-flag-keys";
import { requireFeature } from "@/lib/features/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { requirePermission } from "@/lib/permissions/server";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  await requireFeature(FEATURE_FLAGS.WORKFLOW_ENGINE);
  await requirePermission(PERMISSIONS.WORKFLOWS_REQUESTS_VIEW);

  const { id } = await context.params;

  const req = await prisma.request.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!req) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  const auditEntries = await prisma.auditEntry.findMany({
    where: { requestId: req.id },
    orderBy: { createdAt: "asc" },
    include: {
      actor: { select: { id: true, name: true, email: true } },
    },
  });

  const fieldHistory = await prisma.fieldHistoryEntry.findMany({
    where: { requestId: req.id },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      fieldKey: true,
      valueJson: true,
      auditEntryId: true,
      createdAt: true,
    },
  });

  return NextResponse.json({
    auditEntries: auditEntries.map((e) => ({
      id: e.id,
      action: e.action,
      payload: e.payloadJson,
      actor: e.actor,
      actorSystem: e.actorSystem,
      stepInstanceId: e.stepInstanceId,
      createdAt: e.createdAt.toISOString(),
    })),
    fieldHistory: fieldHistory.map((h) => ({
      id: h.id,
      fieldKey: h.fieldKey,
      value: (h.valueJson as { value?: unknown } | null)?.value ?? null,
      auditEntryId: h.auditEntryId,
      createdAt: h.createdAt.toISOString(),
    })),
  });
}
