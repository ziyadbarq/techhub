"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button, Card, confirm, Select } from "@/components/design";

interface NamedRef {
  id: string;
  name: string;
}
interface Subscription {
  id: string;
  form: NamedRef;
  role: NamedRef;
}

export function WatcherSubscriptionsClient({
  initial,
  forms,
  roles,
}: {
  initial: Subscription[];
  forms: NamedRef[];
  roles: NamedRef[];
}) {
  const router = useRouter();
  const [list, setList] = useState(initial);
  const [formId, setFormId] = useState(forms[0]?.id ?? "");
  const [roleId, setRoleId] = useState(roles[0]?.id ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function add() {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(
        "/api/workflow/admin/watcher-subscriptions",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ formId, roleId }),
        },
      );
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

  async function remove(id: string) {
    if (
      !(await confirm({
        title: "Remove watcher subscription?",
        message:
          "Future requests on this form won't auto-add the role as watchers.",
        confirmLabel: "Remove",
        danger: true,
      }))
    )
      return;
    await fetch(`/api/workflow/admin/watcher-subscriptions/${id}`, {
      method: "DELETE",
    });
    setList(list.filter((s) => s.id !== id));
  }

  return (
    <div className="space-y-4">
      <Card>
        <h3 className="text-h5">Add subscription</h3>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          <Select value={formId} onChange={(e) => setFormId(e.target.value)}>
            {forms.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </Select>
          <Select value={roleId} onChange={(e) => setRoleId(e.target.value)}>
            {roles.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </Select>
          <Button
            onClick={add}
            disabled={!formId || !roleId || busy}
            variant="primary"
          >
            {busy ? "Adding…" : "Subscribe role"}
          </Button>
        </div>
        {error ? (
          <p className="text-body-sm mt-3 text-[var(--color-coral-dark)]">
            {error}
          </p>
        ) : null}
      </Card>

      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left">
            <thead className="border-b border-[var(--color-hairline-soft)] bg-[var(--color-surface-soft)]">
              <tr className="text-micro-uppercase text-stone">
                <th className="px-5 py-3">Form</th>
                <th className="px-5 py-3">Role</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {list.map((s) => (
                <tr
                  key={s.id}
                  className="border-b border-[var(--color-hairline-soft)] last:border-0"
                >
                  <td className="text-body-sm-medium text-ink px-5 py-3">
                    {s.form.name}
                  </td>
                  <td className="text-body-sm text-slate px-5 py-3">
                    {s.role.name}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button
                      onClick={() => remove(s.id)}
                      className="text-body-sm-medium text-[var(--color-coral-dark)] hover:underline"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
              {list.length === 0 ? (
                <tr>
                  <td
                    colSpan={3}
                    className="text-body-md text-stone px-5 py-12 text-center"
                  >
                    No subscriptions yet.
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
