import { LinkButton } from "@/components/design";
import { prisma } from "@/infrastructure/database/prisma/client";
import { FEATURE_FLAGS } from "@/lib/features/feature-flag-keys";
import { requireFeature } from "@/lib/features/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { requirePermission } from "@/lib/permissions/server";

import { BlackoutPeriodsClient } from "./blackout-periods-client";

export const dynamic = "force-dynamic";

export default async function BlackoutPeriodsPage() {
  await requireFeature(FEATURE_FLAGS.WORKFLOW_ENGINE);
  await requirePermission(PERMISSIONS.WORKFLOWS_BLACKOUT_PERIODS_MANAGE);

  const periods = await prisma.blackoutPeriod.findMany({
    orderBy: { startsAt: "asc" },
  });

  return (
    <div className="space-y-6">
      <LinkButton href="/workflows/admin" variant="ghost" size="sm">
        ← Admin
      </LinkButton>
      <header className="space-y-2">
        <span className="text-micro-uppercase text-stone">
          Admin · Blackout periods
        </span>
        <h1 className="text-h2">Blackout periods</h1>
        <p className="text-subtitle text-slate max-w-2xl">
          Date ranges where Schedule steps must BLOCK / WARN / IGNORE.
        </p>
      </header>
      <BlackoutPeriodsClient
        initial={periods.map((p) => ({
          id: p.id,
          name: p.name,
          startsAt: p.startsAt.toISOString(),
          endsAt: p.endsAt.toISOString(),
          behavior: p.behavior,
          reason: p.reason,
        }))}
      />
    </div>
  );
}
