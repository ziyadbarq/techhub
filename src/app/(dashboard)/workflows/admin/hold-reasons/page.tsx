import { LinkButton } from "@/components/design";
import { prisma } from "@/infrastructure/database/prisma/client";
import { FEATURE_FLAGS } from "@/lib/features/feature-flag-keys";
import { requireFeature } from "@/lib/features/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { requirePermission } from "@/lib/permissions/server";

import { HoldReasonsClient } from "./hold-reasons-client";

export const dynamic = "force-dynamic";

export default async function HoldReasonsPage() {
  await requireFeature(FEATURE_FLAGS.WORKFLOW_ENGINE);
  await requirePermission(PERMISSIONS.WORKFLOWS_HOLD_REASONS_MANAGE);

  const reasons = await prisma.holdReason.findMany({
    orderBy: { label: "asc" },
  });

  return (
    <div className="space-y-6">
      <LinkButton href="/workflows/admin" variant="ghost" size="sm">
        ← Admin
      </LinkButton>

      <header className="space-y-2">
        <span className="text-micro-uppercase text-stone">
          Admin · Hold reasons
        </span>
        <h1 className="text-h2">Hold reasons</h1>
        <p className="text-subtitle text-slate max-w-2xl">
          Reasons that can pause an in-flight request.
        </p>
      </header>

      <HoldReasonsClient initialReasons={reasons} />
    </div>
  );
}
