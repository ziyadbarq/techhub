import { NextResponse, type NextRequest } from "next/server";

import { prisma } from "@/infrastructure/database/prisma/client";
import { FEATURE_FLAGS } from "@/lib/features/feature-flag-keys";
import { requireFeature } from "@/lib/features/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { requirePermission } from "@/lib/permissions/server";

export const dynamic = "force-dynamic";

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  await requireFeature(FEATURE_FLAGS.WORKFLOW_ENGINE);
  await requirePermission(PERMISSIONS.WORKFLOWS_MAINTENANCE_WINDOWS_MANAGE);

  const { id } = await context.params;

  const existing = await prisma.maintenanceWindow.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  await prisma.maintenanceWindow.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
