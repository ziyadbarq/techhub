import { Card, LinkButton } from "@/components/design";
import { notFound } from "next/navigation";
import { loadRequestFormData } from "@/lib/workflows/load-request-form";
import { FEATURE_FLAGS } from "@/lib/features/feature-flag-keys";
import { requireFeature } from "@/lib/features/server";
import { requirePermission } from "@/lib/permissions/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { SubmitRequestForm } from "./submit-form";

export const dynamic = "force-dynamic";

export default async function NewRequestPage({
  params,
}: {
  params: Promise<{ formId: string }>;
}) {
  const { formId } = await params;
  await requireFeature(FEATURE_FLAGS.WORKFLOW_ENGINE);
  await requirePermission(PERMISSIONS.WORKFLOWS_REQUESTS_SUBMIT);

  const { form, orgUsers, formNameToId, systemFieldValues } =
    await loadRequestFormData(formId);
  // The loader rejects unpublished forms, but its return type cannot carry
  // that relation's narrowing across a function boundary.
  const publishedVersion = form.publishedVersion;
  if (!publishedVersion) notFound();

  return (
    <div className="space-y-6">
      <LinkButton href="/workflows/forms" variant="ghost" size="sm">
        ← Pick a different form
      </LinkButton>

      <header className="space-y-1">
        <h1 className="text-h2">{form.name}</h1>
        {form.description ? (
          <p className="text-subtitle text-slate max-w-2xl">
            {form.description}
          </p>
        ) : null}
        <p className="text-caption text-stone">
          Form version {publishedVersion.versionNumber}
        </p>
      </header>

      <Card size="feature">
        <SubmitRequestForm
          formId={form.id}
          schema={publishedVersion.schemaJson as never}
          users={orgUsers}
          formNameToId={formNameToId}
          systemFieldValues={systemFieldValues}
        />
      </Card>
    </div>
  );
}
