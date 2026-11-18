"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { PencilLine } from "lucide-react";
import { toast } from "sonner";

import { Button, Card } from "@/components/design";
import { FormRenderer } from "@/components/workflows/form-renderer";
import { isCorrectableField } from "@/core/domain/workflow/form-access";
import type { FormSchema } from "@/core/domain/workflow/types";

interface User {
  id: string;
  name: string | null;
  email: string;
}

function sameValue(a: unknown, b: unknown): boolean {
  return JSON.stringify(a ?? null) === JSON.stringify(b ?? null);
}

/**
 * Form managers (and owners) correct values the requester got wrong. Every
 * change is saved to the request's field history with the previous value.
 */
export function CorrectFieldsPanel({
  requestId,
  schema,
  values,
  orgUsers,
}: {
  requestId: string;
  schema: FormSchema;
  values: Record<string, unknown>;
  orgUsers: User[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Record<string, unknown>>(values);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const correctable = useMemo(
    () => ({ ...schema, fields: schema.fields.filter(isCorrectableField) }),
    [schema],
  );
  const changes = Object.fromEntries(
    correctable.fields
      .filter((f) => !sameValue(draft[f.key], values[f.key]))
      .map((f) => [f.key, draft[f.key] ?? null]),
  );
  const changeCount = Object.keys(changes).length;

  if (correctable.fields.length === 0) return null;

  async function save() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/workflow/requests/${requestId}/fields`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ updates: changes }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(
          body.message || body.error || `Request failed (${res.status})`,
        );
      }
      toast.success(
        `${changeCount} field${changeCount === 1 ? "" : "s"} corrected`,
      );
      setOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-h4">Correct fields</h2>
          <p className="text-body-sm text-stone mt-1 max-w-2xl">
            You manage this form, so you can fix values the requester entered
            wrongly. Each change is kept in the request&apos;s history with the
            previous value. Steps already assigned keep their assignees.
          </p>
        </div>
        {!open ? (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              setDraft(values);
              setError(null);
              setOpen(true);
            }}
          >
            <PencilLine className="h-4 w-4" /> Correct fields
          </Button>
        ) : null}
      </div>

      {open ? (
        <div className="mt-4 space-y-4">
          <FormRenderer
            schema={correctable}
            values={draft}
            onChange={setDraft}
            users={orgUsers}
          />
          {error ? (
            <p className="text-body-sm text-[var(--color-coral-dark)]">
              {error}
            </p>
          ) : null}
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="primary"
              size="sm"
              onClick={() => void save()}
              disabled={busy || changeCount === 0}
            >
              {busy
                ? "Saving…"
                : changeCount === 0
                  ? "No changes"
                  : `Save ${changeCount} change${changeCount === 1 ? "" : "s"}`}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setOpen(false)}
              disabled={busy}
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : null}
    </Card>
  );
}
