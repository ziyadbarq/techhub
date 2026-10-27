import { LinkButton } from "@/components/design";
import { prisma } from "@/infrastructure/database/prisma/client";
import { FEATURE_FLAGS } from "@/lib/features/feature-flag-keys";
import { requireFeature } from "@/lib/features/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { requirePermission } from "@/lib/permissions/server";

import { NewFormClient } from "./new-form-client";

export const dynamic = "force-dynamic";

export default async function NewFormPage() {
  await requireFeature(FEATURE_FLAGS.WORKFLOW_ENGINE);
  await requirePermission(PERMISSIONS.WORKFLOWS_FORMS_CREATE);

  const workflows = await prisma.workflowDefinition.findMany({
    select: { id: true, name: true, publishedVersionId: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <LinkButton href="/workflows/admin/forms" variant="ghost" size="sm">
        ← Forms
      </LinkButton>

      <header className="space-y-1">
        <h1 className="text-h2">New form</h1>
        <p className="text-subtitle text-slate max-w-2xl">
          A form is a request type. It links to one workflow.
        </p>
      </header>

      <NewFormClient workflows={workflows} />
    </div>
  );
}
