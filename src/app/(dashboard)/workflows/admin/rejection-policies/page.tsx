import { LinkButton } from "@/components/design";
import { prisma } from "@/infrastructure/database/prisma/client";
import { FEATURE_FLAGS } from "@/lib/features/feature-flag-keys";
import { requireFeature } from "@/lib/features/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { requirePermission } from "@/lib/permissions/server";

import { RejectionPoliciesClient } from "./rejection-policies-client";

export const dynamic = "force-dynamic";

export default async function RejectionPoliciesPage() {
  await requireFeature(FEATURE_FLAGS.WORKFLOW_ENGINE);
  await requirePermission(PERMISSIONS.WORKFLOWS_REJECTION_POLICIES_MANAGE);

  const policies = await prisma.rejectionPolicy.findMany({
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <LinkButton href="/workflows/admin" variant="ghost" size="sm">
        ← Admin
      </LinkButton>

      <header className="space-y-2">
        <span className="text-micro-uppercase text-stone">
          Admin · Rejection policies
        </span>
        <h1 className="text-h2">Rejection policies</h1>
        <p className="text-subtitle text-slate max-w-2xl">
          What happens when a request is rejected — full restart vs resume from
          the rejection step.
        </p>
      </header>

      <RejectionPoliciesClient
        initialPolicies={policies.map((p) => ({
          id: p.id,
          name: p.name,
          restartMode: p.restartMode,
        }))}
      />
    </div>
  );
}
