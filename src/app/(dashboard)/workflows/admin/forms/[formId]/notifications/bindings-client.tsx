"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Badge, Button, Card, confirm } from "@/components/design";

type RecipientKind = "REQUESTER" | "STEP_ASSIGNEES" | "WATCHERS" | "ROLE";

interface Binding {
  id: string;
  event: string;
  emailTemplateKey: string;
  recipientKind: RecipientKind;
  recipientRoleId: string | null;
  roleName: string | null;
  isActive: boolean;
}

interface Role {
  id: string;
  name: string;
}

interface EmailTemplate {
  key: string;
  subject: string;
}

const EVENT_OPTIONS: ReadonlyArray<{ value: string; label: string }> = [
  { value: "request.submitted", label: "Request submitted" },
  { value: "step.activated", label: "Step activated" },
  { value: "step.approved", label: "Step approved" },
  { value: "step.rejected", label: "Step rejected" },
  { value: "request.held", label: "Request placed on hold" },
  { value: "request.resumed", label: "Request resumed" },
  { value: "request.closed", label: "Request closed" },
  { value: "request.cancelled", label: "Request cancelled" },
];

const RECIPIENT_OPTIONS: ReadonlyArray<{ value: RecipientKind; label: string }> = [
  { value: "REQUESTER", label: "Requester" },
  { value: "STEP_ASSIGNEES", label: "Step assignees" },
  { value: "WATCHERS", label: "Watchers" },
  { value: "ROLE", label: "Role members" },
];

function eventLabel(event: string): string {
  return EVENT_OPTIONS.find((e) => e.value === event)?.label ?? event;
}

