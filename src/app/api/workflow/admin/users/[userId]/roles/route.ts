import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { prisma } from "@/infrastructure/database/prisma/client";
import { FEATURE_FLAGS } from "@/lib/features/feature-flag-keys";
import { requireFeature } from "@/lib/features/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { requirePermission } from "@/lib/permissions/server";
import { getCurrentUserId } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

const patchSchema = z.object({
  roleIds: z.array(z.string().min(1)),
});

/**
 * PATCH replaces the full set of roles attached to the given user.
 * Computes diff and adds/removes only the changed roles so audit
 * timestamps on roles that didn't change are preserved.
 */
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ userId: string }> },
) {
  await requireFeature(FEATURE_FLAGS.WORKFLOW_ENGINE);
  // Only super-admin / role-manager scope can modify role assignments.
  await requirePermission(PERMISSIONS.ROLES_MANAGE);

  const actorUserId = await getCurrentUserId();
  if (!actorUserId) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const { userId } = await context.params;
  const parsed = patchSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "INVALID_INPUT", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const target = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true },
  });
  if (!target) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  const currentRoleRows = await prisma.userRole.findMany({
    where: { userId },
    select: { roleId: true },
  });

  // Validate every requested role exists (defence-in-depth)
  const validRoles = await prisma.role.findMany({
    where: { id: { in: parsed.data.roleIds } },
    select: { id: true },
  });
  const validIds = new Set(validRoles.map((r) => r.id));
  const requested = parsed.data.roleIds.filter((id) => validIds.has(id));

  const currentSet = new Set(currentRoleRows.map((r) => r.roleId));
  const requestedSet = new Set(requested);

  const toAdd = requested.filter((id) => !currentSet.has(id));
  const toRemove = currentRoleRows
    .map((r) => r.roleId)
    .filter((id) => !requestedSet.has(id));

  await prisma.$transaction(async (tx) => {
    if (toRemove.length > 0) {
      await tx.userRole.deleteMany({
        where: { userId, roleId: { in: toRemove } },
      });
    }
    for (const roleId of toAdd) {
      await tx.userRole.create({
        data: { userId, roleId, createdBy: actorUserId },
      });
    }
  });

  return NextResponse.json({
    ok: true,
    added: toAdd.length,
    removed: toRemove.length,
  });
}
