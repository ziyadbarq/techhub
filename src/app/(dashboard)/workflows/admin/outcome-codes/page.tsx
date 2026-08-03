import { LinkButton } from "@/components/design";
import { prisma } from "@/infrastructure/database/prisma/client";
import { FEATURE_FLAGS } from "@/lib/features/feature-flag-keys";
import { requireFeature } from "@/lib/features/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { requirePermission } from "@/lib/permissions/server";

import { OutcomeCodesClient } from "./outcome-codes-client";

export const dynamic = "force-dynamic";

export default async function OutcomeCodesPage() {
  await requireFeature(FEATURE_FLAGS.WORKFLOW_ENGINE);
  await requirePermission(PERMISSIONS.WORKFLOWS_OUTCOME_CODES_MANAGE);

  const [codes, forms] = await Promise.all([
    prisma.outcomeCode.findMany({
      include: { form: { select: { id: true, name: true } } },
      orderBy: { key: "asc" },
    }),
    prisma.form.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="space-y-6">
      <LinkButton href="/workflows/admin" variant="ghost" size="sm">
        ← Admin
      </LinkButton>
      <header className="space-y-2">
        <span className="text-micro-uppercase text-stone">
          Admin · Outcome codes
        </span>
        <h1 className="text-h2">Outcome codes</h1>
        <p className="text-subtitle text-slate max-w-2xl">
          Domain-specific outcome labels that admins can attach when closing or
          cancelling a request — alongside the canonical generic outcome.
          Examples: <code className="font-mono">ROLLED_BACK</code>,{" "}
          <code className="font-mono">DEFERRED</code>,{" "}
          <code className="font-mono">PARTIALLY_ROLLED_BACK</code>.
        </p>
      </header>

      <OutcomeCodesClient
        initial={codes.map((c) => ({
          id: c.id,
          key: c.key,
          label: c.label,
          description: c.description,
          genericOutcome: c.genericOutcome,
          isActive: c.isActive,
          form: c.form,
        }))}
        forms={forms}
      />
    </div>
  );
}
