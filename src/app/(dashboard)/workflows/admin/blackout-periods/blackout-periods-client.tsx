"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  Badge,
  Button,
  Card,
  confirm,
  FieldLabel,
  Select,
  TextInput,
} from "@/components/design";
import { DateField } from "@/components/workflows/date-field";

interface Period {
  id: string;
  name: string;
  startsAt: string;
  endsAt: string;
  behavior: string;
  reason: string | null;
}

export function BlackoutPeriodsClient({ initial }: { initial: Period[] }) {
  const router = useRouter();
  const [list, setList] = useState(initial);
  const [name, setName] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [behavior, setBehavior] = useState<"BLOCK" | "WARN" | "IGNORE">(
    "BLOCK",
  );
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function add() {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/workflow/admin/blackout-periods", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          startsAt: new Date(startsAt).toISOString(),
          endsAt: new Date(endsAt).toISOString(),
          behavior,
          reason: reason || undefined,
        }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.message || body.error || "Failed");
      }
      const body = (await response.json()) as { period: Period };
      setList([...list, body.period]);
      setName("");
      setReason("");
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
        title: "Delete blackout period?",
        confirmLabel: "Delete",
        danger: true,
      }))
    )
      return;
    await fetch(`/api/workflow/admin/blackout-periods/${id}`, {
      method: "DELETE",
    });
    setList(list.filter((p) => p.id !== id));
  }

  return (
    <div className="space-y-4">
      <Card>
        <h3 className="text-h5">Add period</h3>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          <div className="space-y-2">
            <FieldLabel required>Name</FieldLabel>
            <TextInput value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <FieldLabel required>Starts</FieldLabel>
            <DateField value={startsAt} onChange={setStartsAt} withTime />
          </div>
          <div className="space-y-2">
            <FieldLabel required>Ends</FieldLabel>
            <DateField value={endsAt} onChange={setEndsAt} withTime />
          </div>
          <div className="space-y-2">
            <FieldLabel>Behavior</FieldLabel>
            <Select
              value={behavior}
              onChange={(e) => setBehavior(e.target.value as typeof behavior)}
            >
              <option value="BLOCK">BLOCK</option>
              <option value="WARN">WARN</option>
              <option value="IGNORE">IGNORE</option>
            </Select>
          </div>
          <div className="space-y-2 md:col-span-2">
            <FieldLabel>Reason</FieldLabel>
            <TextInput
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>
        </div>
        {error ? (
          <p className="text-body-sm mt-3 text-[var(--color-coral-dark)]">
            {error}
          </p>
        ) : null}
        <div className="mt-3">
          <Button
            onClick={add}
            disabled={!name || !startsAt || !endsAt || busy}
            variant="primary"
          >
            {busy ? "Adding…" : "Add"}
          </Button>
        </div>
      </Card>

      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left">
            <thead className="border-b border-[var(--color-hairline-soft)] bg-[var(--color-surface-soft)]">
              <tr className="text-micro-uppercase text-stone">
                <th className="px-5 py-3">Name</th>
                <th className="px-5 py-3">Starts</th>
                <th className="px-5 py-3">Ends</th>
                <th className="px-5 py-3">Behavior</th>
                <th className="px-5 py-3">Reason</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {list.map((p) => (
                <tr
                  key={p.id}
                  className="border-b border-[var(--color-hairline-soft)] last:border-0"
                >
                  <td className="text-body-sm-medium text-ink px-5 py-3">
                    {p.name}
                  </td>
                  <td className="text-body-sm text-stone px-5 py-3">
                    {new Date(p.startsAt).toLocaleString()}
                  </td>
                  <td className="text-body-sm text-stone px-5 py-3">
                    {new Date(p.endsAt).toLocaleString()}
                  </td>
                  <td className="px-5 py-3">
                    <Badge
                      tone={
                        p.behavior === "BLOCK"
                          ? "danger"
                          : p.behavior === "WARN"
                            ? "yellow"
                            : "neutral"
                      }
                    >
                      {p.behavior}
                    </Badge>
                  </td>
                  <td className="text-body-sm text-slate px-5 py-3">
                    {p.reason ?? "—"}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button
                      onClick={() => remove(p.id)}
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
                    colSpan={6}
                    className="text-body-md text-stone px-5 py-12 text-center"
                  >
                    No periods yet.
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
