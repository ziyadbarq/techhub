"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  CheckCircle2,
  Eye,
  Pause,
  Play,
  Reply,
  X,
  XCircle,
} from "lucide-react";

import { Button, Select, TextArea } from "@/components/design";
import { FormRenderer } from "@/components/workflows/form-renderer";

const CANCEL_OUTCOMES = [
  {
    value: "WITHDRAWN",
    label: "Withdrawn — requester cancelled before completion",
  },
  { value: "REJECTED", label: "Rejected — approver rejected, no resubmit" },
  { value: "SUPERSEDED", label: "Superseded — replaced by another request" },
  { value: "ABANDONED", label: "Abandoned — went stale" },
  { value: "EXPIRED", label: "Expired — auto-closed by policy" },
] as const;

interface OutcomeCode {
  id: string;
  key: string;
  label: string;
  genericOutcome: string;
  formId: string | null;
}

interface FormSchema {
  fields: Array<{
    key: string;
    label: string;
    type: string;
    required?: boolean;
    position: number;
    config?: Record<string, unknown>;
  }>;
}
interface User {
  id: string;
  name: string | null;
  email: string;
}

type ActionKind =
  | "APPROVE"
  | "REJECT"
  | "COMPLETE"
  | "ACKNOWLEDGE"
  | "REQUEST_INFO"
  | "PROVIDE_INFO";

