"use client";

import * as PopoverPrimitive from "@radix-ui/react-popover";
import { Calendar as CalendarIcon } from "lucide-react";
import { useState } from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/style.css";

import { cn } from "@/lib/utils";

/**
 * Miro-themed date picker. Stores values as `YYYY-MM-DD` strings (matching
 * the legacy `<input type="date">` shape), so engine field values stay
 * stable. Uses react-day-picker under the hood with brand-yellow accents.
 */
export function DateField({
  value,
  onChange,
  readOnly = false,
  withTime = false,
}: {
  value: string | undefined;
  onChange: (next: string) => void;
  readOnly?: boolean;
  /** When true, shows an additional time slot input next to the date. */
  withTime?: boolean;
}) {
  const [open, setOpen] = useState(false);

  const dateStr = withTime ? (value ?? "").slice(0, 10) : (value ?? "");
  const timeStr = withTime ? (value ?? "").slice(11, 16) : "";

  const selected = dateStr ? new Date(`${dateStr}T00:00:00`) : undefined;

  const display = formatDisplay(value, withTime);

  const updateDate = (d: Date | undefined) => {
    if (!d) return;
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const newDate = `${yyyy}-${mm}-${dd}`;
    if (withTime) {
      const t = timeStr || "09:00";
      onChange(`${newDate}T${t}`);
    } else {
      onChange(newDate);
    }
    if (!withTime) setOpen(false);
  };

  const updateTime = (t: string) => {
    if (!dateStr) return;
    onChange(`${dateStr}T${t}`);
  };

  return (
    <div className="flex items-center gap-2">
      <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
        <PopoverPrimitive.Trigger asChild>
          <button
            type="button"
            disabled={readOnly}
            className={cn(
              "flex h-10 flex-1 items-center justify-between gap-2 rounded-md border px-3 text-body-sm transition-colors",
              "border-[var(--color-hairline)] bg-[var(--color-canvas)] text-[var(--color-ink)] hover:border-[var(--color-hairline-strong)]",
              "focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-yellow)] focus:border-transparent",
              !value && "text-[var(--color-stone)]",
              readOnly &&
                "cursor-not-allowed bg-[var(--color-surface-soft)] text-[var(--color-stone)]",
            )}
          >
            <span className="truncate">{display || "Select a date"}</span>
            <CalendarIcon
              className="h-4 w-4 shrink-0 text-[var(--color-stone)]"
              strokeWidth={1.75}
            />
          </button>
        </PopoverPrimitive.Trigger>
        <PopoverPrimitive.Portal>
          <PopoverPrimitive.Content
            align="start"
            sideOffset={6}
            className="z-50 rounded-xl border border-[var(--color-hairline)] bg-[var(--color-canvas)] p-3 shadow-[var(--shadow-3)] data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95"
          >
            <DayPicker
              mode="single"
              selected={selected}
              onSelect={updateDate}
              showOutsideDays
              weekStartsOn={0}
              classNames={{
                month_caption:
                  "flex h-9 items-center justify-center text-body-sm-medium text-[var(--color-ink)]",
                nav: "absolute right-2 top-1.5 flex items-center gap-1",
                button_previous:
                  "h-7 w-7 inline-flex items-center justify-center rounded-md text-[var(--color-stone)] hover:bg-[var(--color-surface-soft)] hover:text-[var(--color-ink)] transition",
                button_next:
                  "h-7 w-7 inline-flex items-center justify-center rounded-md text-[var(--color-stone)] hover:bg-[var(--color-surface-soft)] hover:text-[var(--color-ink)] transition",
                month_grid: "border-collapse mt-1",
                weekday:
                  "h-8 w-9 text-caption text-[var(--color-stone)] font-medium",
                day: "h-9 w-9 p-0 text-center align-middle",
                day_button:
                  "h-9 w-9 rounded-md text-body-sm text-[var(--color-charcoal)] hover:bg-[var(--color-surface-soft)] hover:text-[var(--color-ink)] transition",
                today: "font-semibold text-[var(--color-brand-blue)]",
                selected:
                  "[&>button]:bg-[var(--color-brand-yellow)] [&>button]:text-[var(--color-ink)] [&>button]:font-semibold [&>button]:hover:bg-[var(--color-brand-yellow)]",
                outside: "[&>button]:text-[var(--color-stone)]",
                disabled:
                  "[&>button]:text-[var(--color-stone)] [&>button]:cursor-not-allowed",
              }}
            />
            <div className="mt-2 flex items-center justify-between border-t border-[var(--color-hairline-soft)] pt-2">
              <button
                type="button"
                onClick={() => {
                  onChange("");
                  setOpen(false);
                }}
                className="text-caption-bold text-[var(--color-stone)] hover:text-[var(--color-ink)]"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => updateDate(new Date())}
                className="text-caption-bold text-[var(--color-charcoal)] hover:text-[var(--color-ink)]"
              >
                Today
              </button>
            </div>
          </PopoverPrimitive.Content>
        </PopoverPrimitive.Portal>
      </PopoverPrimitive.Root>

      {withTime ? (
        <input
          type="time"
          value={timeStr}
          disabled={readOnly}
          onChange={(e) => updateTime(e.target.value)}
          className={cn(
            "h-10 w-28 rounded-md border border-[var(--color-hairline)] bg-[var(--color-canvas)] px-3 text-body-sm text-[var(--color-ink)]",
            "focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-yellow)] focus:border-transparent",
            readOnly &&
              "cursor-not-allowed bg-[var(--color-surface-soft)] text-[var(--color-stone)]",
          )}
        />
      ) : null}
    </div>
  );
}

function formatDisplay(value: string | undefined, withTime: boolean): string {
  if (!value) return "";
  const dateStr = value.slice(0, 10);
  const d = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(d.getTime())) return value;
  const datePart = d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  if (!withTime) return datePart;
  return `${datePart} · ${value.slice(11, 16)}`;
}
