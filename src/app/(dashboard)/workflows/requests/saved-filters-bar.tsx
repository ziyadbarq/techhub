"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button, confirm, Select, TextInput } from "@/components/design";

interface SavedFilter {
  id: string;
  name: string;
  filter: Record<string, unknown>;
}

interface FormOption {
  id: string;
  name: string;
}

function toQuery(filter: Record<string, unknown>): string {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(filter)) {
    if (v !== undefined && v !== null && v !== "") {
      params.set(k, String(v));
    }
  }
  return params.toString();
}

export function SavedFiltersBar({
  filters,
  currentFilter,
  forms,
}: {
  filters: SavedFilter[];
  currentFilter: Record<string, unknown>;
  forms: FormOption[];
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [showSave, setShowSave] = useState(false);

  async function save() {
    if (!name.trim()) return;
    setBusy("save");
    try {
      await fetch("/api/workflow/saved-filters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), filter: currentFilter }),
      });
      setName("");
      setShowSave(false);
      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  async function remove(id: string) {
    if (
      !(await confirm({
        title: "Delete saved filter?",
        message: "This filter will be removed from your list.",
        confirmLabel: "Delete",
        danger: true,
      }))
    )
      return;
    setBusy(id);
    try {
      await fetch(`/api/workflow/saved-filters/${id}`, { method: "DELETE" });
      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  function applyFormFilter(formId: string) {
    const next = { ...currentFilter, formId: formId || undefined };
    if (!formId) delete next.formId;
    router.push(`?${toQuery(next)}`);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select
        value={(currentFilter.formId as string | undefined) ?? ""}
        onChange={(e) => applyFormFilter(e.target.value)}
        className="h-9 max-w-xs"
      >
        <option value="">All forms</option>
        {forms.map((f) => (
          <option key={f.id} value={f.id}>
            {f.name}
          </option>
        ))}
      </Select>

      {filters.length > 0 ? (
        <div className="flex flex-wrap items-center gap-1">
          <span className="text-micro-uppercase text-stone">Saved</span>
          {filters.map((f) => (
            <span
              key={f.id}
              className="inline-flex items-center gap-1 rounded-full border border-[var(--color-hairline)] bg-[var(--color-canvas)] pl-3 pr-1 py-0.5"
            >
              <Link
                href={`?${toQuery(f.filter)}`}
                className="text-caption-bold text-[var(--color-charcoal)]"
              >
                {f.name}
              </Link>
              <button
                onClick={() => remove(f.id)}
                disabled={busy === f.id}
                className="rounded-full px-1.5 text-caption text-[var(--color-coral-dark)] hover:bg-[var(--color-brand-red)]/30 disabled:opacity-30"
                aria-label="Delete filter"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      ) : null}

      {showSave ? (
        <div className="flex items-center gap-1">
          <TextInput
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Filter name"
            className="h-9 w-40"
            autoFocus
          />
          <Button
            onClick={save}
            disabled={!name.trim() || busy === "save"}
            variant="primary"
            size="sm"
          >
            Save
          </Button>
          <Button
            onClick={() => setShowSave(false)}
            variant="ghost"
            size="sm"
          >
            Cancel
          </Button>
        </div>
      ) : (
        <Button
          onClick={() => setShowSave(true)}
          variant="secondary"
          size="sm"
        >
          Save filter
        </Button>
      )}
    </div>
  );
}
