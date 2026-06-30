"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  Button,
  Card,
  confirm,
  FieldLabel,
  Select,
  TextInput,
} from "@/components/design";

interface Window {
  id: string;
  name: string;
  recurrence: Record<string, unknown>;
}

const DAYS = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
];

const TIMEZONES = [
  "Asia/Riyadh",
  "Asia/Dubai",
  "Asia/Kuwait",
  "Africa/Cairo",
  "Europe/London",
  "Europe/Paris",
  "America/New_York",
  "America/Los_Angeles",
  "UTC",
];

function pad(n: number) {
  return n.toString().padStart(2, "0");
}

function formatHour(hour: number) {
  if (hour < 24) return `${pad(hour)}:00`;
  return `${pad(hour - 24)}:00 (next day)`;
}

function describeRecurrence(rec: Record<string, unknown>): string {
  const day = typeof rec.dayOfWeek === "number" ? rec.dayOfWeek : null;
  const from = typeof rec.fromHour === "number" ? rec.fromHour : null;
  const to = typeof rec.toHour === "number" ? rec.toHour : null;
  const tz = typeof rec.timezone === "string" ? rec.timezone : null;

  if (day === null || from === null || to === null) {
    return JSON.stringify(rec);
  }

  const dayLabel = DAYS.find((d) => d.value === day)?.label ?? `Day ${day}`;
  const tzLabel = tz ? ` · ${tz}` : "";
  return `${dayLabel}s, ${formatHour(from)} → ${formatHour(to)}${tzLabel}`;
}

export function MaintenanceWindowsClient({ initial }: { initial: Window[] }) {
  const router = useRouter();
  const [list, setList] = useState(initial);
  const [name, setName] = useState("");
  const [dayOfWeek, setDayOfWeek] = useState(0);
  const [fromHour, setFromHour] = useState(22);
  const [toHour, setToHour] = useState(26);
  const [timezone, setTimezone] = useState("Asia/Riyadh");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function add() {
    setBusy(true);
    setError(null);
    try {
      if (toHour <= fromHour) {
        throw new Error(
          "End hour must be after start hour. Use values past 24 to span midnight (e.g. 26 = 2am).",
        );
      }
      const recurrence = { dayOfWeek, fromHour, toHour, timezone };
      const response = await fetch(
        "/api/workflow/admin/maintenance-windows",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, recurrence }),
        },
      );
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.message || body.error || "Failed");
      }
      const body = (await response.json()) as { window: Window };
      setList([...list, body.window]);
      setName("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    if (
      !(await confirm({
        title: "Delete maintenance window?",
        confirmLabel: "Delete",
        danger: true,
      }))
    )
      return;
    await fetch(`/api/workflow/admin/maintenance-windows/${id}`, {
      method: "DELETE",
    });
    setList(list.filter((w) => w.id !== id));
  }

  return (
    <div className="space-y-4">
      <Card>
        <h3 className="text-h5">Add window</h3>
        <p className="mt-1 text-caption text-stone">
          Schedule steps may only run during these recurring time slots.
        </p>

        <div className="mt-4 space-y-4">
          <div className="space-y-2">
            <FieldLabel required>Name</FieldLabel>
            <TextInput
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Weekly Sunday Patch Window"
            />
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <FieldLabel>Day of week</FieldLabel>
              <Select
                value={String(dayOfWeek)}
                onChange={(e) => setDayOfWeek(Number(e.target.value))}
              >
                {DAYS.map((d) => (
                  <option key={d.value} value={d.value}>
                    {d.label}
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-2">
              <FieldLabel>Timezone</FieldLabel>
              <Select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
              >
                {TIMEZONES.map((tz) => (
                  <option key={tz} value={tz}>
                    {tz}
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-2">
              <FieldLabel helper="Hour 0–23.">Start hour</FieldLabel>
              <Select
                value={String(fromHour)}
                onChange={(e) => setFromHour(Number(e.target.value))}
              >
                {Array.from({ length: 24 }, (_, h) => (
                  <option key={h} value={h}>
                    {pad(h)}:00
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-2">
              <FieldLabel helper="Use values past 24 to span midnight (e.g. 26 = 2 AM next day).">
                End hour
              </FieldLabel>
              <Select
                value={String(toHour)}
                onChange={(e) => setToHour(Number(e.target.value))}
              >
                {Array.from({ length: 31 }, (_, h) => (
                  <option key={h} value={h}>
                    {h < 24
                      ? `${pad(h)}:00`
                      : `${pad(h - 24)}:00 (next day)`}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div className="rounded-lg border border-[var(--color-hairline-soft)] bg-[var(--color-surface-soft)] px-3 py-2.5 text-body-sm text-charcoal">
            <span className="text-micro-uppercase text-stone">
              Preview ·{" "}
            </span>
            {describeRecurrence({ dayOfWeek, fromHour, toHour, timezone })}
          </div>

          {error ? (
            <p className="text-body-sm text-[var(--color-coral-dark)]">
              {error}
            </p>
          ) : null}

          <Button onClick={add} disabled={!name || busy} variant="primary">
            {busy ? "Adding…" : "Add window"}
          </Button>
        </div>
      </Card>

      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left">
            <thead className="border-b border-[var(--color-hairline-soft)] bg-[var(--color-surface-soft)]">
              <tr className="text-micro-uppercase text-stone">
                <th className="px-5 py-3">Name</th>
                <th className="px-5 py-3">Schedule</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {list.map((w) => (
                <tr
                  key={w.id}
                  className="border-b border-[var(--color-hairline-soft)] last:border-0"
                >
                  <td className="px-5 py-3 text-body-sm-medium text-ink">
                    {w.name}
                  </td>
                  <td className="px-5 py-3 text-body-sm text-charcoal">
                    {describeRecurrence(w.recurrence)}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button
                      onClick={() => remove(w.id)}
                      className="text-body-sm-medium text-[var(--color-coral-dark)] hover:underline"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {list.length === 0 ? (
                <tr>
                  <td
                    colSpan={3}
                    className="px-5 py-12 text-center text-body-md text-stone"
                  >
                    No windows yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
