"use client";

import { useState, useEffect, useRef } from "react";
import { Check, ChevronsUpDown, LoaderCircle, Search, X } from "lucide-react";
import { evaluate, evaluateBoolean } from "@/lib/workflow/expression-client";
import type { Expression } from "@/core/domain/workflow";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import { DateField } from "./date-field";
import { RequestLinkPicker } from "./request-link-picker";

type FieldVisibility = "VISIBLE" | "HIDDEN" | "ADMINISTRATIVE";

interface FormFieldDef {
  key: string;
  label: string;
  type: string;
  required?: boolean;
  position: number;
  config?: Record<string, unknown>;
  visibilityRules?: Expression;
  computedFormula?: Expression;
  visibility?: FieldVisibility;
}

interface FormSchema {
  fields: FormFieldDef[];
  perStepFieldState?: Record<
    string,
    Record<string, "EDITABLE" | "READ_ONLY" | "HIDDEN">
  >;
}

interface UserOption {
  id: string;
  name: string | null;
  email: string;
}

export type FieldStateMap = Record<string, "EDITABLE" | "READ_ONLY" | "HIDDEN">;

interface FormRendererProps {
  schema: FormSchema;
  values: Record<string, unknown>;
  onChange: (next: Record<string, unknown>) => void;
  /** When set, overrides per-step state lookup for the given step key. */
  stepKey?: string;
  /** Override field state matrix entirely. */
  fieldStateOverride?: FieldStateMap;
  /** Org users for USER_PICKER. */
  users?: UserOption[];
  disabled?: boolean;
  /** Field keys that failed required-field validation; rendered with an error ring. */
  invalidFieldKeys?: string[];
  /** Resolved targetFormName → formId map for REQUEST_LINK fields. */
  formNameToId?: Record<string, string>;
  /**
   * Render audience.
   *  - "submit" (default): hides ADMINISTRATIVE fields (and HIDDEN ones).
   *  - "admin": shows ADMINISTRATIVE fields read-only; HIDDEN fields stay hidden.
   */
  mode?: "submit" | "admin";
  /** Values for SYSTEM_FIELD display (resolved server-side from requester identity). */
  systemFieldValues?: Record<string, string>;
}

function resolveFieldState(
  schema: FormSchema,
  stepKey: string | undefined,
  override: FieldStateMap | undefined,
  fieldKey: string,
): "EDITABLE" | "READ_ONLY" | "HIDDEN" {
  if (override && fieldKey in override) return override[fieldKey];
  if (stepKey && schema.perStepFieldState?.[stepKey]?.[fieldKey]) {
    return schema.perStepFieldState[stepKey][fieldKey];
  }
  return "EDITABLE";
}

