"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight, Eye, Mail, Pencil } from "lucide-react";

import {
  Badge,
  Button,
  Card,
  confirm,
  FieldLabel,
  TextArea,
  TextInput,
} from "@/components/design";

interface Template {
  id: string;
  key: string;
  subject: string;
  bodyHtml: string;
  bodyText: string | null;
}

const SAMPLE_VARIABLES: Record<string, string> = {
  "request.referenceNumber": "CR-2026-0001",
  "request.url": "https://techhub.barq.com/workflows/requests/cr-0001",
  "request.title": "Upgrade core banking gateway TLS",
  "request.formName": "Change Request",
  "request.status": "IN_REVIEW",
  "request.outcome": "SUCCESSFUL",
  step_name: "Peer review",
  requester_name: "Saad Al-Otaibi",
  requester_email: "saad@barq.com",
  assignee_name: "Khalid Al-Subaie",
  organization_name: "Barq",
};

const VARIABLE_DESCRIPTIONS: Record<string, string> = {
  "request.referenceNumber": "Reference number, e.g. CR-2026-0001",
  "request.url": "Direct link to the request page",
  "request.title": "Human-readable request title",
  "request.formName": "Form name (e.g. Change Request)",
  "request.status": "Current status (DRAFT, IN_REVIEW, …)",
  "request.outcome": "Final outcome (only when terminal)",
  step_name: "Active step name",
  requester_name: "Person who submitted the request",
  requester_email: "Submitter email",
  assignee_name: "Currently assigned user (per step)",
  organization_name: "Tenant name",
};

function substituteVariables(template: string): string {
  return template.replace(/\{\{\s*([^}]+?)\s*\}\}/g, (match, key: string) => {
    const trimmed = key.trim();
    if (trimmed in SAMPLE_VARIABLES) {
      return SAMPLE_VARIABLES[trimmed]!;
    }
    return `[${trimmed}]`;
  });
}

