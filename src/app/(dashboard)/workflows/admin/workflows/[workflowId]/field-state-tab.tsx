"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronDown, Eye, EyeOff, Loader2, Pencil } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatTime } from "@/lib/utils/date-format";
import { cn } from "@/lib/utils";
import { stepName, type StepDef } from "@/lib/workflows/builder/graph";

import { STEP_META } from "./step-meta";

type FieldStateValue = "EDITABLE" | "READ_ONLY" | "HIDDEN";
type StateMap = Record<string, Record<string, FieldStateValue>>;

export interface LinkedFormRef {
  id: string;
  name: string;
}

interface LoadedFormDraft {
  fields: Array<{ key: string; label: string; type: string }>;
  perStepFieldState: StateMap;
  /** All raw fields, kept verbatim so we can write them back unchanged. */
  rawFields: unknown[];
}

/** Absent means "can edit", exactly as the form renderer reads it. */
const MODES: ReadonlyArray<{
  value: FieldStateValue;
  label: string;
  icon: typeof Eye;
  tone: string;
}> = [
  {
    value: "EDITABLE",
    label: "Can edit",
    icon: Pencil,
    tone: "bg-mint-light text-moss-dark",
  },
  {
    value: "READ_ONLY",
    label: "Read only",
    icon: Eye,
    tone: "bg-sky-light text-blue-pressed",
  },
  {
    value: "HIDDEN",
    label: "Hidden",
    icon: EyeOff,
    tone: "bg-blush-light text-coral-dark",
  },
];

const NEXT_MODE: Record<FieldStateValue, FieldStateValue> = {
  EDITABLE: "READ_ONLY",
  READ_ONLY: "HIDDEN",
  HIDDEN: "EDITABLE",
};

function setCell(
  state: StateMap,
  stepKey: string,
  fieldKey: string,
  value: FieldStateValue,
): StateMap {
  const byField = { ...(state[stepKey] ?? {}) };
  if (value === "EDITABLE") delete byField[fieldKey];
  else byField[fieldKey] = value;
  const next = { ...state };
  if (Object.keys(byField).length === 0) delete next[stepKey];
  else next[stepKey] = byField;
  return next;
}

