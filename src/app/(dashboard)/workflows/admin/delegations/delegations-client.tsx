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
} from "@/components/design";
import { DateField } from "@/components/workflows/date-field";

interface User {
  id: string;
  name: string | null;
  email: string;
}
interface Delegation {
  id: string;
  isActive: boolean;
  startsAt: string;
  endsAt: string | null;
  fromUser: User;
  toUser: User;
}

export function DelegationsClient({
  initial,
  users,
}: {
  initial: Delegation[];
  users: User[];
}) {
  const router = useRouter();
  const [list, setList] = useState(initial);
  const [from, setFrom] = useState(users[0]?.id ?? "");
  const [to, setTo] = useState(users[1]?.id ?? users[0]?.id ?? "");
  const [startsAt, setStartsAt] = useState(
    new Date().toISOString().slice(0, 16),
  );
  const [endsAt, setEndsAt] = useState("");
  const [hasEndDate, setHasEndDate] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function add() {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/workflow/admin/delegations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fromUserId: from,
          toUserId: to,
          startsAt: new Date(startsAt).toISOString(),
          endsAt:
            hasEndDate && endsAt ? new Date(endsAt).toISOString() : undefined,
        }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.message || body.error || "Failed");
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  async function deactivate(id: string) {
    if (
      !(await confirm({
        title: "Deactivate delegation?",
        message: "New assignments will route to the original user again.",
        confirmLabel: "Deactivate",
        danger: true,
      }))
    )
      return;
    await fetch(`/api/workflow/admin/delegations/${id}`, { method: "DELETE" });
    setList(list.map((d) => (d.id === id ? { ...d, isActive: false } : d)));
  }

  return (
    <div className="space-y-4">
      <Card>
        <h3 className="text-h5">Add delegation</h3>
        <p className="text-caption text-stone mt-1">
          Reroute every assignment from one user to another while they&apos;re
          out.
        </p>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <div className="space-y-2">
            <FieldLabel required>From</FieldLabel>
            <Select value={from} onChange={(e) => setFrom(e.target.value)}>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name || u.email}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <FieldLabel required>To</FieldLabel>
            <Select value={to} onChange={(e) => setTo(e.target.value)}>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name || u.email}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <FieldLabel required>Starts</FieldLabel>
            <DateField value={startsAt} onChange={setStartsAt} withTime />
          </div>
          <div className="space-y-2">
            <label className="text-body-sm-medium text-charcoal flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={hasEndDate}
                onChange={(e) => {
                  setHasEndDate(e.target.checked);
                  if (!e.target.checked) setEndsAt("");
                }}
              />
              Set an end date
            </label>
            {hasEndDate ? (
              <DateField value={endsAt} onChange={setEndsAt} withTime />
            ) : (
              <p className="text-caption text-stone">
                Open-ended — delegation stays active until you deactivate it
                manually.
              </p>
            )}
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
            disabled={!from || !to || busy}
            variant="primary"
          >
            {busy ? "Adding…" : "Add delegation"}
          </Button>
        </div>
      </Card>

      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left">
            <thead className="border-b border-[var(--color-hairline-soft)] bg-[var(--color-surface-soft)]">
              <tr className="text-micro-uppercase text-stone">
                <th className="px-5 py-3">From</th>
                <th className="px-5 py-3">To</th>
                <th className="px-5 py-3">Starts</th>
                <th className="px-5 py-3">Ends</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {list.map((d) => (
                <tr
                  key={d.id}
                  className="border-b border-[var(--color-hairline-soft)] last:border-0"
                >
                  <td className="text-body-sm-medium text-ink px-5 py-3">
                    {d.fromUser.name || d.fromUser.email}
                  </td>
                  <td className="text-body-sm-medium text-ink px-5 py-3">
                    {d.toUser.name || d.toUser.email}
                  </td>
                  <td className="text-body-sm text-stone px-5 py-3">
                    {new Date(d.startsAt).toLocaleString()}
                  </td>
                  <td className="text-body-sm text-stone px-5 py-3">
                    {d.endsAt ? new Date(d.endsAt).toLocaleString() : "—"}
                  </td>
                  <td className="px-5 py-3">
                    {d.isActive ? (
                      <Badge tone="success">Active</Badge>
                    ) : (
                      <Badge tone="neutral">Inactive</Badge>
                    )}
                  </td>
                  <td className="px-5 py-3 text-right">
                    {d.isActive ? (
                      <button
                        onClick={() => deactivate(d.id)}
                        className="text-body-sm-medium text-[var(--color-coral-dark)] hover:underline"
                      >
                        Deactivate
                      </button>
                    ) : null}
                  </td>
                </tr>
              ))}
              {list.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="text-body-md text-stone px-5 py-12 text-center"
                  >
                    No delegations yet.
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
