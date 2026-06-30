"use client";

import { Eye, EyeOff, Pencil } from "lucide-react";

import { Card } from "@/components/design";
import { cn } from "@/lib/utils";

export type FieldStateValue = "EDITABLE" | "READ_ONLY" | "HIDDEN";

export interface FieldOption {
  key: string;
  label: string;
}

interface ModeMeta {
  value: FieldStateValue;
  label: string;
  shortLabel: string;
  icon: typeof Eye;
  /** Active classes — solid pill look. */
  active: string;
  /** Subtle dot color shown next to the label. */
  dot: string;
}

const MODES: ReadonlyArray<ModeMeta> = [
  {
    value: "EDITABLE",
    label: "Editable",
    shortLabel: "Edit",
    icon: Pencil,
    active: "bg-[var(--color-mint-light)] text-[var(--color-moss-dark)]",
    dot: "bg-[var(--color-brand-teal)]",
  },
  {
    value: "READ_ONLY",
    label: "Read-only",
    shortLabel: "Read",
    icon: Eye,
    active: "bg-[var(--color-sky-light)] text-[var(--color-blue-pressed)]",
    dot: "bg-[var(--color-brand-blue)]",
  },
  {
    value: "HIDDEN",
    label: "Hidden",
    shortLabel: "Hide",
    icon: EyeOff,
    active: "bg-[var(--color-blush-light)] text-[var(--color-coral-dark)]",
    dot: "bg-[var(--color-coral-dark)]",
  },
];

export function StepFieldVisibilityCard({
  stepKey,
  stepLabel,
  fields,
  state,
  onChange,
}: {
  stepKey: string;
  stepLabel?: string;
  fields: FieldOption[];
  state: Record<string, FieldStateValue> | undefined;
  onChange: (next: Record<string, FieldStateValue>) => void;
}) {
  const get = (key: string): FieldStateValue =>
    (state?.[key] ?? "EDITABLE") as FieldStateValue;

  const setOne = (key: string, value: FieldStateValue) => {
    const next = { ...(state ?? {}) };
    if (value === "EDITABLE") {
      delete next[key];
    } else {
      next[key] = value;
    }
    onChange(next);
  };

  const setAll = (value: FieldStateValue) => {
    if (value === "EDITABLE") {
      onChange({});
      return;
    }
    const next: Record<string, FieldStateValue> = {};
    for (const f of fields) next[f.key] = value;
    onChange(next);
  };

  const counts = fields.reduce(
    (acc, f) => {
      acc[get(f.key)] += 1;
      return acc;
    },
    { EDITABLE: 0, READ_ONLY: 0, HIDDEN: 0 } as Record<FieldStateValue, number>,
  );

  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <span className="text-micro-uppercase text-[var(--color-stone)]">
            Step
          </span>
          <h3 className="text-h5 text-[var(--color-ink)]">
            {stepLabel ?? stepKey}
          </h3>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {MODES.map((m) => (
            <CountPill key={m.value} mode={m} count={counts[m.value]} />
          ))}
        </div>
      </div>

      {fields.length === 0 ? (
        <p className="mt-4 rounded-md bg-[var(--color-surface-soft)] p-4 text-center text-body-sm text-[var(--color-stone)]">
          Add fields to the form first.
        </p>
      ) : (
        <ul className="mt-4 divide-y divide-[var(--color-hairline-soft)] rounded-xl border border-[var(--color-hairline-soft)]">
          {fields.map((f) => {
            const cur = get(f.key);
            const meta = MODES.find((m) => m.value === cur)!;
            return (
              <li
                key={f.key}
                className="flex flex-wrap items-center gap-3 px-3 py-2.5 transition hover:bg-[var(--color-surface-soft)]"
              >
                <span
                  aria-hidden
                  className={cn("h-2 w-2 shrink-0 rounded-full", meta.dot)}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-body-sm-medium text-[var(--color-ink)]">
                    {f.label || f.key}
                  </p>
                  {f.label ? (
                    <p className="truncate font-mono text-[11px] text-[var(--color-stone)]">
                      {f.key}
                    </p>
                  ) : null}
                </div>

                <SegmentedToggle
                  value={cur}
                  onChange={(v) => setOne(f.key, v)}
                  fieldLabel={f.label || f.key}
                />
              </li>
            );
          })}
        </ul>
      )}

      {fields.length > 0 ? (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[var(--color-hairline-soft)] bg-[var(--color-surface-soft)] px-3 py-2.5">
          <p className="text-caption text-[var(--color-stone)]">
            Apply to all fields on{" "}
            <span className="font-mono text-[var(--color-charcoal)]">
              {stepKey}
            </span>
          </p>
          <div className="flex flex-wrap gap-1.5">
            {MODES.map((m) => {
              const Icon = m.icon;
              return (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => setAll(m.value)}
                  className={cn(
                    "group inline-flex items-center gap-1.5 rounded-full border border-[var(--color-hairline)] bg-[var(--color-canvas)] px-3 py-1 text-caption-bold text-[var(--color-charcoal)] transition",
                    "hover:border-transparent",
                    m.value === "EDITABLE" &&
                      "hover:bg-[var(--color-mint-light)] hover:text-[var(--color-moss-dark)]",
                    m.value === "READ_ONLY" &&
                      "hover:bg-[var(--color-sky-light)] hover:text-[var(--color-blue-pressed)]",
                    m.value === "HIDDEN" &&
                      "hover:bg-[var(--color-blush-light)] hover:text-[var(--color-coral-dark)]",
                  )}
                >
                  <Icon className="h-3.5 w-3.5" strokeWidth={2} />
                  <span>{m.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </Card>
  );
}

function SegmentedToggle({
  value,
  onChange,
  fieldLabel,
}: {
  value: FieldStateValue;
  onChange: (next: FieldStateValue) => void;
  fieldLabel: string;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={`Visibility for ${fieldLabel}`}
      className="inline-flex shrink-0 items-center gap-0.5 rounded-full border border-[var(--color-hairline-soft)] bg-[var(--color-surface-soft)] p-0.5"
    >
      {MODES.map((m) => {
        const active = value === m.value;
        const Icon = m.icon;
        return (
          <button
            key={m.value}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={`Mark ${fieldLabel} as ${m.label}`}
            title={m.label}
            onClick={() => onChange(m.value)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-caption-bold transition",
              active
                ? `${m.active} shadow-[var(--shadow-1)]`
                : "text-[var(--color-stone)] hover:bg-[var(--color-canvas)] hover:text-[var(--color-ink)]",
            )}
          >
            <Icon className="h-3.5 w-3.5" strokeWidth={2} />
            <span className="hidden sm:inline">{m.shortLabel}</span>
          </button>
        );
      })}
    </div>
  );
}

function CountPill({ mode, count }: { mode: ModeMeta; count: number }) {
  const Icon = mode.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-caption-bold",
        count > 0
          ? mode.active
          : "border border-[var(--color-hairline)] bg-[var(--color-canvas)] text-[var(--color-stone)]",
      )}
    >
      <Icon className="h-3 w-3" strokeWidth={2} />
      {count} {mode.label.toLowerCase()}
    </span>
  );
}
