import { LinkButton } from "@/components/design";
import { prisma } from "@/infrastructure/database/prisma/client";
import { FEATURE_FLAGS } from "@/lib/features/feature-flag-keys";
import { requireFeature } from "@/lib/features/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { requirePermission } from "@/lib/permissions/server";

import { CalendarsClient } from "./calendars-client";

export const dynamic = "force-dynamic";

export default async function CalendarsPage() {
  await requireFeature(FEATURE_FLAGS.WORKFLOW_ENGINE);
  await requirePermission(PERMISSIONS.WORKFLOWS_CALENDARS_MANAGE);

  const calendars = await prisma.calendar.findMany({
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <LinkButton href="/workflows/admin" variant="ghost" size="sm">
        ← Admin
      </LinkButton>

      <header className="space-y-2">
        <span className="text-micro-uppercase text-stone">
          Admin · Calendars
        </span>
        <h1 className="text-h2">Business calendars</h1>
        <p className="text-subtitle text-slate max-w-2xl">
          Working hours and holidays used by SLA computations.
        </p>
      </header>

      <CalendarsClient
        initialCalendars={calendars.map((c) => ({
          id: c.id,
          name: c.name,
          timezone: c.timezone,
        }))}
      />
    </div>
  );
}
