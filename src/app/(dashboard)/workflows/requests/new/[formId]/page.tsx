import { Card, LinkButton } from "@/components/design";
import { loadRequestFormData } from "@/lib/workflows/load-request-form";
import { SubmitRequestForm } from "./submit-form";

export const dynamic = "force-dynamic";

export default async function NewRequestPage({
  params,
}: {
  params: Promise<{ formId: string }>;
}) {
  const { formId } = await params;
  const { form, orgUsers, formNameToId, systemFieldValues } =
    await loadRequestFormData(formId);

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
          Form version {form.publishedVersion.versionNumber}
        </p>
      </header>

      <Card size="feature">
        <SubmitRequestForm
          formId={form.id}
          schema={form.publishedVersion.schemaJson as never}
          users={orgUsers}
          formNameToId={formNameToId}
          systemFieldValues={systemFieldValues}
        />
      </Card>
    </div>
  );
}
