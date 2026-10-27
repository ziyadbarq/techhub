import { LinkButton } from "@/components/design";
import { prisma } from "@/infrastructure/database/prisma/client";
import { FEATURE_FLAGS } from "@/lib/features/feature-flag-keys";
import { requireFeature } from "@/lib/features/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { requirePermission } from "@/lib/permissions/server";

import { DelegationsClient } from "./delegations-client";

export const dynamic = "force-dynamic";

export default async function DelegationsPage() {
  await requireFeature(FEATURE_FLAGS.WORKFLOW_ENGINE);
  await requirePermission(PERMISSIONS.WORKFLOWS_DELEGATIONS_MANAGE);

  const [delegations, users] = await Promise.all([
    prisma.delegation.findMany({
      include: {
        fromUser: { select: { id: true, name: true, email: true } },
        toUser: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.findMany({
      select: { id: true, name: true, email: true },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  return (
    <div className="space-y-6">
      <LinkButton href="/workflows/admin" variant="ghost" size="sm">
        ← Admin
      </LinkButton>
      <header className="space-y-1">
        <h1 className="text-h2">Delegations</h1>
        <p className="text-subtitle text-slate max-w-2xl">
          Out-of-office routing. When a user has an active delegation, every
          assignment to them redirects to their delegate (chains up to 3 hops).
        </p>
      </header>
      <DelegationsClient
        initial={delegations.map((d) => ({
          id: d.id,
          isActive: d.isActive,
          startsAt: d.startsAt.toISOString(),
          endsAt: d.endsAt?.toISOString() ?? null,
          fromUser: d.fromUser,
          toUser: d.toUser,
        }))}
        users={users}
      />
    </div>
  );
}
