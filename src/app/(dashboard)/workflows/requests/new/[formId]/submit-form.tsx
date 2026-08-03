"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/design";
import { FormRenderer } from "@/components/workflows/form-renderer";

interface FormSchema {
  fields: Array<{
    key: string;
    label: string;
    type: string;
    required?: boolean;
    position: number;
    config?: Record<string, unknown>;
  }>;
}

interface User {
  id: string;
  name: string | null;
  email: string;
}

function isEmpty(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === "string") return value.trim() === "";
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === "object") return Object.keys(value).length === 0;
  return false;
}

export function SubmitRequestForm({
  formId,
  schema,
  users,
  formNameToId,
}: {
  formId: string;
  schema: FormSchema;
  users: User[];
  formNameToId?: Record<string, string>;
}) {
  const router = useRouter();
  const [values, setValues] = useState<Record<string, unknown>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [missing, setMissing] = useState<string[]>([]);

  function validate(): string[] {
    const requiredFields = schema.fields.filter(
      (f) => f.required && f.type !== "SECTION_HEADER" && f.type !== "COMPUTED",
    );
    return requiredFields
      .filter((f) => isEmpty(values[f.key]))
      .map((f) => f.key);
  }

  async function handleSubmit() {
    setError(null);
    const empty = validate();
    if (empty.length > 0) {
      setMissing(empty);
      const labels = schema.fields
        .filter((f) => empty.includes(f.key))
        .map((f) => f.label);
      setError(
        `Please fill the required field${labels.length === 1 ? "" : "s"}: ${labels.join(", ")}`,
      );
      return;
    }
    setMissing([]);
    setSubmitting(true);
    try {
      const response = await fetch("/api/workflow/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ formId, fieldValues: values }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.message || body.error || "Submission failed");
      }
      const body = (await response.json()) as {
        requestId: string;
        referenceNumber: string;
      };
      router.push(`/workflows/requests/${body.requestId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <FormRenderer
        schema={schema}
        values={values}
        onChange={(v) => {
          setValues(v);
          if (missing.length > 0) {
            const stillMissing = missing.filter((key) => isEmpty(v[key]));
            setMissing(stillMissing);
            if (stillMissing.length === 0) setError(null);
          }
        }}
        users={users}
        invalidFieldKeys={missing}
        formNameToId={formNameToId}
      />
      {error ? (
        <p className="text-body-sm mt-4 rounded-md border border-[var(--color-brand-red-dark)] bg-[var(--color-brand-red)]/40 px-3 py-2 text-[var(--color-coral-dark)]">
          {error}
        </p>
      ) : null}
      <div className="mt-6 flex items-center gap-3">
        <Button onClick={handleSubmit} disabled={submitting} variant="primary">
          {submitting ? "Submitting…" : "Submit request"}
        </Button>
      </div>
    </div>
  );
}
