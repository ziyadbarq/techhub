import { LinkButton } from "@/components/design";
import { prisma } from "@/infrastructure/database/prisma/client";
import { FEATURE_FLAGS } from "@/lib/features/feature-flag-keys";
import { requireFeature } from "@/lib/features/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { requirePermission } from "@/lib/permissions/server";

import { MaintenanceWindowsClient } from "./maintenance-windows-client";

export const dynamic = "force-dynamic";

export default async function MaintenanceWindowsPage() {
  await requireFeature(FEATURE_FLAGS.WORKFLOW_ENGINE);
  await requirePermission(PERMISSIONS.WORKFLOWS_MAINTENANCE_WINDOWS_MANAGE);

  const windows = await prisma.maintenanceWindow.findMany({
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <LinkButton href="/workflows/admin" variant="ghost" size="sm">
        ← Admin
      </LinkButton>
      <header className="space-y-1">
        <h1 className="text-h2">Maintenance windows</h1>
        <p className="text-subtitle text-slate max-w-2xl">
          Recurring time ranges where Schedule steps may place work.
        </p>
      </header>
      <MaintenanceWindowsClient
        initial={windows.map((w) => ({
          id: w.id,
          name: w.name,
          recurrence: w.recurrenceJson as Record<string, unknown>,
        }))}
      />
    </div>
  );
}