/**
 * What each person working a step can do with each field, as one grid:
 * fields down the side, steps across the top. Click a cell to cycle
 * Can edit → Read only → Hidden. Saved into the form's draft.
 */
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
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const humanSteps = steps.filter(
    (s) =>
      s.type === "APPROVAL" || s.type === "EXECUTION" || s.type === "INFO_ACK",
  );

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
              perStepFieldState?: StateMap;
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

  // One save at a time, always with the latest grid, so quick clicks never
  // land out of order.
  const latest = useRef<{
    formId: string;
    rawFields: unknown[];
    state: StateMap;
  } | null>(null);
  const inFlight = useRef(false);
  const flush = useCallback(async () => {
    if (inFlight.current || !latest.current) return;
    inFlight.current = true;
    setSaving(true);
    try {
      while (latest.current) {
        const job = latest.current;
        latest.current = null;
        const response = await fetch(
          `/api/workflow/admin/forms/${job.formId}/draft`,
          {
            method: "PUT",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              fields: job.rawFields,
              perStepFieldState: job.state,
            }),
          },
        );
        if (!response.ok) {
          const body = await response.json().catch(() => ({}));
          throw new Error(
            body.message || body.error || "The change couldn't be saved.",
          );
        }
        setSavedAt(new Date());
        setSaveError(null);
      }
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : String(e));
    } finally {
      inFlight.current = false;
      setSaving(false);
    }
  }, []);

  function update(next: StateMap) {
    if (!draft) return;
    setDraft({ ...draft, perStepFieldState: next });
    latest.current = {
      formId: pickedFormId,
      rawFields: draft.rawFields,
      state: next,
    };
    void flush();
  }

  if (linkedForms.length === 0) {
    return (
      <div className="border-hairline bg-canvas rounded-xl border p-8 text-center">
        <p className="text-ink font-semibold">No form uses this workflow yet</p>
        <p className="text-stone mx-auto mt-2 max-w-md text-sm">
          Field visibility belongs to a form. Choose this approval path in a
          form&apos;s Settings, then come back here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-ink text-sm font-semibold">
            What people see at each step
          </p>
          <p className="text-stone text-xs">
            The requester fills every field when submitting. Choose what each
            later step can change. Click a cell to switch.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {linkedForms.length > 1 ? (
            <Select value={pickedFormId} onValueChange={setPickedFormId}>
              <SelectTrigger className="h-9 w-56">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {linkedForms.map((f) => (
                  <SelectItem key={f.id} value={f.id}>
                    {f.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Link
              href={`/workflows/admin/forms/${linkedForms[0]!.id}`}
              className="text-ink text-sm font-medium hover:underline"
            >
              {linkedForms[0]!.name}
            </Link>
          )}
          <span
            className="text-stone inline-flex min-w-28 items-center gap-1.5 text-xs"
            aria-live="polite"
          >
            {loading ? (
              "Loading…"
            ) : saving ? (
              <>
                <Loader2 className="h-3 w-3 animate-spin" /> Saving…
              </>
            ) : savedAt ? (
              `Saved at ${formatTime(savedAt)} · publish the form to apply`
            ) : (
              "Saved to the form's draft · applies once the form is published"
            )}
          </span>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 text-xs">
        {MODES.map((mode) => {
          const Icon = mode.icon;
          return (
            <span
              key={mode.value}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-medium",
                mode.tone,
              )}
            >
              <Icon className="h-3 w-3" /> {mode.label}
            </span>
          );
        })}
      </div>

      {saveError ? (
        <div
          role="alert"
          className="bg-blush-light text-coral-dark rounded-lg px-4 py-3 text-sm"
        >
          {saveError}
        </div>
      ) : null}

      {loading || !draft ? (
        <div className="border-hairline bg-canvas text-stone rounded-xl border p-8 text-center text-sm">
          {loading ? "Loading the form…" : "Pick a form to start."}
        </div>
      ) : draft.fields.length === 0 ? (
        <p className="border-hairline bg-canvas text-stone rounded-xl border p-6 text-sm">
          The form has no fields yet. Add them in the form builder first.
        </p>
      ) : humanSteps.length === 0 ? (
        <p className="border-hairline bg-canvas text-stone rounded-xl border p-6 text-sm">
          Visibility applies to steps people work on (approval, task,
          acknowledgement). Add one in the Path tab.
        </p>
      ) : (
        <div className="border-hairline bg-canvas overflow-x-auto rounded-xl border">
          <table className="w-full min-w-max border-collapse text-sm">
            <thead>
              <tr className="border-hairline border-b">
                <th
                  scope="col"
                  className="bg-canvas text-stone sticky left-0 z-10 min-w-56 px-4 py-3 text-left text-xs font-semibold"
                >
                  Field
                </th>
                {humanSteps.map((step) => {
                  const meta = STEP_META[step.type];
                  const Icon = meta.icon;
                  return (
                    <th
                      key={step.key}
                      scope="col"
                      className="min-w-40 px-3 py-3 text-left align-bottom"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "flex h-6 w-6 shrink-0 items-center justify-center rounded-md",
                            meta.tone,
                          )}
                        >
                          <Icon className="h-3.5 w-3.5" />
                        </span>
                        <span className="text-ink max-w-40 truncate text-xs font-semibold">
                          {stepName(step)}
                        </span>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger className="text-stone hover:text-ink mt-1 inline-flex items-center gap-0.5 text-[11px] font-medium">
                          Set all <ChevronDown className="h-3 w-3" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start">
                          <DropdownMenuLabel className="text-stone text-xs">
                            Every field at “{stepName(step)}”
                          </DropdownMenuLabel>
                          {MODES.map((mode) => (
                            <DropdownMenuItem
                              key={mode.value}
                              onSelect={() => {
                                let next = draft.perStepFieldState;
                                for (const field of draft.fields) {
                                  next = setCell(
                                    next,
                                    step.key,
                                    field.key,
                                    mode.value,
                                  );
                                }
                                update(next);
                              }}
                            >
                              {mode.label}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {draft.fields.map((field) => (
                <tr
                  key={field.key}
                  className="border-hairline-soft hover:bg-surface/40 border-b last:border-0"
                >
                  <th
                    scope="row"
                    className="bg-canvas sticky left-0 z-10 px-4 py-2 text-left font-normal"
                  >
                    <span className="text-ink block max-w-64 truncate text-sm">
                      {field.label || field.key}
                    </span>
                  </th>
                  {humanSteps.map((step) => {
                    const value =
                      draft.perStepFieldState[step.key]?.[field.key] ??
                      "EDITABLE";
                    const mode = MODES.find((m) => m.value === value)!;
                    const Icon = mode.icon;
                    return (
                      <td key={step.key} className="px-3 py-2">
                        <button
                          type="button"
                          onClick={() =>
                            update(
                              setCell(
                                draft.perStepFieldState,
                                step.key,
                                field.key,
                                NEXT_MODE[value],
                              ),
                            )
                          }
                          aria-label={`${field.label} at ${stepName(step)}: ${mode.label}. Click to change.`}
                          className={cn(
                            "inline-flex w-28 items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium transition-opacity hover:opacity-80",
                            mode.tone,
                          )}
                        >
                          <Icon className="h-3 w-3 shrink-0" /> {mode.label}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