export function FormRenderer({
  schema,
  values,
  onChange,
  stepKey,
  fieldStateOverride,
  users = [],
  disabled = false,
  invalidFieldKeys = [],
  formNameToId = {},
  mode = "submit",
  systemFieldValues = {},
}: FormRendererProps) {
  const invalidSet = new Set(invalidFieldKeys);
  const update = (key: string, value: unknown) => {
    onChange({ ...values, [key]: value });
  };

  const sortedFields = [...schema.fields].sort(
    (a, b) => a.position - b.position,
  );

  // Recompute COMPUTED fields whenever inputs change.
  const exprCtx = { fields: values };
  const computedValues: Record<string, unknown> = {};
  for (const field of sortedFields) {
    if (field.type === "COMPUTED" && field.computedFormula) {
      try {
        computedValues[field.key] = evaluate(field.computedFormula, exprCtx);
      } catch {
        computedValues[field.key] = null;
      }
    }
  }

  return (
    <div className="space-y-5">
      {sortedFields.map((field) => {
        const state = resolveFieldState(
          schema,
          stepKey,
          fieldStateOverride,
          field.key,
        );
        if (state === "HIDDEN") return null;

        // Form-level visibility — strongest filter.
        const visibility = field.visibility ?? "VISIBLE";
        if (visibility === "HIDDEN") return null;
        if (visibility === "ADMINISTRATIVE" && mode !== "admin") return null;

        // Runtime visibility rule — hidden wins over editable.
        if (field.visibilityRules) {
          try {
            if (!evaluateBoolean(field.visibilityRules, exprCtx)) return null;
          } catch {
            // If rule fails to evaluate, default to visible.
          }
        }

        const readOnly =
          state === "READ_ONLY" ||
          disabled ||
          (visibility === "ADMINISTRATIVE" && mode === "admin");
        const value =
          field.type === "COMPUTED"
            ? (computedValues[field.key] ?? null)
            : values[field.key];

        if (field.type === "SECTION_HEADER") {
          return (
            <div
              key={field.key}
              className="text-h5 mt-4 border-t border-[var(--color-hairline-soft)] pt-3 text-[var(--color-ink)]"
            >
              {field.label}
            </div>
          );
        }
        if (field.type === "CHECKBOX") {
          return (
            <div key={field.key} className="space-y-1">
              <label className="text-body-sm-medium inline-flex items-center gap-2 text-[var(--color-ink)]">
                <input
                  type="checkbox"
                  checked={value === true}
                  disabled={readOnly}
                  onChange={(e) => update(field.key, e.target.checked)}
                  className="custom-checkbox"
                />
                <span>
                  {field.label}
                  {field.required ? (
                    <span className="text-[var(--color-brand-blue)]"> *</span>
                  ) : null}
                </span>
              </label>
            </div>
          );
        }

        const isInvalid = invalidSet.has(field.key);
        const isAdminOnly = visibility === "ADMINISTRATIVE";
        return (
          <div key={field.key} className="space-y-2">
            <label className="text-body-sm-medium flex flex-wrap items-center gap-2 text-[var(--color-ink)]">
              <span>
                {field.label}
                {field.required ? (
                  <span className="text-[var(--color-brand-blue)]"> *</span>
                ) : null}
              </span>
              {isAdminOnly ? (
                <span className="rounded-full bg-[var(--color-yellow-light)] px-1.5 py-0.5 text-[10px] font-semibold text-[var(--color-yellow-dark)]">
                  Admin only
                </span>
              ) : null}
            </label>
            <div
              className={
                isInvalid
                  ? "rounded-md ring-2 ring-[var(--color-brand-red-dark)] ring-offset-2 ring-offset-[var(--color-canvas)]"
                  : ""
              }
            >
              <FieldInput
                field={field}
                value={value}
                readOnly={readOnly}
                users={users}
                onChange={(v) => update(field.key, v)}
                formNameToId={formNameToId}
                systemFieldValues={systemFieldValues}
              />
            </div>
            {isInvalid ? (
              <p className="text-caption text-[var(--color-coral-dark)]">
                This field is required.
              </p>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

function FieldInput({
  field,
  value,
  readOnly,
  users,
  onChange,
  formNameToId,
  systemFieldValues = {},
}: {
  field: FormFieldDef;
  value: unknown;
  readOnly: boolean;
  users: UserOption[];
  onChange: (value: unknown) => void;
  formNameToId: Record<string, string>;
  systemFieldValues?: Record<string, string>;
}) {
  const inputBase =
    "h-11 w-full rounded-md border border-[var(--color-hairline-strong)] bg-[var(--color-canvas)] px-4 text-body-md text-[var(--color-ink)] outline-none transition-colors placeholder:text-[var(--color-stone)] focus:border-[var(--color-brand-blue)] focus:ring-1 focus:ring-[var(--color-brand-blue)]";
  const textareaBase =
    "w-full rounded-md border border-[var(--color-hairline-strong)] bg-[var(--color-canvas)] px-4 py-3 text-body-md text-[var(--color-ink)] outline-none transition-colors placeholder:text-[var(--color-stone)] focus:border-[var(--color-brand-blue)] focus:ring-1 focus:ring-[var(--color-brand-blue)]";
  const ro = readOnly
    ? " bg-[var(--color-surface-soft)] text-[var(--color-stone)] cursor-not-allowed"
    : "";

  switch (field.type) {
    case "SHORT_TEXT":
      return (
        <input
          type="text"
          className={inputBase + ro}
          value={(value as string | undefined) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          disabled={readOnly}
        />
      );
    case "LONG_TEXT":
      return (
        <textarea
          className={textareaBase + ro}
          rows={4}
          value={(value as string | undefined) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          disabled={readOnly}
        />
      );
    case "NUMBER":
      return (
        <input
          type="number"
          className={inputBase + ro}
          value={(value as number | undefined) ?? ""}
          onChange={(e) =>
            onChange(e.target.value === "" ? null : Number(e.target.value))
          }
          disabled={readOnly}
        />
      );
    case "DATE":
      return (
        <DateField
          value={value as string | undefined}
          onChange={onChange}
          readOnly={readOnly}
        />
      );
    case "REQUEST_LINK": {
      const targetName =
        (field.config?.targetFormName as string | undefined) ?? "";
      const targetFormId =
        (field.config?.targetFormId as string | undefined) ??
        (targetName ? formNameToId[targetName] : "") ??
        "";
      if (!targetFormId) {
        return (
          <p className="text-caption rounded-md border border-[var(--color-hairline)] bg-[var(--color-surface-soft)] px-3 py-2 text-[var(--color-stone)]">
            REQUEST_LINK target form is not configured. Set
            <code className="mx-1">config.targetFormName</code> on this field.
          </p>
        );
      }
      return (
        <RequestLinkPicker
          value={value as string | undefined}
          onChange={onChange}
          targetFormId={targetFormId}
          readOnly={readOnly}
          placeholder={`Pick a ${targetName || "request"}`}
        />
      );
    }
    case "DATETIME":
      return (
        <DateField
          value={value as string | undefined}
          onChange={onChange}
          readOnly={readOnly}
          withTime
        />
      );
    case "DROPDOWN": {
      const options = (field.config?.options as string[] | undefined) ?? [];
      return (
        <select
          className={
            inputBase +
            ro +
            " appearance-none bg-[length:16px_16px] bg-[right_16px_center] bg-no-repeat pr-10"
          }
          style={{ backgroundImage: "var(--select-chevron)" }}
          value={(value as string | undefined) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          disabled={readOnly}
        >
          <option value="">— Select —</option>
          {options.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      );
    }
    case "MULTI_SELECT": {
      const options = (field.config?.options as string[] | undefined) ?? [];
      const arr = Array.isArray(value) ? (value as string[]) : [];
      return (
        <div className="flex flex-wrap gap-2">
          {options.map((o) => {
            const checked = arr.includes(o);
            return (
              <label
                key={o}
                className={`text-caption-bold inline-flex cursor-pointer items-center gap-1 rounded-full border px-3 py-1 transition-colors ${
                  checked
                    ? "border-[var(--color-brand-blue)] bg-[var(--color-surface-featured)] text-[var(--color-brand-blue)]"
                    : "border-[var(--color-hairline)] bg-[var(--color-canvas)] text-[var(--color-charcoal)]"
                }`}
              >
                <input
                  type="checkbox"
                  className="hidden"
                  checked={checked}
                  disabled={readOnly}
                  onChange={() => {
                    const next = checked
                      ? arr.filter((x) => x !== o)
                      : [...arr, o];
                    onChange(next);
                  }}
                />
                {o}
              </label>
            );
          })}
        </div>
      );
    }
    case "USER_PICKER":
      return (
        <select
          className={
            inputBase +
            ro +
            " appearance-none bg-[length:16px_16px] bg-[right_16px_center] bg-no-repeat pr-10"
          }
          style={{ backgroundImage: "var(--select-chevron)" }}
          value={(value as string | undefined) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          disabled={readOnly}
        >
          <option value="">— Select user —</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name || u.email}
            </option>
          ))}
        </select>
      );
    case "FILE":
      return (
        <input
          type="text"
          className={inputBase + ro}
          placeholder="Attachment URL or reference"
          value={(value as string | undefined) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          disabled={readOnly}
        />
      );
    case "COMPUTED":
      return (
        <div
          className={
            inputBase +
            " flex cursor-not-allowed items-center bg-[var(--color-surface-soft)] text-[var(--color-charcoal)]"
          }
        >
          {value === null || value === undefined ? "—" : String(value)}
        </div>
      );
    case "SYSTEM_FIELD": {
      const systemKey =
        (field.config as { systemField?: string } | undefined)?.systemField ??
        "";
      const displayValue = systemFieldValues[systemKey] ?? "(not available)";
      return (
        <div
          className={
            inputBase +
            " flex cursor-not-allowed items-center bg-[var(--color-surface-soft)] text-[var(--color-charcoal)]"
          }
        >
          {displayValue}
        </div>
      );
    }
    case "LOOKUP": {
      const cfg = (field.config ?? {}) as {
        dataSource?: string;
        options?: Array<{ value: string; label: string }> | string[];
      };
      if (cfg.dataSource === "ACCESS_SERVICES") {
        return (
          <AccessServiceCombobox
            value={(value as string | undefined) ?? ""}
            onChange={onChange}
            readOnly={readOnly}
            inputBase={inputBase}
            ro={ro}
          />
        );
      }
      const raw = cfg.options ?? [];
      const opts = raw.map((o) =>
        typeof o === "string" ? { value: o, label: o } : o,
      );
      return (
        <select
          className={
            inputBase +
            ro +
            " appearance-none bg-[length:16px_16px] bg-[right_16px_center] bg-no-repeat pr-10"
          }
          style={{ backgroundImage: "var(--select-chevron)" }}
          value={(value as string | undefined) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          disabled={readOnly}
        >
          <option value="">— Select —</option>
          {opts.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      );
    }
    case "REPEATER": {
      const cfg = (field.config ?? {}) as {
        subFields?: Array<{ key: string; label: string; type: string }>;
        minRows?: number;
        maxRows?: number;
      };
      const subFields = cfg.subFields ?? [];
      const rows = (
        Array.isArray(value) ? (value as Record<string, unknown>[]) : []
      ) as Record<string, unknown>[];
      const minRows = cfg.minRows ?? 0;
      const maxRows = cfg.maxRows ?? 50;

      function update(rows2: Record<string, unknown>[]) {
        onChange(rows2);
      }
      function addRow() {
        if (rows.length >= maxRows) return;
        update([...rows, {}]);
      }
      function removeRow(idx: number) {
        if (rows.length <= minRows) return;
        update(rows.filter((_, i) => i !== idx));
      }
      function updateCell(idx: number, key: string, v: unknown) {
        update(rows.map((r, i) => (i === idx ? { ...r, [key]: v } : r)));
      }

      return (
        <div className="space-y-2">
          {rows.length === 0 ? (
            <p className="text-caption text-[var(--color-stone)]">
              No rows yet.
            </p>
          ) : (
            <ul className="space-y-2">
              {rows.map((row, idx) => (
                <li
                  key={idx}
                  className="rounded-md border border-[var(--color-hairline)] bg-[var(--color-surface-soft)] p-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-caption text-[var(--color-stone)]">
                      Row {idx + 1}
                    </span>
                    <button
                      type="button"
                      disabled={readOnly || rows.length <= minRows}
                      onClick={() => removeRow(idx)}
                      className="rounded-full border border-[var(--color-hairline)] px-2 py-0.5 text-[10px] text-[var(--color-coral-dark)] disabled:opacity-30"
                    >
                      Remove
                    </button>
                  </div>
                  <div className="mt-2 grid gap-2 md:grid-cols-2">
                    {subFields.map((sf) => (
                      <div key={sf.key} className="space-y-1">
                        <label className="text-caption text-[var(--color-charcoal)]">
                          {sf.label}
                        </label>
                        <input
                          type={sf.type === "NUMBER" ? "number" : "text"}
                          value={
                            (row[sf.key] as string | number | undefined) ?? ""
                          }
                          onChange={(e) => {
                            const val =
                              sf.type === "NUMBER"
                                ? e.target.value === ""
                                  ? null
                                  : Number(e.target.value)
                                : e.target.value;
                            updateCell(idx, sf.key, val);
                          }}
                          disabled={readOnly}
                          className={inputBase + ro}
                        />
                      </div>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
          )}
          <button
            type="button"
            disabled={readOnly || rows.length >= maxRows}
            onClick={addRow}
            className="text-caption-bold inline-flex items-center rounded-full border border-[var(--color-hairline)] bg-[var(--color-canvas)] px-3 py-1 text-[var(--color-charcoal)] hover:bg-[var(--color-surface-soft)] disabled:opacity-50"
          >
            + Add row
          </button>
        </div>
      );
    }
    case "SCORED_MATRIX": {
      const cfg = (field.config ?? {}) as {
        rows?: Array<{ key: string; label: string; weight?: number }>;
        columns?: Array<{ key: string; label: string; weight?: number }>;
      };
      const rows = cfg.rows ?? [];
      const columns = cfg.columns ?? [];
      const sel = (
        value && typeof value === "object"
          ? (value as { row?: string; column?: string; score?: number })
          : {}
      ) as { row?: string; column?: string; score?: number };

      function pick(rowKey: string, colKey: string) {
        const row = rows.find((r) => r.key === rowKey);
        const col = columns.find((c) => c.key === colKey);
        const score = (row?.weight ?? 0) * (col?.weight ?? 0);
        onChange({ row: rowKey, column: colKey, score });
      }

      return (
        <div className="rounded-md border border-[var(--color-hairline)] bg-[var(--color-canvas)] p-3">
          {rows.length === 0 || columns.length === 0 ? (
            <p className="text-caption text-[var(--color-stone)]">
              Configure rows and columns in the field settings.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="text-caption">
                <thead>
                  <tr>
                    <th className="px-2 py-1"></th>
                    {columns.map((c) => (
                      <th
                        key={c.key}
                        className="px-2 py-1 font-medium text-[var(--color-charcoal)]"
                      >
                        {c.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.key}>
                      <td className="px-2 py-1 font-medium text-[var(--color-charcoal)]">
                        {r.label}
                      </td>
                      {columns.map((c) => {
                        const checked =
                          sel.row === r.key && sel.column === c.key;
                        return (
                          <td key={c.key} className="px-1 py-1">
                            <button
                              type="button"
                              disabled={readOnly}
                              onClick={() => pick(r.key, c.key)}
                              className={
                                "h-9 min-w-[44px] rounded-md border px-3 transition-colors " +
                                (checked
                                  ? "border-[var(--color-brand-blue)] bg-[var(--color-surface-featured)] text-[var(--color-brand-blue)]"
                                  : "border-[var(--color-hairline-soft)] bg-[var(--color-canvas)] hover:bg-[var(--color-surface-soft)]")
                              }
                            >
                              {(r.weight ?? 0) * (c.weight ?? 0) || ""}
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
          {sel.score !== undefined ? (
            <p className="text-caption mt-3 text-[var(--color-stone)]">
              Score:{" "}
              <span className="text-h5 text-[var(--color-ink)]">
                {sel.score}
              </span>
            </p>
          ) : null}
        </div>
      );
    }
    default:
      return (
        <input
          type="text"
          className={inputBase + ro}
          value={
            typeof value === "string"
              ? value
              : value == null
                ? ""
                : String(value)
          }
          onChange={(e) => onChange(e.target.value)}
          disabled={readOnly}
        />
      );
  }
}

interface AccessServiceOption {
  id: string;
  label: string;
  publicMetadata: {
    requireManagerApproval?: boolean;
    instructions?: string | null;
  };
}

function AccessServiceCombobox({
  value,
  onChange,
  readOnly,
  inputBase,
  ro,
}: {
  value: string;
  onChange: (v: unknown) => void;
  readOnly: boolean;
  inputBase: string;
  ro: string;
}) {
  const [query, setQuery] = useState("");
  const [options, setOptions] = useState<AccessServiceOption[]>([]);
  // Cache of resolved options by id — never cleared synchronously in effects
  const [resolved, setResolved] = useState<Record<string, AccessServiceOption>>(
    {},
  );
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestRef = useRef<AbortController | null>(null);
  const optionsCacheRef = useRef(new Map<string, AccessServiceOption[]>());

  // Derived: the currently selected option (null when value is empty or not yet resolved)
  const selected = value ? (resolved[value] ?? null) : null;

  // Resolve label for current value on mount / value change
  useEffect(() => {
    if (!value || resolved[value]) return;
    fetch(
      `/api/workflow/lookups/ACCESS_SERVICES?id=${encodeURIComponent(value)}`,
    )
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { results?: AccessServiceOption[] } | null) => {
        const match = data?.results?.find((o) => o.id === value);
        if (match) setResolved((prev) => ({ ...prev, [value]: match }));
      })
      .catch(() => null);
  }, [value, resolved]);

  useEffect(() => {
    // Prefetch the default list while the form renders. Search results are
    // cached by query so reopening the picker never flashes a loading state.
    if (optionsCacheRef.current.has(query)) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(
      () => {
        requestRef.current?.abort();
        const controller = new AbortController();
        requestRef.current = controller;
        setLoading(true);
        fetch(
          `/api/workflow/lookups/ACCESS_SERVICES?q=${encodeURIComponent(query)}&limit=20`,
          { signal: controller.signal },
        )
          .then((r) => (r.ok ? r.json() : { results: [] }))
          .then((data: { results: AccessServiceOption[] }) => {
            const results = data.results ?? [];
            optionsCacheRef.current.set(query, results);
            setOptions(results);
            // Cache resolved options so label lookups stay fast
            setResolved((prev) => {
              const next = { ...prev };
              for (const o of data.results ?? []) next[o.id] = o;
              return next;
            });
          })
          .catch((error: unknown) => {
            if (!(
              error instanceof DOMException && error.name === "AbortError"
            )) {
              setOptions([]);
            }
          })
          .finally(() => {
            if (requestRef.current === controller) setLoading(false);
          });
      },
      query ? 250 : 0,
    );
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      requestRef.current?.abort();
    };
  }, [query]);

  const instructions = selected?.publicMetadata?.instructions;

  if (readOnly) {
    return (
      <div
        className={
          inputBase +
          " flex cursor-not-allowed items-center bg-[var(--color-surface-soft)] text-[var(--color-charcoal)]"
        }
      >
        {selected?.label ?? (value || "—")}
      </div>
    );
  }

  return (
    <div>
      <Popover
        open={open}
        onOpenChange={(nextOpen) => {
          setOpen(nextOpen);
          if (!nextOpen) {
            setQuery("");
            setOptions(optionsCacheRef.current.get("") ?? options);
            setLoading(false);
          }
        }}
      >
        <PopoverTrigger asChild>
          <button
            type="button"
            role="combobox"
            aria-expanded={open}
            aria-label="Select a service"
            className={
              inputBase +
              ro +
              " flex w-full cursor-pointer items-center justify-between gap-3 text-left"
            }
          >
            <span
              className={
                selected
                  ? "truncate font-medium text-[var(--color-ink)]"
                  : "truncate text-[var(--color-stone)]"
              }
            >
              {selected ? selected.label : "Select a service"}
            </span>
            <ChevronsUpDown className="h-4 w-4 shrink-0 text-[var(--color-stone)]" />
          </button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          className="z-[70] w-[--radix-popover-trigger-width] overflow-hidden rounded-lg border border-[var(--color-hairline-strong)] bg-[var(--color-canvas)] p-0 shadow-lg"
        >
          <div className="relative border-b border-[var(--color-hairline-soft)] p-2">
            <Search className="pointer-events-none absolute top-1/2 left-5 h-4 w-4 -translate-y-1/2 text-[var(--color-stone)]" />
            <input
              autoFocus
              type="text"
              className="text-body-sm h-10 w-full rounded-md border border-[var(--color-hairline-strong)] bg-[var(--color-canvas)] pr-3 pl-9 text-[var(--color-ink)] outline-none focus:border-transparent focus:ring-2 focus:ring-[var(--color-brand-yellow)]"
              placeholder="Search by service name…"
              value={query}
              onChange={(e) => {
                const nextQuery = e.target.value;
                const cached = optionsCacheRef.current.get(nextQuery);
                if (cached) {
                  setOptions(cached);
                  setLoading(false);
                }
                setQuery(nextQuery);
              }}
            />
          </div>
          <ul className="max-h-64 overflow-y-auto p-1">
            {loading ? (
              <li className="text-body-sm flex items-center justify-center gap-2 px-3 py-8 text-[var(--color-stone)]">
                <LoaderCircle className="h-4 w-4 animate-spin" />
                Loading services…
              </li>
            ) : options.length === 0 ? (
              <li className="text-body-sm px-3 py-8 text-center text-[var(--color-stone)]">
                {query ? "No matching services found" : "No services available"}
              </li>
            ) : (
              options.map((opt) => (
                <li key={opt.id}>
                  <button
                    type="button"
                    className="text-body-sm flex w-full cursor-pointer items-start gap-2 rounded-md px-3 py-2.5 text-left text-[var(--color-ink)] hover:bg-[var(--color-surface-soft)] focus:bg-[var(--color-surface-soft)] focus:outline-none"
                    onClick={() => {
                      setResolved((prev) => ({ ...prev, [opt.id]: opt }));
                      onChange(opt.id);
                      setOpen(false);
                      setQuery("");
                    }}
                  >
                    <Check
                      className={
                        value === opt.id
                          ? "mt-0.5 h-4 w-4 shrink-0 text-[var(--color-brand-blue)]"
                          : "mt-0.5 h-4 w-4 shrink-0 opacity-0"
                      }
                    />
                    <span className="min-w-0">
                      <span className="block truncate font-medium">
                        {opt.label}
                      </span>
                      {opt.publicMetadata.instructions ? (
                        <span className="text-caption mt-0.5 line-clamp-2 block text-[var(--color-stone)]">
                          {opt.publicMetadata.instructions}
                        </span>
                      ) : null}
                    </span>
                  </button>
                </li>
              ))
            )}
          </ul>
          {selected && (
            <div className="border-t border-[var(--color-hairline-soft)] p-2">
              <button
                type="button"
                className="text-caption flex w-full items-center justify-center gap-1.5 rounded-md px-3 py-2 text-[var(--color-coral-dark)] hover:bg-[var(--color-surface-soft)]"
                onClick={() => {
                  onChange("");
                  setOpen(false);
                }}
              >
                <X className="h-3.5 w-3.5" />
                Clear selection
              </button>
            </div>
          )}
        </PopoverContent>
      </Popover>
      {instructions ? (
        <div className="mt-2 rounded-md border border-[var(--color-hairline-soft)] bg-[var(--color-surface-soft)] px-3 py-2">
          <p className="text-caption text-[var(--color-stone)]">
            {instructions}
          </p>
        </div>
      ) : null}
    </div>
  );
}
