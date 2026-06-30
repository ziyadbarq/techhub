"use client";

import { Check, CheckCircle2, Eye, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/design";

type ActionKind = "APPROVE" | "REJECT" | "COMPLETE" | "ACKNOWLEDGE";

/**
 * Inline approve/reject/complete/ack buttons for a step instance — shown
 * directly on each row of the inbox so users don't need to open the
 * request page for routine decisions. Posts to the same engine endpoint
 * used by the request-detail action panel.
 */
export function InboxQuickActions({
  stepInstanceId,
  stepType,
}: {
  stepInstanceId: string;
  stepType: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const act = async (action: ActionKind) => {
    setBusy(action);
    setError(null);
    try {
      const res = await fetch(
        `/api/workflow/step-instances/${stepInstanceId}/actions`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ action }),
        },
      );
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || body.error || "Action failed");
      }
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  };

  const buttons = (() => {
    if (stepType === "APPROVAL") {
      return (
        <>
          <Button
            onClick={() => act("APPROVE")}
            disabled={!!busy}
            variant="success"
            size="sm"
          >
            <Check className="h-4 w-4" />
            {busy === "APPROVE" ? "Approving…" : "Approve"}
          </Button>
          <Button
            onClick={() => act("REJECT")}
            disabled={!!busy}
            variant="danger"
            size="sm"
          >
            <X className="h-4 w-4" />
            {busy === "REJECT" ? "Rejecting…" : "Reject"}
          </Button>
        </>
      );
    }
    if (stepType === "EXECUTION") {
      return (
        <Button
          onClick={() => act("COMPLETE")}
          disabled={!!busy}
          variant="primary"
          size="sm"
        >
          <CheckCircle2 className="h-4 w-4" />
          {busy === "COMPLETE" ? "Completing…" : "Mark complete"}
        </Button>
      );
    }
    if (stepType === "INFO_ACK") {
      return (
        <Button
          onClick={() => act("ACKNOWLEDGE")}
          disabled={!!busy}
          variant="primary"
          size="sm"
        >
          <Eye className="h-4 w-4" />
          {busy === "ACKNOWLEDGE" ? "Acknowledging…" : "Acknowledge"}
        </Button>
      );
    }
    return null;
  })();

  if (!buttons) return null;

  return (
    <div
      className="flex flex-col items-end gap-1.5"
      onClick={(e) => {
        e.stopPropagation();
      }}
    >
      <div className="flex flex-wrap gap-2">{buttons}</div>
      {error ? (
        <p className="text-caption text-[var(--color-coral-dark)]">{error}</p>
      ) : null}
    </div>
  );
}