export function EmailTemplatesClient({ initial }: { initial: Template[] }) {
  const router = useRouter();
  const [list, setList] = useState(initial);
  const [editing, setEditing] = useState<Template | null>(null);
  const [draft, setDraft] = useState({
    key: "",
    subject: "",
    bodyHtml: "",
    bodyText: "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<"edit" | "preview">("edit");

  function startNew() {
    setEditing(null);
    setDraft({ key: "", subject: "", bodyHtml: "", bodyText: "" });
    setView("edit");
  }
  function startEdit(t: Template) {
    setEditing(t);
    setDraft({
      key: t.key,
      subject: t.subject,
      bodyHtml: t.bodyHtml,
      bodyText: t.bodyText ?? "",
    });
  }

  async function save() {
    setBusy(true);
    setError(null);
    try {
      if (editing) {
        const response = await fetch(
          `/api/workflow/admin/email-templates/${editing.id}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              subject: draft.subject,
              bodyHtml: draft.bodyHtml,
              bodyText: draft.bodyText || null,
            }),
          },
        );
        if (!response.ok) throw new Error("Failed");
        setList(
          list.map((t) =>
            t.id === editing.id
              ? {
                  ...t,
                  subject: draft.subject,
                  bodyHtml: draft.bodyHtml,
                  bodyText: draft.bodyText || null,
                }
              : t,
          ),
        );
      } else {
        const response = await fetch("/api/workflow/admin/email-templates", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            key: draft.key,
            subject: draft.subject,
            bodyHtml: draft.bodyHtml,
            bodyText: draft.bodyText || undefined,
          }),
        });
        if (!response.ok) throw new Error("Failed");
        const body = (await response.json()) as { template: Template };
        setList([...list, body.template]);
      }
      router.refresh();
      startNew();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    if (
      !(await confirm({
        title: "Delete email template?",
        message:
          "Bindings that reference this template will stop firing emails until you update them.",
        confirmLabel: "Delete",
        danger: true,
      }))
    )
      return;
    await fetch(`/api/workflow/admin/email-templates/${id}`, {
      method: "DELETE",
    });
    setList(list.filter((t) => t.id !== id));
    if (editing?.id === id) startNew();
  }

  function insertVariable(varName: string) {
    const placeholder = `{{${varName}}}`;
    setDraft({
      ...draft,
      bodyHtml: draft.bodyHtml + placeholder,
    });
  }

  const previewSubject = substituteVariables(draft.subject || "(no subject)");
  const previewBody = substituteVariables(
    draft.bodyHtml || "<p>(empty body)</p>",
  );

  return (
    <div className="grid gap-4 lg:grid-cols-[300px_1fr]">
      <Card className="lg:sticky lg:top-20 lg:self-start lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-h5">Templates</h3>
          <span className="text-caption text-stone">{list.length}</span>
        </div>
        <ul className="mt-3 space-y-1">
          {list.map((t) => (
            <li
              key={t.id}
              className={
                "flex items-center justify-between gap-2 rounded-md border px-3 py-2 transition " +
                (editing?.id === t.id
                  ? "border-[var(--color-brand-blue)] bg-[var(--color-surface-featured)]"
                  : "border-[var(--color-hairline)] bg-[var(--color-canvas)] hover:border-[var(--color-hairline-strong)] hover:bg-[var(--color-surface-soft)]")
              }
            >
              <button
                onClick={() => startEdit(t)}
                className="min-w-0 flex-1 truncate text-left"
              >
                <span className="block truncate font-mono text-caption-bold text-ink">
                  {t.key}
                </span>
                <span className="block truncate text-caption text-stone">
                  {t.subject}
                </span>
              </button>
              <button
                onClick={() => remove(t.id)}
                aria-label={`Delete ${t.key}`}
                className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-caption text-stone hover:bg-[var(--color-brand-red)] hover:text-[var(--color-coral-dark)]"
              >
                ×
              </button>
            </li>
          ))}
          {list.length === 0 ? (
            <li className="text-body-sm text-stone">No templates yet.</li>
          ) : null}
        </ul>
        <div className="mt-3">
          <Button onClick={startNew} variant="secondary" size="sm">
            + New template
          </Button>
        </div>
      </Card>

      <Card size="feature">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-h5">
              {editing ? `Edit "${editing.key}"` : "New template"}
            </h3>
            <p className="mt-1 text-caption text-stone">
              Use{" "}
              <code className="rounded bg-[var(--color-surface-soft)] px-1 font-mono">{`{{variable}}`}</code>{" "}
              placeholders — they&apos;ll be replaced at send time.
            </p>
          </div>

          <div className="inline-flex items-center rounded-full border border-[var(--color-hairline)] bg-[var(--color-surface-soft)] p-0.5">
            <button
              type="button"
              onClick={() => setView("edit")}
              className={
                "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-caption-bold transition " +
                (view === "edit"
                  ? "bg-[var(--color-canvas)] text-[var(--color-ink)] shadow-[var(--shadow-1)]"
                  : "text-stone hover:text-[var(--color-ink)]")
              }
            >
              <Pencil className="h-3.5 w-3.5" /> Edit
            </button>
            <button
              type="button"
              onClick={() => setView("preview")}
              className={
                "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-caption-bold transition " +
                (view === "preview"
                  ? "bg-[var(--color-canvas)] text-[var(--color-ink)] shadow-[var(--shadow-1)]"
                  : "text-stone hover:text-[var(--color-ink)]")
              }
            >
              <Eye className="h-3.5 w-3.5" /> Preview
            </button>
          </div>
        </div>

        {view === "edit" ? (
          <div className="mt-4 space-y-3">
            {!editing ? (
              <div className="space-y-2">
                <FieldLabel
                  required
                  helper="Lowercase + dots/underscores allowed."
                >
                  Key
                </FieldLabel>
                <TextInput
                  value={draft.key}
                  onChange={(e) =>
                    setDraft({ ...draft, key: e.target.value })
                  }
                  placeholder="e.g., request.closed"
                  className="font-mono"
                />
              </div>
            ) : null}

            <div className="space-y-2">
              <FieldLabel required>Subject</FieldLabel>
              <TextInput
                value={draft.subject}
                onChange={(e) =>
                  setDraft({ ...draft, subject: e.target.value })
                }
                placeholder='e.g., "Request {{request.referenceNumber}} closed"'
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-end justify-between gap-2">
                <FieldLabel required>HTML body</FieldLabel>
                <span className="text-caption text-stone">
                  Click a variable to insert →
                </span>
              </div>

              <div className="flex flex-wrap gap-1.5 rounded-lg border border-[var(--color-hairline-soft)] bg-[var(--color-surface-soft)] p-2">
                {Object.keys(SAMPLE_VARIABLES).map((key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => insertVariable(key)}
                    title={VARIABLE_DESCRIPTIONS[key]}
                    className="inline-flex items-center gap-1 rounded-full border border-[var(--color-hairline)] bg-[var(--color-canvas)] px-2.5 py-1 font-mono text-[11px] text-charcoal transition hover:border-[var(--color-brand-yellow-deep)] hover:bg-[var(--color-yellow-light)] hover:text-[var(--color-yellow-dark)]"
                  >
                    {`{{${key}}}`}
                  </button>
                ))}
              </div>

              <TextArea
                value={draft.bodyHtml}
                onChange={(e) =>
                  setDraft({ ...draft, bodyHtml: e.target.value })
                }
                rows={12}
                className="font-mono"
                placeholder='<p>Hello {{requester_name}},</p>&#10;<p>Your request <a href="{{request.url}}">{{request.referenceNumber}}</a> was closed.</p>'
              />
            </div>

            <div className="space-y-2">
              <FieldLabel helper="Optional plain-text fallback.">
                Plain text body
              </FieldLabel>
              <TextArea
                value={draft.bodyText}
                onChange={(e) =>
                  setDraft({ ...draft, bodyText: e.target.value })
                }
                rows={4}
              />
            </div>

            {error ? (
              <p className="text-body-sm text-[var(--color-coral-dark)]">
                {error}
              </p>
            ) : null}

            <div className="flex items-center gap-2">
              <Button
                onClick={save}
                disabled={
                  busy ||
                  !draft.subject ||
                  !draft.bodyHtml ||
                  (!editing && !draft.key)
                }
                variant="primary"
              >
                {busy ? "Saving…" : editing ? "Save changes" : "Create"}
              </Button>
              <Button
                onClick={() => setView("preview")}
                variant="ghost"
                disabled={!draft.subject && !draft.bodyHtml}
              >
                <Eye className="h-4 w-4" /> See preview
              </Button>
            </div>
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            <div className="rounded-2xl border border-[var(--color-hairline)] bg-[var(--color-surface-soft)] p-4">
              <div className="flex items-center gap-2 text-caption text-stone">
                <Mail className="h-3.5 w-3.5" />
                <span className="text-micro-uppercase">Inbox preview</span>
                <Badge tone="neutral" className="ml-auto">
                  Sample data
                </Badge>
              </div>

              <div className="mt-3 rounded-xl border border-[var(--color-hairline-soft)] bg-[var(--color-canvas)] shadow-[var(--shadow-1)]">
                <div className="border-b border-[var(--color-hairline-soft)] px-4 py-3">
                  <div className="flex items-center gap-2 text-caption text-stone">
                    <span className="text-micro-uppercase">From</span>
                    <span className="text-charcoal">
                      TechHub Workflows &lt;notifications@techhub.barq.com&gt;
                    </span>
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-caption text-stone">
                    <span className="text-micro-uppercase">To</span>
                    <span className="text-charcoal">
                      {SAMPLE_VARIABLES.requester_name} &lt;
                      {SAMPLE_VARIABLES.requester_email}&gt;
                    </span>
                  </div>
                  <h4 className="mt-2 text-h5 text-ink">{previewSubject}</h4>
                </div>

                <div
                  className="email-preview-body px-5 py-4 text-body-md text-charcoal"
                  dangerouslySetInnerHTML={{ __html: previewBody }}
                />
              </div>

              <p className="mt-3 text-caption text-stone">
                <ArrowRight className="mr-1 inline-block h-3 w-3" />
                Variables are replaced with the sample values above. Real
                sends will use the actual request data.
              </p>
            </div>

            {draft.bodyText ? (
              <details className="rounded-xl border border-[var(--color-hairline-soft)] bg-[var(--color-canvas)] p-4">
                <summary className="cursor-pointer text-body-sm-medium text-charcoal">
                  Plain-text fallback
                </summary>
                <pre className="mt-3 whitespace-pre-wrap font-mono text-caption text-charcoal">
                  {substituteVariables(draft.bodyText)}
                </pre>
              </details>
            ) : null}
          </div>
        )}
      </Card>
    </div>
  );
}
