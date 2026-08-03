"use client";

import * as PopoverPrimitive from "@radix-ui/react-popover";
import { Check, ChevronDown, Search } from "lucide-react";
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

interface RequestOption {
  id: string;
  referenceNumber: string | null;
  status: string;
  outcome: string | null;
  requester: string | null;
  createdAt: string;
}

interface PickerResponse {
  requests: RequestOption[];
}

/**
 * Searchable picker for REQUEST_LINK fields. Stores the selected request's
 * id as the field value (so cascade and link rows can resolve it on submit).
 * The label shown to the user is `referenceNumber`.
 */
export function RequestLinkPicker({
  value,
  onChange,
  targetFormId,
  readOnly = false,
  placeholder = "Pick a request",
}: {
  value: string | undefined;
  onChange: (id: string) => void;
  targetFormId: string;
  readOnly?: boolean;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<RequestOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<RequestOption | null>(null);

  // Fetch the currently-selected request so we can label the trigger button.
  useEffect(() => {
    if (!value || !targetFormId) return;
    if (selected?.id === value) return;
    let stopped = false;
    fetch(`/api/workflow/forms/${targetFormId}/requests?includeFinal=1`)
      .then((r) => r.json())
      .then((data: PickerResponse) => {
        if (stopped) return;
        const hit = data.requests.find((r) => r.id === value);
        if (hit) setSelected(hit);
      })
      .catch(() => {});
    return () => {
      stopped = true;
    };
  }, [value, targetFormId, selected]);

  // Search whenever the popover opens or the query changes.
  useEffect(() => {
    if (!open || !targetFormId) return;
    let stopped = false;
    const url = `/api/workflow/forms/${targetFormId}/requests${search ? `?q=${encodeURIComponent(search)}` : ""}`;
    Promise.resolve().then(() => {
      if (!stopped) setLoading(true);
    });
    fetch(url)
      .then((r) => r.json())
      .then((data: PickerResponse) => {
        if (!stopped) setItems(data.requests);
      })
      .catch(() => {
        if (!stopped) setItems([]);
      })
      .finally(() => {
        if (!stopped) setLoading(false);
      });
    return () => {
      stopped = true;
    };
  }, [open, search, targetFormId]);

  const displaySelected = selected && selected.id === value ? selected : null;
  const triggerLabel = displaySelected
    ? (displaySelected.referenceNumber ?? displaySelected.id.slice(0, 8))
    : "";

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
      <PopoverPrimitive.Trigger asChild>
        <button
          type="button"
          disabled={readOnly}
          className={cn(
            "text-body-sm flex h-10 w-full items-center justify-between gap-2 rounded-md border px-3 transition-colors",
            "border-[var(--color-hairline)] bg-[var(--color-canvas)] text-[var(--color-ink)] hover:border-[var(--color-hairline-strong)]",
            "focus:border-transparent focus:ring-2 focus:ring-[var(--color-brand-yellow)] focus:outline-none",
            !triggerLabel && "text-[var(--color-stone)]",
            readOnly &&
              "cursor-not-allowed bg-[var(--color-surface-soft)] text-[var(--color-stone)]",
          )}
        >
          <span className="truncate text-left">
            {triggerLabel ? (
              <span className="inline-flex items-center gap-2">
                <span className="text-body-sm-medium font-mono text-[var(--color-ink)]">
                  {triggerLabel}
                </span>
                {displaySelected?.requester ? (
                  <span className="text-caption text-[var(--color-stone)]">
                    · {displaySelected.requester}
                  </span>
                ) : null}
              </span>
            ) : (
              placeholder
            )}
          </span>
          <ChevronDown
            className="h-4 w-4 shrink-0 text-[var(--color-stone)]"
            strokeWidth={1.75}
          />
        </button>
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          align="start"
          sideOffset={6}
          className="data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 z-50 w-[var(--radix-popover-trigger-width)] min-w-[320px] overflow-hidden rounded-xl border border-[var(--color-hairline)] bg-[var(--color-canvas)] shadow-[var(--shadow-3)]"
        >
          <div className="flex items-center gap-2 border-b border-[var(--color-hairline-soft)] px-3 py-2">
            <Search
              className="h-4 w-4 shrink-0 text-[var(--color-stone)]"
              strokeWidth={1.75}
            />
            <input
              type="text"
              autoFocus
              placeholder="Search by reference number…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="text-body-sm flex-1 bg-transparent text-[var(--color-ink)] placeholder:text-[var(--color-stone)] focus:outline-none"
            />
          </div>
          <div className="max-h-[320px] overflow-y-auto">
            {loading ? (
              <div className="text-body-sm px-3 py-6 text-center text-[var(--color-stone)]">
                Loading…
              </div>
            ) : items.length === 0 ? (
              <div className="text-body-sm px-3 py-6 text-center text-[var(--color-stone)]">
                No matching requests.
              </div>
            ) : (
              <ul className="py-1">
                {items.map((r) => {
                  const isSelected = r.id === value;
                  return (
                    <li key={r.id}>
                      <button
                        type="button"
                        onClick={() => {
                          onChange(r.id);
                          setSelected(r);
                          setOpen(false);
                        }}
                        className={cn(
                          "flex w-full items-center gap-3 px-3 py-2 text-left transition hover:bg-[var(--color-surface-soft)]",
                          isSelected && "bg-[var(--color-yellow-light)]",
                        )}
                      >
                        <Check
                          className={cn(
                            "h-4 w-4 shrink-0",
                            isSelected
                              ? "text-[var(--color-brand-yellow-deep)]"
                              : "opacity-0",
                          )}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-body-sm-medium truncate font-mono text-[var(--color-ink)]">
                            {r.referenceNumber ?? r.id.slice(0, 12)}
                          </p>
                          <p className="text-caption truncate text-[var(--color-stone)]">
                            {r.status}
                            {r.outcome ? ` · ${r.outcome}` : ""}
                            {r.requester ? ` · by ${r.requester}` : ""}
                          </p>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
          {value ? (
            <div className="border-t border-[var(--color-hairline-soft)] px-3 py-2 text-right">
              <button
                type="button"
                onClick={() => {
                  onChange("");
                  setSelected(null);
                }}
                className="text-caption-bold text-[var(--color-stone)] hover:text-[var(--color-ink)]"
              >
                Clear selection
              </button>
            </div>
          ) : null}
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}
