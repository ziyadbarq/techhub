"use client";

import * as PopoverPrimitive from "@radix-ui/react-popover";
import { Calendar as CalendarIcon, Clock as ClockIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/utils/date-format";

/**
 * Miro-themed date picker. Stores values as `YYYY-MM-DD` strings (matching
 * the legacy `<input type="date">` shape), so engine field values stay
 * stable. Uses react-day-picker under the hood with brand-yellow accents.
 *
 * When `withTime` is true, an accompanying popover-based TimePicker is
 * shown next to the date, matching the calendar's visual language (no
 * native browser time picker).
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
    if (!dateStr) {
      // If no date yet, default to today so the value stays valid.
      const now = new Date();
      const yyyy = now.getFullYear();
      const mm = String(now.getMonth() + 1).padStart(2, "0");
      const dd = String(now.getDate()).padStart(2, "0");
      onChange(`${yyyy}-${mm}-${dd}T${t}`);
      return;
    }
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
              "text-body-sm flex h-10 flex-1 items-center justify-between gap-2 rounded-md border px-3 transition-colors",
              "border-[var(--color-hairline)] bg-[var(--color-canvas)] text-[var(--color-ink)] hover:border-[var(--color-hairline-strong)]",
              "focus:border-transparent focus:ring-2 focus:ring-[var(--color-brand-yellow)] focus:outline-none",
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
            className="data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 z-50 rounded-xl border border-[var(--color-hairline)] bg-[var(--color-canvas)] p-3 shadow-[var(--shadow-3)]"
          >
            <Calendar
              mode="single"
              selected={selected}
              onSelect={updateDate}
              showOutsideDays
              weekStartsOn={0}
              className="p-0"
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
        <TimePicker value={timeStr} onChange={updateTime} readOnly={readOnly} />
      ) : null}
    </div>
  );
}

/**
 * Popover-based time picker. Two scrollable columns (hours + minutes)
 * styled to match the DateField calendar. Emits `HH:mm` (24h). Snaps
 * minutes to 5-minute steps to keep the list tight.
 */
function TimePicker({
  value,
  onChange,
  readOnly = false,
}: {
  value: string;
  onChange: (next: string) => void;
  readOnly?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const hoursRef = useRef<HTMLDivElement | null>(null);
  const minutesRef = useRef<HTMLDivElement | null>(null);

  const [hourStr, minuteStr] = value ? value.split(":") : ["", ""];
  const hourNum = hourStr ? Number.parseInt(hourStr, 10) : null;
  const minuteNum = minuteStr ? Number.parseInt(minuteStr, 10) : null;

  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = Array.from({ length: 12 }, (_, i) => i * 5);

  const commit = (h: number | null, m: number | null) => {
    const hh = String(h ?? 9).padStart(2, "0");
    const mm = String(m ?? 0).padStart(2, "0");
    onChange(`${hh}:${mm}`);
  };

  // Scroll the current selection into view when the popover opens.
  useEffect(() => {
    if (!open) return;
    requestAnimationFrame(() => {
      const scrollTo = (container: HTMLDivElement | null, selector: string) => {
        if (!container) return;
        const target = container.querySelector<HTMLElement>(selector);
        if (target) {
          container.scrollTop =
            target.offsetTop -
            container.clientHeight / 2 +
            target.clientHeight / 2;
        }
      };
      scrollTo(hoursRef.current, "[data-selected='true']");
      scrollTo(minutesRef.current, "[data-selected='true']");
    });
  }, [open]);

  const display = value || "--:--";

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
      <PopoverPrimitive.Trigger asChild>
        <button
          type="button"
          disabled={readOnly}
          className={cn(
            "text-body-sm flex h-10 w-32 items-center justify-between gap-2 rounded-md border px-3 transition-colors",
            "border-[var(--color-hairline)] bg-[var(--color-canvas)] text-[var(--color-ink)] hover:border-[var(--color-hairline-strong)]",
            "focus:border-transparent focus:ring-2 focus:ring-[var(--color-brand-yellow)] focus:outline-none",
            !value && "text-[var(--color-stone)]",
            readOnly &&
              "cursor-not-allowed bg-[var(--color-surface-soft)] text-[var(--color-stone)]",
          )}
        >
          <span className="tabular-nums">{display}</span>
          <ClockIcon
            className="h-4 w-4 shrink-0 text-[var(--color-stone)]"
            strokeWidth={1.75}
          />
        </button>
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          align="start"
          sideOffset={6}
          className="data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 z-50 rounded-xl border border-[var(--color-hairline)] bg-[var(--color-canvas)] p-3 shadow-[var(--shadow-3)]"
        >
          <div className="mb-2 flex items-center justify-between px-1">
            <span className="text-caption text-[var(--color-stone)]">Hour</span>
            <span className="text-caption text-[var(--color-stone)]">
              Minute
            </span>
          </div>
          <div className="flex gap-2">
            <TimeColumn
              scrollRef={hoursRef}
              items={hours}
              current={hourNum}
              onSelect={(h) => commit(h, minuteNum)}
            />
            <TimeColumn
              scrollRef={minutesRef}
              items={minutes}
              current={
                minuteNum !== null
                  ? // Snap non-multiples of 5 to the nearest slot for highlight.
                    Math.round(minuteNum / 5) * 5
                  : null
              }
              onSelect={(m) => commit(hourNum, m)}
            />
          </div>
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
              onClick={() => setOpen(false)}
              className="text-caption-bold text-[var(--color-charcoal)] hover:text-[var(--color-ink)]"
            >
              Done
            </button>
          </div>
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}

function TimeColumn({
  items,
  current,
  onSelect,
  scrollRef,
}: {
  items: number[];
  current: number | null;
  onSelect: (n: number) => void;
  scrollRef: React.RefObject<HTMLDivElement | null>;
}) {
  return (
    <div
      ref={scrollRef}
      className="max-h-52 w-16 overflow-y-auto rounded-md border border-[var(--color-hairline-soft)] bg-[var(--color-surface-soft)] p-1"
    >
      <div className="flex flex-col gap-0.5">
        {items.map((n) => {
          const selected = current === n;
          return (
            <button
              key={n}
              type="button"
              data-selected={selected}
              onClick={() => onSelect(n)}
              className={cn(
                "text-body-sm h-8 rounded-md text-center tabular-nums transition-colors",
                selected
                  ? "bg-[var(--color-brand-yellow)] font-semibold text-[var(--color-ink)]"
                  : "text-[var(--color-charcoal)] hover:bg-[var(--color-canvas)] hover:text-[var(--color-ink)]",
              )}
            >
              {String(n).padStart(2, "0")}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function formatDisplay(value: string | undefined, withTime: boolean): string {
  if (!value) return "";
  const dateStr = value.slice(0, 10);
  const d = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(d.getTime())) return value;
  const datePart = formatDate(d);
  if (!withTime) return datePart;
  return `${datePart} · ${value.slice(11, 16)}`;
}
