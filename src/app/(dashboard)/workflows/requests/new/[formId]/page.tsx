import { Card, LinkButton } from "@/components/design";
import { notFound } from "next/navigation";
import { loadRequestFormData } from "@/lib/workflows/load-request-form";
import { getMicrosoftRequestAccess } from "@/lib/auth/microsoft-request-access";
import { MicrosoftRequestGate } from "@/components/auth/microsoft-request-gate";
import { FEATURE_FLAGS } from "@/lib/features/feature-flag-keys";
import { requireFeature } from "@/lib/features/server";
import { SubmitRequestForm } from "./submit-form";

export const dynamic = "force-dynamic";

export default async function NewRequestPage({
  params,
}: {
  params: Promise<{ formId: string }>;
}) {
  const { formId } = await params;
  await requireFeature(FEATURE_FLAGS.WORKFLOW_ENGINE);

  // Keep Microsoft SSO mandatory when forms are submitted from the dashboard.
  const access = await getMicrosoftRequestAccess();
  if (!access.allowed) {
    return (
      <MicrosoftRequestGate
        returnTo={"/workflows/requests/new/" + encodeURIComponent(formId)}
        authenticated={access.authenticated}
      />
    );
  }

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
