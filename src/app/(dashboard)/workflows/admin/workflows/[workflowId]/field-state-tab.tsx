"use client";

import { useEffect, useState } from "react";

import { StepFieldVisibilityCard } from "@/components/workflows/step-field-visibility-card";
import type { StepDef } from "@/lib/workflows/builder/graph";
import { formatTime } from "@/lib/utils/date-format";

type FieldStateValue = "EDITABLE" | "READ_ONLY" | "HIDDEN";

export interface LinkedFormRef {
  id: string;
  name: string;
}

interface LoadedFormDraft {
  fields: Array<{ key: string; label: string; type: string }>;
  perStepFieldState: Record<string, Record<string, FieldStateValue>>;
  /** All raw fields, kept verbatim so we can write them back unchanged. */
  rawFields: unknown[];
}

export function FieldStateTab({
  linkedForms,
  steps,
}: {
  linkedForms: LinkedFormRef[];
  steps: StepDef[];
}) {
  const [pickedFormId, setPickedFormId] = useState<string>(
    linkedForms[0]?.id ?? "",
  );
  const [draft, setDraft] = useState<LoadedFormDraft | null>(null);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const persistableSteps = steps.filter(
    (s) =>
      s.type === "APPROVAL" || s.type === "EXECUTION" || s.type === "INFO_ACK",
  );

  // Lazy-load the picked form's draft.
  useEffect(() => {
    if (!pickedFormId) {
      setDraft(null);
      return;
    }
    let stopped = false;
    setLoading(true);
    setSaveError(null);
    fetch(`/api/workflow/admin/forms/${pickedFormId}/draft`)
      .then((r) => r.json())
      .then((data: { draft: { schemaJson: unknown } }) => {
        if (stopped) return;
        const schema = data.draft.schemaJson as
          | {
              fields?: Array<{ key: string; label: string; type: string }>;
              perStepFieldState?: Record<
                string,
                Record<string, FieldStateValue>
              >;
            }
          | undefined;
        const all = schema?.fields ?? [];
        setDraft({
          rawFields: all as unknown[],
          fields: all
            .filter((f) => f.type !== "SECTION_HEADER" && f.type !== "COMPUTED")
            .map((f) => ({ key: f.key, label: f.label, type: f.type })),
          perStepFieldState: schema?.perStepFieldState ?? {},
        });
      })
      .catch(() => {
        if (!stopped) setDraft(null);
      })
      .finally(() => {
        if (!stopped) setLoading(false);
      });
    return () => {
      stopped = true;
    };
  }, [pickedFormId]);

  const persist = async (
    next: Record<string, Record<string, FieldStateValue>>,
  ) => {
    if (!pickedFormId || !draft) return;
    setBusy(true);
    setSaveError(null);
    try {
      const writeRes = await fetch(
        `/api/workflow/admin/forms/${pickedFormId}/draft`,
        {
          method: "PUT",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            fields: draft.rawFields,
            perStepFieldState: next,
          }),
        },
      );
      if (!writeRes.ok) {
        const body = await writeRes.json().catch(() => ({}));
        throw new Error(body.message || body.error || "Save failed");
      }
      setSavedAt(new Date());
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  // Empty state — no linked forms
  if (linkedForms.length === 0) {
    return (
      <div className="border-hairline bg-canvas rounded-xl border p-8 text-center">
        <p className="text-body-md-medium text-ink">No linked forms</p>
        <p className="text-body-sm text-stone mt-2">
          Per-step field state lives on the form. Link this workflow to a form
          first — open the form&apos;s editor and pick this workflow in the
          header dropdown.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="border-hairline-soft bg-surface-soft flex flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-3">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-body-sm-medium text-ink">Editing form:</span>
          {linkedForms.length === 1 ? (
            <span className="text-body-sm text-charcoal font-mono">
              {linkedForms[0]!.name}
            </span>
          ) : (
            <select
              value={pickedFormId}
              onChange={(e) => setPickedFormId(e.target.value)}
              className="border-hairline-strong bg-canvas text-body-sm text-ink rounded-md border px-3 py-1.5"
            >
              {linkedForms.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          )}
          <span className="text-caption text-stone">
            Changes save into this form&apos;s draft.
          </span>
        </div>
        <div className="text-caption text-stone">
          {loading
            ? "loading…"
            : busy
              ? "saving…"
              : savedAt
                ? `saved ${formatTime(savedAt)}`
                : ""}
        </div>
      </div>

      {saveError ? (
        <div className="bg-brand-red/40 text-body-sm text-coral-dark rounded-md border border-(--color-brand-red-dark) px-3 py-2">
          {saveError}
        </div>
      ) : null}

      {loading || !draft ? (
        <div className="border-hairline-soft bg-canvas text-body-sm text-stone rounded-md border p-8 text-center">
          {loading ? "Loading form…" : "Pick a form to start editing."}
        </div>
      ) : draft.fields.length === 0 ? (
        <p className="border-hairline-soft bg-canvas text-body-sm text-stone rounded-md border p-5">
          The linked form has no fields yet. Add fields in the form builder
          first.
        </p>
      ) : persistableSteps.length === 0 ? (
        <p className="border-hairline-soft bg-canvas text-body-sm text-stone rounded-md border p-5">
          Per-step field state applies to human steps (Approval, Execution, Info
          / Ack). Add at least one such step.
        </p>
      ) : (
        persistableSteps.map((s) => (
          <StepFieldVisibilityCard
            key={s.key}
            stepKey={s.key}
            stepLabel={`${s.key} — ${s.type}`}
            fields={draft.fields}
            state={draft.perStepFieldState[s.key]}
            onChange={(next) => {
              const updated = {
                ...draft.perStepFieldState,
                [s.key]: next,
              };
              setDraft({ ...draft, perStepFieldState: updated });
              void persist(updated);
            }}
          />
        ))
      )}
    </div>
  );
}
