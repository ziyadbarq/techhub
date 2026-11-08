"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, ArrowRight } from "lucide-react";
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
  systemFieldValues,
  successMode = "redirect",
}: {
  formId: string;
  schema: FormSchema;
  users: User[];
  formNameToId?: Record<string, string>;
  systemFieldValues?: Record<string, string>;
  successMode?: "redirect" | "inline";
}) {
  const router = useRouter();
  const [values, setValues] = useState<Record<string, unknown>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [missing, setMissing] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState<{ requestId: string; referenceNumber: string } | null>(null);

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
      if (successMode === "inline") {
        setSubmitted(body);
      } else {
        router.push("/workflows/requests/" + body.requestId);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted && successMode === "inline") {
    return (
      <div role="status" aria-live="polite" className="mx-auto max-w-xl py-12 text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-[28px] bg-emerald-500/10 text-emerald-500">
          <CheckCircle2 className="h-11 w-11" aria-hidden="true" />
        </div>
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-400">Request received</p>
        <h2 className="text-3xl font-semibold tracking-tight">You're all set.</h2>
        <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-slate-500 dark:text-slate-400">
          Your request has been submitted to the workflow. Keep this reference number for future updates.
        </p>
        <div className="mx-auto mt-7 max-w-xs rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 dark:border-white/10 dark:bg-white/5">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Reference number</p>
          <p className="mt-1 break-all font-mono text-lg font-semibold text-slate-900 dark:text-white">{submitted.referenceNumber}</p>
        </div>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link href="/request" className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200">
            Submit another <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
          <Link href={"/workflows/requests/" + submitted.requestId} className="inline-flex min-h-11 items-center rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold transition hover:bg-slate-50 dark:border-white/15 dark:hover:bg-white/10">
            View request details
          </Link>
        </div>
      </div>
    );
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
        systemFieldValues={systemFieldValues}
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
