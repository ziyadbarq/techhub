"use client";

import { useState } from "react";

import { Button, Card, Select, TextInput } from "@/components/design";

interface Policy {
  id: string;
  name: string;
  restartMode: string;
}

export function RejectionPoliciesClient({
  initialPolicies,
}: {
  initialPolicies: Policy[];
}) {
  const [policies, setPolicies] = useState(initialPolicies);
  const [name, setName] = useState("");
  const [mode, setMode] = useState<
    "FULL_RESTART" | "RESUME_FROM_REJECTION_STEP"
  >("FULL_RESTART");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function add() {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/workflow/admin/rejection-policies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, restartMode: mode }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.message || body.error || "Failed");
      }
      const body = (await response.json()) as { policy: Policy };
      setPolicies([...policies, body.policy]);
      setName("");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  async function update(id: string, restartMode: string) {
    await fetch(`/api/workflow/admin/rejection-policies/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ restartMode }),
    });
    setPolicies(
      policies.map((p) => (p.id === id ? { ...p, restartMode } : p)),
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <h3 className="text-h5">Add policy</h3>
        <div className="mt-3 grid gap-3 md:grid-cols-[2fr_2fr_auto]">
          <TextInput
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Policy name"
          />
          <Select
            value={mode}
            onChange={(e) => setMode(e.target.value as typeof mode)}
          >
            <option value="FULL_RESTART">Full restart</option>
            <option value="RESUME_FROM_REJECTION_STEP">
              Resume from rejection step
            </option>
          </Select>
          <Button
            onClick={add}
            disabled={!name || busy}
            variant="primary"
            size="md"
          >
            {busy ? "Adding…" : "Add"}
          </Button>
        </div>
        {error ? (
          <p className="mt-3 text-body-sm text-[var(--color-coral-dark)]">
            {error}
          </p>
        ) : null}
      </Card>

      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left">
            <thead className="border-b border-[var(--color-hairline-soft)] bg-[var(--color-surface-soft)]">
              <tr className="text-micro-uppercase text-stone">
                <th className="px-5 py-3">Name</th>
                <th className="px-5 py-3">Restart mode</th>
              </tr>
            </thead>
            <tbody>
              {policies.map((p) => (
                <tr
                  key={p.id}
                  className="border-b border-[var(--color-hairline-soft)] last:border-0"
                >
                  <td className="px-5 py-3 text-body-sm-medium text-ink">
                    {p.name}
                  </td>
                  <td className="px-5 py-3">
                    <Select
                      value={p.restartMode}
                      onChange={(e) => update(p.id, e.target.value)}
                      className="max-w-xs"
                    >
                      <option value="FULL_RESTART">FULL_RESTART</option>
                      <option value="RESUME_FROM_REJECTION_STEP">
                        RESUME_FROM_REJECTION_STEP
                      </option>
                    </Select>
                  </td>
                </tr>
              ))}
              {policies.length === 0 ? (
                <tr>
                  <td
                    colSpan={2}
                    className="px-5 py-12 text-center text-body-md text-stone"
                  >
                    No policies yet.
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
