"use client";

import { useState } from "react";

import {
  Button,
  Card,
  FieldLabel,
  Select,
  TextInput,
} from "@/components/design";

interface Calendar {
  id: string;
  name: string;
  timezone: string;
}

// JS day numbering: 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat.

const PRESET_24_7 = {
  days: {
    "0": [{ from: "00:00", to: "24:00" }],
    "1": [{ from: "00:00", to: "24:00" }],
    "2": [{ from: "00:00", to: "24:00" }],
    "3": [{ from: "00:00", to: "24:00" }],
    "4": [{ from: "00:00", to: "24:00" }],
    "5": [{ from: "00:00", to: "24:00" }],
    "6": [{ from: "00:00", to: "24:00" }],
  },
};

// Sun–Thu 9–5: Saudi Arabia, UAE (private/public), Kuwait, Qatar, Bahrain.
const PRESET_SUN_THU = {
  days: {
    "0": [{ from: "09:00", to: "17:00" }],
    "1": [{ from: "09:00", to: "17:00" }],
    "2": [{ from: "09:00", to: "17:00" }],
    "3": [{ from: "09:00", to: "17:00" }],
    "4": [{ from: "09:00", to: "17:00" }],
    "5": [],
    "6": [],
  },
};

// Mon–Fri 9–5: Western standard work week.
const PRESET_MON_FRI = {
  days: {
    "0": [],
    "1": [{ from: "09:00", to: "17:00" }],
    "2": [{ from: "09:00", to: "17:00" }],
    "3": [{ from: "09:00", to: "17:00" }],
    "4": [{ from: "09:00", to: "17:00" }],
    "5": [{ from: "09:00", to: "17:00" }],
    "6": [],
  },
};

type PresetKey = "24_7" | "SUN_THU" | "MON_FRI";

const PRESETS: Record<
  PresetKey,
  { label: string; description: string; data: typeof PRESET_24_7 }
> = {
  SUN_THU: {
    label: "Sun–Thu, 9 AM – 5 PM",
    description: "Standard Gulf / Saudi work week (Sunday → Thursday).",
    data: PRESET_SUN_THU,
  },
  MON_FRI: {
    label: "Mon–Fri, 9 AM – 5 PM",
    description: "Standard Western work week (Monday → Friday).",
    data: PRESET_MON_FRI,
  },
  "24_7": {
    label: "24 / 7",
    description: "Always working — no off hours, no weekends.",
    data: PRESET_24_7,
  },
};

const TIMEZONES = [
  "Asia/Riyadh",
  "Asia/Dubai",
  "Asia/Kuwait",
  "Asia/Qatar",
  "Asia/Bahrain",
  "Africa/Cairo",
  "Europe/London",
  "Europe/Paris",
  "America/New_York",
  "America/Los_Angeles",
  "UTC",
];

export function CalendarsClient({
  initialCalendars,
}: {
  initialCalendars: Calendar[];
}) {
  const [calendars, setCalendars] = useState(initialCalendars);
  const [name, setName] = useState("");
  const [timezone, setTimezone] = useState("Asia/Riyadh");
  const [preset, setPreset] = useState<PresetKey>("SUN_THU");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function add() {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/workflow/admin/calendars", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          timezone,
          workingHours: PRESETS[preset].data,
          holidays: [],
        }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.message || body.error || "Failed");
      }
      const body = (await response.json()) as { calendar: Calendar };
      setCalendars([...calendars, body.calendar]);
      setName("");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <h3 className="text-h5">Add calendar</h3>
        <p className="text-caption text-stone mt-1">
          A calendar tells the engine when people are working — used to compute
          SLA timers (off-hours, weekends, and holidays don&apos;t count).
        </p>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <div className="space-y-2">
            <FieldLabel required>Name</FieldLabel>
            <TextInput
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Saudi Business Hours"
            />
          </div>
          <div className="space-y-2">
            <FieldLabel required>Timezone</FieldLabel>
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

          <div className="space-y-2 md:col-span-2">
            <FieldLabel>Working-hours preset</FieldLabel>
            <Select
              value={preset}
              onChange={(e) => setPreset(e.target.value as PresetKey)}
            >
              {(Object.keys(PRESETS) as PresetKey[]).map((k) => (
                <option key={k} value={k}>
                  {PRESETS[k].label}
                </option>
              ))}
            </Select>
            <p className="text-caption text-stone">
              {PRESETS[preset].description}
            </p>
          </div>
        </div>

        {error ? (
          <p className="text-body-sm mt-3 text-[var(--color-coral-dark)]">
            {error}
          </p>
        ) : null}

        <div className="mt-4">
          <Button
            onClick={add}
            disabled={!name || busy}
            variant="primary"
            size="md"
          >
            {busy ? "Adding…" : "Add calendar"}
          </Button>
        </div>
      </Card>

      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left">
            <thead className="border-b border-[var(--color-hairline-soft)] bg-[var(--color-surface-soft)]">
              <tr className="text-micro-uppercase text-stone">
                <th className="px-5 py-3">Name</th>
                <th className="px-5 py-3">Timezone</th>
              </tr>
            </thead>
            <tbody>
              {calendars.map((c) => (
                <tr
                  key={c.id}
                  className="border-b border-[var(--color-hairline-soft)] last:border-0"
                >
                  <td className="text-body-sm-medium text-ink px-5 py-3">
                    {c.name}
                  </td>
                  <td className="text-caption text-charcoal px-5 py-3 font-mono">
                    {c.timezone}
                  </td>
                </tr>
              ))}
              {calendars.length === 0 ? (
                <tr>
                  <td
                    colSpan={2}
                    className="text-body-md text-stone px-5 py-12 text-center"
                  >
                    No calendars yet.
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