export function NotificationBindingsClient({
  formId,
  isBuiltIn,
  initialBindings,
  emailTemplates,
  roles,
}: {
  formId: string;
  isBuiltIn: boolean;
  initialBindings: Binding[];
  emailTemplates: EmailTemplate[];
  roles: Role[];
}) {
  const router = useRouter();
  const [bindings, setBindings] = useState<Binding[]>(initialBindings);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form for adding a new binding
  const [draft, setDraft] = useState<{
    event: string;
    emailTemplateKey: string;
    recipientKind: RecipientKind;
    recipientRoleId: string;
  }>({
    event: EVENT_OPTIONS[0]!.value,
    emailTemplateKey: emailTemplates[0]?.key ?? "",
    recipientKind: "REQUESTER",
    recipientRoleId: "",
  });

  const callApi = async (
    method: "POST" | "PATCH" | "DELETE",
    path: string,
    body?: unknown,
  ): Promise<Response> => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(path, {
        method,
        headers: body ? { "content-type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || data.error || "Request failed");
      }
      return res;
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      throw e;
    } finally {
      setBusy(false);
    }
  };

  const addBinding = async () => {
    if (!draft.emailTemplateKey) {
      setError("Pick an email template.");
      return;
    }
    if (draft.recipientKind === "ROLE" && !draft.recipientRoleId) {
      setError("Pick a role.");
      return;
    }
    try {
      const res = await callApi(
        "POST",
        `/api/workflow/admin/forms/${formId}/notification-bindings`,
        {
          event: draft.event,
          emailTemplateKey: draft.emailTemplateKey,
          recipientKind: draft.recipientKind,
          recipientRoleId:
            draft.recipientKind === "ROLE" ? draft.recipientRoleId : null,
          isActive: true,
        },
      );
      const data = (await res.json()) as { binding: Omit<Binding, "roleName"> };
      const role = roles.find((r) => r.id === data.binding.recipientRoleId);
      setBindings((prev) => [
        ...prev,
        { ...data.binding, roleName: role?.name ?? null },
      ]);
      router.refresh();
    } catch {
      // error message already in state
    }
  };

  const toggleActive = async (id: string, next: boolean) => {
    try {
      await callApi(
        "PATCH",
        `/api/workflow/admin/forms/${formId}/notification-bindings/${id}`,
        { isActive: next },
      );
      setBindings((prev) =>
        prev.map((b) => (b.id === id ? { ...b, isActive: next } : b)),
      );
    } catch {
      /* surfaced */
    }
  };

  const remove = async (id: string) => {
    if (
      !(await confirm({
        title: "Delete notification binding?",
        message: "Future events on this form won't trigger this template.",
        confirmLabel: "Delete",
        danger: true,
      }))
    )
      return;
    try {
      await callApi(
        "DELETE",
        `/api/workflow/admin/forms/${formId}/notification-bindings/${id}`,
      );
      setBindings((prev) => prev.filter((b) => b.id !== id));
    } catch {
      /* surfaced */
    }
  };

  const recipientLabel = (b: Binding): string => {
    if (b.recipientKind === "ROLE") {
      return `Role: ${b.roleName ?? "(missing)"}`;
    }
    return RECIPIENT_OPTIONS.find((o) => o.value === b.recipientKind)?.label ?? b.recipientKind;
  };

  return (
    <div className="space-y-6">
      {error ? (
        <div className="rounded-md border border-(--color-brand-red-dark) bg-brand-red/40 px-3 py-2 text-body-sm text-coral-dark">
          {error}
        </div>
      ) : null}

      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left">
            <thead className="border-b border-hairline-soft bg-surface-soft">
              <tr className="text-micro-uppercase text-stone">
                <th className="px-5 py-3">Event</th>
                <th className="px-5 py-3">Email template</th>
                <th className="px-5 py-3">Recipients</th>
                <th className="px-5 py-3">Active</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {bindings.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-5 py-8 text-center text-body-sm text-stone"
                  >
                    No notifications attached to this form yet.
                  </td>
                </tr>
              ) : (
                bindings.map((b) => (
                  <tr
                    key={b.id}
                    className="border-b border-hairline-soft last:border-0"
                  >
                    <td className="px-5 py-3 text-body-sm-medium text-ink">
                      {eventLabel(b.event)}
                      <p className="font-mono text-caption text-stone">
                        {b.event}
                      </p>
                    </td>
                    <td className="px-5 py-3 font-mono text-body-sm text-charcoal">
                      {b.emailTemplateKey}
                    </td>
                    <td className="px-5 py-3 text-body-sm text-charcoal">
                      {recipientLabel(b)}
                    </td>
                    <td className="px-5 py-3">
                      <button
                        type="button"
                        disabled={isBuiltIn || busy}
                        onClick={() => toggleActive(b.id, !b.isActive)}
                        className="cursor-pointer disabled:cursor-not-allowed"
                      >
                        {b.isActive ? (
                          <Badge tone="success">Active</Badge>
                        ) : (
                          <Badge tone="neutral">Inactive</Badge>
                        )}
                      </button>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => remove(b.id)}
                        disabled={isBuiltIn || busy}
                        className="text-body-sm text-coral-dark hover:underline disabled:text-stone disabled:no-underline"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {!isBuiltIn ? (
        <Card>
          <h3 className="text-h5 text-ink">Add notification</h3>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <label className="block">
              <span className="text-caption text-stone">Event</span>
              <select
                value={draft.event}
                onChange={(e) => setDraft({ ...draft, event: e.target.value })}
                className="mt-1 w-full rounded-md border border-hairline-strong bg-canvas px-3 py-2 text-body-sm text-ink"
              >
                {EVENT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-caption text-stone">Email template</span>
              <select
                value={draft.emailTemplateKey}
                onChange={(e) =>
                  setDraft({ ...draft, emailTemplateKey: e.target.value })
                }
                className="mt-1 w-full rounded-md border border-hairline-strong bg-canvas px-3 py-2 text-body-sm text-ink"
              >
                {emailTemplates.map((t) => (
                  <option key={t.key} value={t.key}>
                    {t.key} — {t.subject}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-caption text-stone">Recipients</span>
              <select
                value={draft.recipientKind}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    recipientKind: e.target.value as RecipientKind,
                  })
                }
                className="mt-1 w-full rounded-md border border-hairline-strong bg-canvas px-3 py-2 text-body-sm text-ink"
              >
                {RECIPIENT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
            {draft.recipientKind === "ROLE" ? (
              <label className="block">
                <span className="text-caption text-stone">Role</span>
                <select
                  value={draft.recipientRoleId}
                  onChange={(e) =>
                    setDraft({ ...draft, recipientRoleId: e.target.value })
                  }
                  className="mt-1 w-full rounded-md border border-hairline-strong bg-canvas px-3 py-2 text-body-sm text-ink"
                >
                  <option value="">— Select role —</option>
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </label>
            ) : (
              <span />
            )}
          </div>
          <div className="mt-4">
            <Button onClick={addBinding} disabled={busy} variant="primary">
              {busy ? "Saving…" : "Add binding"}
            </Button>
          </div>
        </Card>
      ) : null}
    </div>
  );
}