export function RequestActions({
  requestId,
  activeStepInstanceId,
  activeStepKey,
  activeStepType,
  status,
  isAssignee,
  isRequester,
  holdReasons,
  orgUsers,
  schema,
  currentValues,
  formId,
}: {
  requestId: string;
  activeStepInstanceId: string | null;
  activeStepKey: string | null;
  activeStepType: string | null;
  status: string;
  isAssignee: boolean;
  isRequester: boolean;
  holdReasons: Array<{ id: string; label: string }>;
  orgUsers: User[];
  schema: FormSchema;
  currentValues: Record<string, unknown>;
  formId: string;
}) {
  const router = useRouter();
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [holdReasonId, setHoldReasonId] = useState(holdReasons[0]?.id ?? "");
  const [resubmitValues, setResubmitValues] = useState(currentValues);
  const [showResubmitForm, setShowResubmitForm] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelOutcome, setCancelOutcome] =
    useState<(typeof CANCEL_OUTCOMES)[number]["value"]>("WITHDRAWN");
  const [cancelNotes, setCancelNotes] = useState("");
  const [cancelCodeId, setCancelCodeId] = useState("");
  const [outcomeCodes, setOutcomeCodes] = useState<OutcomeCode[]>([]);

  useEffect(() => {
    if (!showCancelDialog) return;
    fetch(`/api/workflow/outcome-codes?formId=${formId}`)
      .then((r) => (r.ok ? r.json() : { codes: [] }))
      .then((b: { codes: OutcomeCode[] }) => setOutcomeCodes(b.codes ?? []))
      .catch(() => setOutcomeCodes([]));
  }, [showCancelDialog, formId]);

  async function callApi(path: string, body?: unknown) {
    setError(null);
    setBusy(path);
    try {
      const response = await fetch(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : undefined,
      });
      if (!response.ok) {
        const text = await response.json().catch(() => ({}));
        throw new Error(
          text.message || text.error || `Request failed (${response.status})`,
        );
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(null);
    }
  }

  async function takeAction(action: ActionKind) {
    if (!activeStepInstanceId) return;
    await callApi(
      `/api/workflow/step-instances/${activeStepInstanceId}/actions`,
      {
        action,
        comment: comment || undefined,
      },
    );
  }

  async function placeOnHold() {
    if (!holdReasonId) return;
    await callApi(`/api/workflow/requests/${requestId}/hold`, {
      holdReasonId,
    });
  }

  async function resume() {
    await callApi(`/api/workflow/requests/${requestId}/resume`);
  }

  async function cancel() {
    if (!cancelNotes.trim()) {
      setError("Notes are required when cancelling.");
      return;
    }
    await callApi(`/api/workflow/requests/${requestId}/cancel`, {
      outcome: cancelOutcome,
      note: cancelNotes.trim(),
      outcomeCodeId: cancelCodeId || undefined,
    });
    setShowCancelDialog(false);
    setCancelNotes("");
    setCancelCodeId("");
  }

  const relevantCodes = outcomeCodes.filter(
    (c) => c.genericOutcome === cancelOutcome,
  );

  async function resubmit() {
    await callApi(`/api/workflow/requests/${requestId}/resubmit`, {
      fieldUpdates: resubmitValues,
    });
    setShowResubmitForm(false);
  }

  const isTerminal = status === "CLOSED" || status === "CANCELLED";
  const canTakeAction =
    isAssignee && status !== "ON_HOLD" && !isTerminal && activeStepInstanceId;
  const canHold =
    !isTerminal &&
    status !== "ON_HOLD" &&
    status !== "DRAFT" &&
    (isAssignee || isRequester);
  const canResume = status === "ON_HOLD" && (isAssignee || isRequester);
  const canCancel = !isTerminal && (isRequester || isAssignee);
  const canResubmit = status === "DRAFT" && isRequester;

  return (
    <div className="flowbit-busy-region space-y-3" data-busy={!!busy}>
      {error ? (
        <div className="rounded-md border border-[var(--color-brand-red-dark)] bg-[var(--color-brand-red)]/40 px-3 py-2 text-body-sm text-[var(--color-coral-dark)]">
          {error}
        </div>
      ) : null}

      {canResubmit ? (
        <div className="rounded-[20px] border border-[var(--color-brand-yellow-deep)]/30 bg-[var(--color-yellow-light)] p-4">
          <p className="text-body-sm-medium text-[var(--color-yellow-dark)]">
            This request was returned. Edit the fields and resubmit.
          </p>
          {showResubmitForm ? (
            <div className="mt-3 space-y-3">
              <FormRenderer
                schema={schema}
                values={resubmitValues}
                onChange={setResubmitValues}
                users={orgUsers}
              />
              <div className="flex gap-2">
                <Button
                  onClick={resubmit}
                  disabled={!!busy}
                  variant="primary"
                  size="sm"
                >
                  <Reply className="h-4 w-4" />
                  {busy ? "Submitting…" : "Resubmit"}
                </Button>
                <Button
                  onClick={() => setShowResubmitForm(false)}
                  variant="ghost"
                  size="sm"
                >
                  Cancel edit
                </Button>
              </div>
            </div>
          ) : (
            <div className="mt-2">
              <Button
                onClick={() => setShowResubmitForm(true)}
                variant="yellow"
                size="sm"
              >
                <Reply className="h-4 w-4" /> Edit & resubmit
              </Button>
            </div>
          )}
        </div>
      ) : null}

      {canTakeAction ? (
        <div className="rounded-[16px] border border-[var(--color-hairline-soft)] bg-[var(--color-surface-soft)] p-4">
          <p className="text-micro-uppercase text-stone">
            Take action on{" "}
            <span className="font-mono text-charcoal normal-case">
              {activeStepKey}
            </span>
          </p>
          <TextArea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Comment (optional)"
            rows={2}
            className="mt-3"
          />
          <div className="mt-3 flex flex-wrap gap-2">
            {activeStepType === "APPROVAL" ? (
              <>
                <Button
                  onClick={() => takeAction("APPROVE")}
                  disabled={!!busy}
                  variant="success"
                  size="sm"
                >
                  <Check className="h-4 w-4" /> Approve
                </Button>
                <Button
                  onClick={() => takeAction("REJECT")}
                  disabled={!!busy}
                  variant="danger"
                  size="sm"
                >
                  <X className="h-4 w-4" /> Reject
                </Button>
              </>
            ) : null}
            {activeStepType === "EXECUTION" ? (
              <Button
                onClick={() => takeAction("COMPLETE")}
                disabled={!!busy}
                variant="primary"
                size="sm"
              >
                <CheckCircle2 className="h-4 w-4" /> Complete
              </Button>
            ) : null}
            {activeStepType === "INFO_ACK" ? (
              <Button
                onClick={() => takeAction("ACKNOWLEDGE")}
                disabled={!!busy}
                variant="primary"
                size="sm"
              >
                <Eye className="h-4 w-4" /> Acknowledge
              </Button>
            ) : null}
          </div>
        </div>
      ) : null}

      {canHold ? (
        <div className="rounded-[16px] border border-[var(--color-hairline-soft)] p-4">
          <p className="text-micro-uppercase text-stone">Place on hold</p>
          <p className="mt-1 text-caption text-stone">
            Pick a reason — SLA timers pause until you resume.
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {holdReasons.map((h) => {
              const active = holdReasonId === h.id;
              return (
                <button
                  key={h.id}
                  type="button"
                  onClick={() => setHoldReasonId(h.id)}
                  aria-pressed={active}
                  className={
                    "inline-flex items-center rounded-full border px-3 py-1 text-caption-bold transition " +
                    (active
                      ? "border-[var(--color-brand-yellow-deep)] bg-[var(--color-yellow-light)] text-[var(--color-yellow-dark)]"
                      : "border-[var(--color-hairline)] bg-[var(--color-canvas)] text-[var(--color-charcoal)] hover:border-[var(--color-hairline-strong)] hover:bg-[var(--color-surface-soft)]")
                  }
                >
                  {h.label}
                </button>
              );
            })}
          </div>
          <div className="mt-4">
            <Button
              onClick={placeOnHold}
              disabled={!!busy || !holdReasonId}
              variant="secondary"
              size="sm"
            >
              <Pause className="h-4 w-4" /> Hold
            </Button>
          </div>
        </div>
      ) : null}

      {canResume ? (
        <Button onClick={resume} disabled={!!busy} variant="primary" size="sm">
          <Play className="h-4 w-4" /> Resume from hold
        </Button>
      ) : null}

      {canCancel && !showCancelDialog ? (
        <Button
          onClick={() => setShowCancelDialog(true)}
          disabled={!!busy}
          variant="danger"
          size="sm"
        >
          <XCircle className="h-4 w-4" /> Cancel request
        </Button>
      ) : null}

      {canCancel && showCancelDialog ? (
        <div className="rounded-[16px] border border-[var(--color-brand-red-dark)] bg-[var(--color-brand-red)]/30 p-4 space-y-3">
          <p className="text-micro-uppercase text-[var(--color-coral-dark)]">
            Cancel request
          </p>

          <label className="block">
            <span className="text-body-sm-medium text-ink">Outcome</span>
            <Select
              value={cancelOutcome}
              onChange={(e) =>
                setCancelOutcome(
                  e.target.value as (typeof CANCEL_OUTCOMES)[number]["value"],
                )
              }
              className="mt-1"
            >
              {CANCEL_OUTCOMES.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </Select>
          </label>

          {relevantCodes.length > 0 ? (
            <label className="block">
              <span className="text-body-sm-medium text-ink">
                Outcome code (optional)
              </span>
              <Select
                value={cancelCodeId}
                onChange={(e) => setCancelCodeId(e.target.value)}
                className="mt-1"
              >
                <option value="">— None —</option>
                {relevantCodes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </Select>
            </label>
          ) : null}

          <label className="block">
            <span className="text-body-sm-medium text-ink">
              Notes{" "}
              <span className="text-[var(--color-coral-dark)]">*</span>
            </span>
            <TextArea
              value={cancelNotes}
              onChange={(e) => setCancelNotes(e.target.value)}
              rows={3}
              placeholder="Why are you cancelling this request?"
              className="mt-1"
            />
            <span className="mt-1 block text-caption text-stone">
              Required for any non-SUCCESSFUL outcome.
            </span>
          </label>

          <div className="flex gap-2">
            <Button
              onClick={cancel}
              disabled={!cancelNotes.trim() || !!busy}
              variant="danger"
              size="sm"
            >
              {busy ? "Cancelling…" : "Confirm cancel"}
            </Button>
            <Button
              onClick={() => {
                setShowCancelDialog(false);
                setError(null);
              }}
              variant="ghost"
              size="sm"
            >
              Keep open
            </Button>
          </div>
        </div>
      ) : null}

      {!canTakeAction &&
      !canHold &&
      !canResume &&
      !canCancel &&
      !canResubmit ? (
        <div className="rounded-[16px] border border-[var(--color-hairline-soft)] bg-[var(--color-surface-soft)] p-4">
          <p className="text-body-sm-medium text-charcoal">
            No actions available for you on this request.
          </p>
          <p className="mt-1 text-caption text-stone">
            {explainNoActions({
              status,
              isAssignee,
              isRequester,
              activeStepKey,
            })}
          </p>
        </div>
      ) : null}
    </div>
  );
}

function explainNoActions(args: {
  status: string;
  isAssignee: boolean;
  isRequester: boolean;
  activeStepKey: string | null;
}): string {
  if (args.status === "CLOSED") {
    return "This request is closed. The audit trail is read-only.";
  }
  if (args.status === "CANCELLED") {
    return "This request was cancelled. The audit trail is read-only.";
  }
  if (args.status === "ON_HOLD") {
    return "This request is on hold. Only the requester or current assignee can resume it.";
  }
  if (!args.isRequester && !args.isAssignee) {
    return args.activeStepKey
      ? `Step "${args.activeStepKey}" is waiting for someone else. You're not on the assignee snapshot.`
      : "You're not assigned to the active step.";
  }
  if (args.isAssignee && args.activeStepKey === null) {
    return "No step is active right now.";
  }
  return "Check back when the next step activates.";
}
