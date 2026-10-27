import { LinkButton } from "@/components/design";
import { FEATURE_FLAGS } from "@/lib/features/feature-flag-keys";
import { requireFeature } from "@/lib/features/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { requirePermission } from "@/lib/permissions/server";

import { NewWorkflowClient } from "./new-workflow-client";

export const dynamic = "force-dynamic";

export default async function NewWorkflowPage() {
  await requireFeature(FEATURE_FLAGS.WORKFLOW_ENGINE);
  await requirePermission(PERMISSIONS.WORKFLOWS_DEFINITIONS_CREATE);

  return (
    <div className="space-y-6">
      <LinkButton href="/workflows/admin/workflows" variant="ghost" size="sm">
        ← Workflows
      </LinkButton>

      <header className="space-y-1">
        <h1 className="text-h2">New workflow</h1>
        <p className="text-subtitle text-slate max-w-2xl">
          Define the steps a request goes through.
        </p>
      </header>

      <NewWorkflowClient />
    </div>
  );
}
