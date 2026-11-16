import { LinkButton } from "@/components/design";
import { prisma } from "@/infrastructure/database/prisma/client";
import { FEATURE_FLAGS } from "@/lib/features/feature-flag-keys";
import { requireFeature } from "@/lib/features/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { hasPermission, requirePermission } from "@/lib/permissions/server";

import { NewFormClient } from "./new-form-client";

export const dynamic = "force-dynamic";

export default async function NewFormPage() {
  await requireFeature(FEATURE_FLAGS.WORKFLOW_ENGINE);
  await requirePermission(PERMISSIONS.WORKFLOWS_FORMS_CREATE);

  const [workflows, canCreateWorkflow] = await Promise.all([
    prisma.workflowDefinition.findMany({
      select: {
        id: true,
        name: true,
        publishedVersion: { select: { versionNumber: true } },
        _count: { select: { forms: true } },
      },
      orderBy: { name: "asc" },
    }),
    // Creating a new approval path alongside the form needs this too; without
    // it the page offers existing paths only.
    hasPermission(PERMISSIONS.WORKFLOWS_DEFINITIONS_CREATE),
  ]);

  return (
    <div className="space-y-6">
      <LinkButton href="/workflows/admin/forms" variant="ghost" size="sm">
        ← Forms
      </LinkButton>

      <header className="space-y-1">
        <h1 className="text-h2">New request type</h1>
        <p className="text-subtitle text-slate max-w-2xl">
          Name it, choose how it gets approved, then add the fields employees
          fill in.
        </p>
      </header>

      <NewFormClient
        canCreateWorkflow={canCreateWorkflow}
        workflows={workflows.map((w) => ({
          id: w.id,
          name: w.name,
          published: w.publishedVersion !== null,
          formCount: w._count.forms,
        }))}
      />
    </div>
  );
}
