import { notFound, redirect } from "next/navigation";

import { Badge, Card, LinkButton } from "@/components/design";
import { prisma } from "@/infrastructure/database/prisma/client";
import { getCurrentUserId } from "@/lib/auth/session";
import { FEATURE_FLAGS } from "@/lib/features/feature-flag-keys";
import { requireFeature } from "@/lib/features/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { requirePermission } from "@/lib/permissions/server";

export const dynamic = "force-dynamic";

interface FieldDef {
  key: string;
  label: string;
  type: string;
  config?: { targetFormName?: string };
}

export default async function TimelinePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireFeature(FEATURE_FLAGS.WORKFLOW_ENGINE);
  await requirePermission(PERMISSIONS.WORKFLOWS_REQUESTS_VIEW_OWN);

  const userId = await getCurrentUserId();
  if (!userId) redirect("/login");

  const { id } = await params;

  const req = await prisma.request.findFirst({
    where: { id },
    select: {
      id: true,
      referenceNumber: true,
      form: { select: { name: true } },
      formVersion: { select: { schemaJson: true } },
    },
  });
  if (!req) notFound();

  const auditEntries = await prisma.auditEntry.findMany({
    where: { requestId: req.id },
    orderBy: { createdAt: "asc" },
    include: { actor: { select: { name: true, email: true } } },
  });

  const fieldHistory = await prisma.fieldHistoryEntry.findMany({
    where: { requestId: req.id },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      fieldKey: true,
      valueJson: true,
      auditEntryId: true,
      createdAt: true,
    },
  });

  const schema = req.formVersion.schemaJson as { fields?: FieldDef[] } | null;
  const fieldByKey = new Map<string, FieldDef>();
  for (const f of schema?.fields ?? []) fieldByKey.set(f.key, f);

  const linkIds = new Set<string>();
  for (const h of fieldHistory) {
    const def = fieldByKey.get(h.fieldKey);
    if (def?.type !== "REQUEST_LINK") continue;
    const value = (h.valueJson as { value?: unknown } | null)?.value;
    if (typeof value === "string" && value.length > 0) linkIds.add(value);
  }
  const linkedRequests =
    linkIds.size > 0
      ? await prisma.request.findMany({
          where: {
            id: { in: Array.from(linkIds) },
          },
          select: {
            id: true,
            referenceNumber: true,
            fieldValues: {
              where: { fieldKey: { in: ["title", "name", "summary"] } },
              select: { fieldKey: true, valueJson: true },
            },
          },
        })
      : [];
  const linkRefById = new Map(
    linkedRequests.map((r) => {
      const ref = r.referenceNumber ?? r.id;
      const titleRow =
        r.fieldValues.find((v) => v.fieldKey === "title") ??
        r.fieldValues.find((v) => v.fieldKey === "name") ??
        r.fieldValues.find((v) => v.fieldKey === "summary");
      const titleRaw = (titleRow?.valueJson as { value?: unknown } | null)
        ?.value;
      const title = typeof titleRaw === "string" ? titleRaw.trim() : "";
      return [r.id, title ? `${ref} · ${title}` : ref];
    }),
  );

  const historyByAudit = new Map<string, typeof fieldHistory>();
  for (const h of fieldHistory) {
    const arr = historyByAudit.get(h.auditEntryId) ?? [];
    arr.push(h);
    historyByAudit.set(h.auditEntryId, arr);
  }

  return (
    <div className="space-y-6">
      <LinkButton
        href={`/workflows/requests/${req.id}`}
        variant="ghost"
        size="sm"
      >
        ← Back to request
      </LinkButton>

      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-2">
          <span className="text-caption font-mono text-stone">
            {req.referenceNumber}
          </span>
          <h1 className="text-h2">Timeline</h1>
          <p className="text-subtitle text-slate">{req.form.name}</p>
        </div>
        <a
          href={`/api/workflow/requests/${req.id}/timeline/export`}
          className="inline-flex items-center gap-2 rounded-md border border-[var(--color-hairline)] px-3 py-1.5 text-body-sm-medium text-charcoal transition hover:bg-[var(--color-surface-soft)]"
          download
        >
          Export CSV
        </a>
      </header>

      <Card>
        <ol className="relative space-y-5 border-l-2 border-[var(--color-hairline)] pl-6">
          {auditEntries.map((e) => {
            const fh = historyByAudit.get(e.id) ?? [];
            const action = formatAction(e.action);
            const tone = toneFor(e.action);
            const summary = summarisePayload(
              e.action,
              e.payloadJson,
              fh.length,
            );
            return (
              <li key={e.id} className="relative">
                <span
                  aria-hidden
                  className={`absolute -left-8.25 mt-1 block h-3 w-3 rounded-full ring-4 ring-[var(--color-canvas)] ${tone.dot}`}
                />
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-body-md-medium text-ink">{action}</p>
                  {summary ? (
                    <Badge tone={tone.badge as never}>{summary}</Badge>
                  ) : null}
                </div>
                <p className="mt-0.5 text-caption text-stone">
                  {e.actor
                    ? e.actor.name || e.actor.email
                    : e.actorSystem || "system"}{" "}
                  · {new Date(e.createdAt).toLocaleString()}
                </p>

                {fh.length > 0 ? (
                  <ul className="mt-2 space-y-1 text-body-sm text-slate">
                    {fh.map((h) => {
                      const def = fieldByKey.get(h.fieldKey);
                      const rawValue = (h.valueJson as { value?: unknown })
                        ?.value;
                      const display = renderValue(rawValue, def, linkRefById);
                      return (
                        <li key={h.id} className="flex flex-wrap gap-x-2">
                          <span className="font-medium text-charcoal">
                            {def?.label ?? h.fieldKey}
                          </span>
                          <span className="text-stone">·</span>
                          <span className="wrap-break-word text-ink">
                            {display}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                ) : null}

                {e.payloadJson &&
                shouldShowDetails(e.action, e.payloadJson) ? (
                  <details className="mt-2">
                    <summary className="cursor-pointer select-none text-caption text-stone hover:text-ink">
                      Show technical details
                    </summary>
                    <pre className="mt-2 rounded-md border border-[var(--color-hairline-soft)] bg-[var(--color-surface-soft)] px-3 py-2 text-caption text-slate">
                      {JSON.stringify(e.payloadJson, null, 2)}
                    </pre>
                  </details>
                ) : null}
              </li>
            );
          })}
          {auditEntries.length === 0 ? (
            <li className="text-body-sm text-stone">
              No timeline entries yet.
            </li>
          ) : null}
        </ol>
      </Card>
    </div>
  );
}

function formatAction(action: string): string {
  const map: Record<string, string> = {
    "request.submit": "Request submitted",
    "request.resubmit": "Request resubmitted",
    "request.cancel": "Request cancelled",
    "request.close": "Request closed",
    "request.hold": "Placed on hold",
    "request.resume": "Resumed from hold",
    "request.return_to_draft_after_reject": "Returned for correction",
    "request.override_outcome": "Outcome overridden by admin",
    "step.activate": "Step activated",
    "step.advance": "Step completed",
    "step.reject": "Step rejected",
    "step.reassign": "Step reassigned",
    "step.force_advance": "Force-advanced by admin",
    "step.action": "Action taken",
    "step.sla_escalation": "SLA escalation fired",
  };
  return (
    map[action] ??
    action
      .split(".")
      .map((s) => s.replace(/_/g, " "))
      .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
      .join(" — ")
  );
}

function toneFor(action: string): {
  dot: string;
  badge: "success" | "neutral" | "yellow" | "danger" | "purple";
} {
  if (action === "request.submit")
    return { dot: "bg-[var(--color-brand-yellow)]", badge: "yellow" };
  if (action === "request.close")
    return { dot: "bg-[var(--color-success-accent)]", badge: "success" };
  if (action === "request.cancel")
    return { dot: "bg-[var(--color-brand-coral)]", badge: "danger" };
  if (action.startsWith("step.reject"))
    return { dot: "bg-[var(--color-brand-coral)]", badge: "danger" };
  if (action === "step.advance")
    return { dot: "bg-[var(--color-success-accent)]", badge: "success" };
  if (action === "request.hold")
    return { dot: "bg-[var(--color-brand-yellow-deep)]", badge: "yellow" };
  if (action === "request.resume")
    return { dot: "bg-[var(--color-brand-teal)]", badge: "neutral" };
  if (action === "step.activate")
    return { dot: "bg-[var(--color-brand-blue)]", badge: "purple" };
  return { dot: "bg-[var(--color-stone)]", badge: "neutral" };
}

function summarisePayload(
  action: string,
  payload: unknown,
  fieldCount: number,
): string {
  if (!payload || typeof payload !== "object") return "";
  const p = payload as Record<string, unknown>;
  if (action === "step.activate" && typeof p.stepKey === "string") {
    return `${p.stepKey}${p.stepType ? ` · ${String(p.stepType).toLowerCase()}` : ""}`;
  }
  if (
    (action === "request.close" || action === "request.cancel") &&
    typeof p.outcome === "string"
  ) {
    return p.outcome;
  }
  if (action === "step.sla_escalation" && typeof p.actionKind === "string") {
    return String(p.actionKind);
  }
  if (action === "request.submit" && fieldCount > 0) {
    return `${fieldCount} field${fieldCount === 1 ? "" : "s"}`;
  }
  return "";
}

function shouldShowDetails(action: string, payload: unknown): boolean {
  if (!payload || typeof payload !== "object") return false;
  const keys = Object.keys(payload as object);
  if (keys.length === 0) return false;
  if (
    action === "request.submit" ||
    action === "step.activate" ||
    action === "request.close" ||
    action === "request.cancel"
  ) {
    return false;
  }
  return true;
}

function renderValue(
  v: unknown,
  def: FieldDef | undefined,
  linkRefs: Map<string, string>,
): string {
  if (v === null || v === undefined) return "—";
  if (def?.type === "REQUEST_LINK" && typeof v === "string") {
    const ref = linkRefs.get(v);
    return ref ?? v;
  }
  if (def?.type === "USER_PICKER" && typeof v === "string") {
    return v.slice(0, 12);
  }
  if (def?.type === "DATE" && typeof v === "string") return v;
  if (def?.type === "DATETIME" && typeof v === "string")
    return v.replace("T", " ");
  if (def?.type === "CHECKBOX") return v === true ? "Yes" : "No";
  if (Array.isArray(v)) return v.join(", ");
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
}
