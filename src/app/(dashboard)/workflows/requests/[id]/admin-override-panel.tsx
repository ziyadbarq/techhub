"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button, confirm, Select } from "@/components/design";

interface User {
  id: string;
  name: string | null;
  email: string;
}

export function AdminOverridePanel({
  requestId,
  activeStepInstanceId,
  isTerminal,
  orgUsers,
}: {
  requestId: string;
  activeStepInstanceId: string | null;
  isTerminal: boolean;
  orgUsers: User[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reassignTo, setReassignTo] = useState(orgUsers[0]?.id ?? "");
  const [overrideOutcome, setOverrideOutcome] = useState<
    | "SUCCESSFUL"
    | "SUCCESSFUL_WITH_ISSUES"
    | "UNSUCCESSFUL"
    | "WITHDRAWN"
    | "REJECTED"
    | "SUPERSEDED"
    | "ABANDONED"
    | "EXPIRED"
  >("SUCCESSFUL");
  const [overrideNotes, setOverrideNotes] = useState("");

  async function call(label: string, path: string, body: unknown) {
    setBusy(label);
    setError(null);
    try {
      const response = await fetch(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(
          data.message || data.error || `Failed (${response.status})`,
        );
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-3">
      {error ? (
        <div className="text-body-sm rounded-md border border-[var(--color-brand-red-dark)] bg-[var(--color-brand-red)]/40 px-3 py-2 text-[var(--color-coral-dark)]">
          {error}
        </div>
      ) : null}

      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-xl border border-[var(--color-hairline)] bg-[var(--color-canvas)] p-4">
          <p className="text-micro-uppercase text-stone">Force advance</p>
          <p className="text-caption text-slate mt-1">
            Skip the active step and continue to the next.
          </p>
          <div className="mt-3">
            <Button
              disabled={!activeStepInstanceId || isTerminal || !!busy}
              onClick={() =>
                call("force-advance", "/api/workflow/admin/force-advance", {
                  stepInstanceId: activeStepInstanceId,
                })
              }
              variant="blue"
              size="sm"
            >
              {busy === "force-advance" ? "…" : "Force advance"}
            </Button>
          </div>
        </div>

        <div className="rounded-xl border border-[var(--color-hairline)] bg-[var(--color-canvas)] p-4">
          <p className="text-micro-uppercase text-stone">Reassign step</p>
          <Select
            value={reassignTo}
            onChange={(e) => setReassignTo(e.target.value)}
            className="mt-2"
          >
            {orgUsers.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name || u.email}
              </option>
            ))}
          </Select>
          <div className="mt-3">
            <Button
              disabled={
                !activeStepInstanceId || isTerminal || !reassignTo || !!busy
              }
              onClick={() =>
                call("reassign", "/api/workflow/admin/reassign", {
                  stepInstanceId: activeStepInstanceId,
                  toUserId: reassignTo,
                })
              }
              variant="blue"
              size="sm"
            >
              {busy === "reassign" ? "…" : "Reassign"}
            </Button>
          </div>
        </div>

        <div className="rounded-xl border border-[var(--color-hairline)] bg-[var(--color-canvas)] p-4">
          <p className="text-micro-uppercase text-stone">Override outcome</p>
          <Select
            value={overrideOutcome}
            onChange={(e) =>
              setOverrideOutcome(e.target.value as typeof overrideOutcome)
            }
            className="mt-2"
          >
            <option value="SUCCESSFUL">SUCCESSFUL</option>
            <option value="SUCCESSFUL_WITH_ISSUES">
              SUCCESSFUL_WITH_ISSUES
            </option>
            <option value="UNSUCCESSFUL">UNSUCCESSFUL</option>
            <option value="WITHDRAWN">WITHDRAWN</option>
            <option value="REJECTED">REJECTED</option>
            <option value="SUPERSEDED">SUPERSEDED</option>
            <option value="ABANDONED">ABANDONED</option>
            <option value="EXPIRED">EXPIRED</option>
          </Select>
          {overrideOutcome !== "SUCCESSFUL" ? (
            <textarea
              value={overrideNotes}
              onChange={(e) => setOverrideNotes(e.target.value)}
              rows={2}
              placeholder="Reason (required for non-SUCCESSFUL outcome)"
              className="text-body-sm mt-2 w-full rounded-md border border-[var(--color-hairline-strong)] bg-[var(--color-canvas)] px-2 py-1.5 text-[var(--color-ink)]"
            />
          ) : null}
          <div className="mt-3">
            <Button
              disabled={
                isTerminal ||
                !!busy ||
                (overrideOutcome !== "SUCCESSFUL" && !overrideNotes.trim())
              }
              onClick={async () => {
                if (
                  !(await confirm({
                    title: "Force-close request?",
                    message: `Outcome will be set to ${overrideOutcome}. The workflow won't run any remaining steps.`,
                    confirmLabel: "Force-close",
                    danger: true,
                  }))
                )
                  return;
                call(
                  "override-outcome",
                  "/api/workflow/admin/override-outcome",
                  {
                    requestId,
                    outcome: overrideOutcome,
                    notes: overrideNotes.trim() || undefined,
                  },
                );
              }}
              variant="danger"
              size="sm"
            >
              {busy === "override-outcome" ? "…" : "Override & close"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
