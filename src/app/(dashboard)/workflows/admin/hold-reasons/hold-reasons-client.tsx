"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Badge, Button, Card, TextInput } from "@/components/design";

interface HoldReason {
  id: string;
  key: string;
  label: string;
  isActive: boolean;
}

export function HoldReasonsClient({
  initialReasons,
}: {
  initialReasons: HoldReason[];
}) {
  const router = useRouter();
  const [reasons, setReasons] = useState(initialReasons);
  const [key, setKey] = useState("");
  const [label, setLabel] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function add() {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/workflow/admin/hold-reasons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, label }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.message || body.error || "Failed");
      }
      const body = (await response.json()) as { holdReason: HoldReason };
      setReasons([...reasons, body.holdReason]);
      setKey("");
      setLabel("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  async function toggleActive(id: string, isActive: boolean) {
    await fetch(`/api/workflow/admin/hold-reasons/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive }),
    });
    setReasons(reasons.map((r) => (r.id === id ? { ...r, isActive } : r)));
  }

  return (
    <div className="space-y-4">
      <Card>
        <h3 className="text-h5">Add hold reason</h3>
        <div className="mt-3 grid gap-3 md:grid-cols-[1fr_2fr_auto]">
          <TextInput
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder="key (e.g., pending_information)"
            className="font-mono"
          />
          <TextInput
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Label"
          />
          <Button
            onClick={add}
            disabled={!key || !label || busy}
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
                <th className="px-5 py-3">Key</th>
                <th className="px-5 py-3">Label</th>
                <th className="px-5 py-3">Active</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {reasons.map((r) => (
                <tr
                  key={r.id}
                  className="border-b border-[var(--color-hairline-soft)] last:border-0"
                >
                  <td className="px-5 py-3 font-mono text-caption text-charcoal">
                    {r.key}
                  </td>
                  <td className="px-5 py-3 text-body-sm-medium text-ink">
                    {r.label}
                  </td>
                  <td className="px-5 py-3">
                    <input
                      type="checkbox"
                      className="custom-checkbox"
                      checked={r.isActive}
                      onChange={(e) => toggleActive(r.id, e.target.checked)}
                    />
                  </td>
                  <td className="px-5 py-3">
                    {r.isActive ? (
                      <Badge tone="success">Active</Badge>
                    ) : (
                      <Badge tone="neutral">Inactive</Badge>
                    )}
                  </td>
                </tr>
              ))}
              {reasons.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-5 py-12 text-center text-body-md text-stone"
                  >
                    No hold reasons yet.
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
