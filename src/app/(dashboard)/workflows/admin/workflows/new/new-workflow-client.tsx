"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  Button,
  Card,
  FieldLabel,
  TextArea,
  TextInput,
} from "@/components/design";

export function NewWorkflowClient() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate() {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/workflow/admin/workflows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description: description || undefined }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.message || body.error || "Failed");
      }
      const body = (await response.json()) as {
        definition: { id: string };
      };
      router.push(`/workflows/admin/workflows/${body.definition.id}`);
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
            placeholder="e.g., Standard approval"
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
        {error ? (
          <div className="rounded-md border border-[var(--color-brand-red-dark)] bg-[var(--color-brand-red)]/40 px-3 py-2 text-body-sm text-[var(--color-coral-dark)]">
            {error}
          </div>
        ) : null}
        <Button
          onClick={handleCreate}
          disabled={busy || !name}
          variant="primary"
        >
          {busy ? "Creating…" : "Create workflow"}
        </Button>
      </div>
    </Card>
  );
}
