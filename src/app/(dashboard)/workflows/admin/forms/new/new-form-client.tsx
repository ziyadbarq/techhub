"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  Button,
  Card,
  FieldLabel,
  Select,
  TextArea,
  TextInput,
} from "@/components/design";

interface Workflow {
  id: string;
  name: string;
  publishedVersionId: string | null;
}

export function NewFormClient({ workflows }: { workflows: Workflow[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [workflowDefinitionId, setWorkflowDefinitionId] = useState(
    workflows.find((w) => w.publishedVersionId)?.id ?? workflows[0]?.id ?? "",
  );
  const [referenceNumberFormat, setReferenceNumberFormat] = useState(
    "REQ-{YYYY}-{seq:04}",
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate() {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/workflow/admin/forms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description: description || undefined,
          workflowDefinitionId,
          referenceNumberFormat,
        }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.message || body.error || "Failed");
      }
      const body = (await response.json()) as { form: { id: string } };
      router.push(`/workflows/admin/forms/${body.form.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card size="feature">
      <div className="space-y-5">
        <div className="space-y-2">
          <FieldLabel required>Name</FieldLabel>
          <TextInput
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Access Request"
          />
        </div>

        <div className="space-y-2">
          <FieldLabel>Description</FieldLabel>
          <TextArea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <FieldLabel
            required
            helper="The workflow that processes submissions of this form."
          >
            Workflow
          </FieldLabel>
          <Select
            value={workflowDefinitionId}
            onChange={(e) => setWorkflowDefinitionId(e.target.value)}
          >
            <option value="">— Select —</option>
            {workflows.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
                {w.publishedVersionId ? "" : " (no published version)"}
              </option>
            ))}
          </Select>
        </div>

        <div className="space-y-2">
          <FieldLabel helper="Placeholders: {YYYY}, {YY}, {MM}, {DD}, {seq:04}">
            Reference number format
          </FieldLabel>
          <TextInput
            value={referenceNumberFormat}
            onChange={(e) => setReferenceNumberFormat(e.target.value)}
            className="font-mono"
          />
        </div>

        {error ? (
          <div className="text-body-sm rounded-md border border-[var(--color-brand-red-dark)] bg-[var(--color-brand-red)]/40 px-3 py-2 text-[var(--color-coral-dark)]">
            {error}
          </div>
        ) : null}

        <Button
          onClick={handleCreate}
          disabled={busy || !name || !workflowDefinitionId}
          variant="primary"
        >
          {busy ? "Creating…" : "Create form"}
        </Button>
      </div>
    </Card>
  );
}
