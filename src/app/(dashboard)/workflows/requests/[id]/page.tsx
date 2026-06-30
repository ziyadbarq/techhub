import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { Badge, Card, LinkButton } from "@/components/design";
import { CommentThread } from "@/components/workflows/comment-thread";
import { WorkflowGraph } from "@/components/workflows/workflow-graph";
import { prisma } from "@/infrastructure/database/prisma/client";
import { getCurrentUserId } from "@/lib/auth/session";
import { FEATURE_FLAGS } from "@/lib/features/feature-flag-keys";
import { requireFeature } from "@/lib/features/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { hasPermission, requirePermission } from "@/lib/permissions/server";

import { RequestActions } from "./request-actions";
import { AdminOverridePanel } from "./admin-override-panel";

export const dynamic = "force-dynamic";

function statusBadge(status: string, outcome: string | null) {
  if (status === "CLOSED") {
    return (
      <Badge tone={outcome === "SUCCESSFUL" ? "success" : "neutral"}>
        {outcome ?? status}
      </Badge>
    );
  }
  if (status === "CANCELLED") return <Badge tone="danger">CANCELLED</Badge>;
  if (status === "ON_HOLD") return <Badge tone="yellow">ON HOLD</Badge>;
  if (status === "DRAFT") return <Badge tone="neutral">DRAFT</Badge>;
  return <Badge tone="purple">{status}</Badge>;
}

export default async function RequestDetailPage({
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
    include: {
      form: { select: { id: true, name: true } },
      formVersion: { select: { schemaJson: true, versionNumber: true } },
      workflowVersion: { select: { graphJson: true, versionNumber: true } },
      requester: { select: { id: true, name: true, email: true } },
      holdReason: { select: { key: true, label: true } },
      outcomeCode: { select: { key: true, label: true } },
    },
  });
  if (!req) notFound();

  const stepInstances = await prisma.stepInstance.findMany({
    where: { requestId: req.id },
    orderBy: { createdAt: "asc" },
    include: {
      snapshots: {
        select: { user: { select: { id: true, name: true, email: true } } },
      },
    },
  });

  const fieldValuesRows = await prisma.requestFieldValue.findMany({
    where: { requestId: req.id },
    select: { fieldKey: true, valueJson: true },
  });
  const fieldValues: Record<string, unknown> = {};
  for (const row of fieldValuesRows) {
    const v = row.valueJson as { value?: unknown } | null;
    fieldValues[row.fieldKey] =
      v && typeof v === "object" && "value" in v ? v.value : v;
  }

  const orgUsers = await prisma.user.findMany({
    select: { id: true, name: true, email: true },
    orderBy: { createdAt: "asc" },
  });

  const holdReasons = await prisma.holdReason.findMany({
    where: { isActive: true },
    select: { id: true, label: true },
  });

  const activeStep = stepInstances.find((s) => s.status === "ACTIVE");
  const wfGraph = req.workflowVersion.graphJson as
    | { steps?: Array<{ key: string; type: string }> }
    | null;
  const activeStepType =
    activeStep && wfGraph?.steps
      ? (wfGraph.steps.find((g) => g.key === activeStep.stepKey)?.type ?? null)
      : null;
  const isAssignee =
    activeStep?.snapshots.some((s) => s.user.id === userId) ?? false;
  const isRequester = req.requesterId === userId;
  const canOverride = await hasPermission(PERMISSIONS.WORKFLOWS_REQUESTS_OVERRIDE);

  const schema = req.formVersion.schemaJson as {
    fields: Array<{
      key: string;
      label: string;
      type: string;
      position: number;
      visibility?: "VISIBLE" | "HIDDEN" | "ADMINISTRATIVE";
      config?: Record<string, unknown>;
    }>;
  };
  const visibleFields = schema.fields.filter((f) => {
    const v = f.visibility ?? "VISIBLE";
    if (v === "HIDDEN") return false;
    if (v === "ADMINISTRATIVE") return canOverride;
    return true;
  });

  // For REQUEST_LINK fields, resolve target request ids → reference numbers.
  const linkIds = new Set<string>();
  for (const f of visibleFields) {
    if (f.type !== "REQUEST_LINK") continue;
    const v = fieldValues[f.key];
    if (typeof v === "string" && v.length > 0) linkIds.add(v);
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
  const linkRefById = new Map<string, { ref: string; title: string }>(
    linkedRequests.map((r) => {
      const ref = r.referenceNumber ?? r.id;
      const titleRow =
        r.fieldValues.find((v) => v.fieldKey === "title") ??
        r.fieldValues.find((v) => v.fieldKey === "name") ??
        r.fieldValues.find((v) => v.fieldKey === "summary");
      const titleRaw = (titleRow?.valueJson as { value?: unknown } | null)
        ?.value;
      const title = typeof titleRaw === "string" ? titleRaw.trim() : "";
      return [r.id, { ref, title }];
    }),
  );

  return (
    <div className="space-y-8">
      <LinkButton href="/workflows/requests" variant="ghost" size="sm">
        ← Requests
      </LinkButton>

      {/* Header band */}
      <Card
        tone={req.status === "ON_HOLD" ? "yellow" : "white"}
        size="feature"
      >
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div>
            <p className="text-caption font-mono text-stone">
              {req.referenceNumber}
            </p>
            <h1 className="mt-2 text-h2">{req.form.name}</h1>
            <p className="mt-1 text-body-md text-slate">
              Submitted by{" "}
              <span className="text-charcoal">
                {req.requester.name || req.requester.email}
              </span>
              {req.submittedAt
                ? ` · ${new Date(req.submittedAt).toLocaleString()}`
                : null}
            </p>
          </div>
          <div className="flex flex-col items-end gap-2 max-w-md">
            {statusBadge(req.status, req.outcome)}
            {req.outcome &&
            (req.status === "CLOSED" || req.status === "CANCELLED") ? (
              <span className="text-caption text-charcoal">
                Outcome: <span className="font-mono">{req.outcome}</span>
                {req.outcomeCode ? (
                  <>
                    {" · "}
                    <span className="font-mono">{req.outcomeCode.key}</span>
                  </>
                ) : null}
              </span>
            ) : null}
            {req.outcomeNotes ? (
              <span className="text-caption text-charcoal text-right whitespace-pre-wrap">
                <span className="text-stone">Notes:</span> {req.outcomeNotes}
              </span>
            ) : null}
            {req.holdReason ? (
              <span className="text-caption text-[var(--color-yellow-dark)]">
                Hold reason: {req.holdReason.label}
              </span>
            ) : null}
          </div>
        </div>
      </Card>

      <div className="space-y-5">
        {/* Submission */}
        <Card>
          <h2 className="text-h4">Submission</h2>
          <dl className="mt-4 divide-y divide-[var(--color-hairline-soft)]">
            {visibleFields
              .sort((a, b) => a.position - b.position)
              .map((f) => {
                const isAdminOnly =
                  (f.visibility ?? "VISIBLE") === "ADMINISTRATIVE";
                const value = fieldValues[f.key];
                const linkInfo =
                  f.type === "REQUEST_LINK" && typeof value === "string"
                    ? linkRefById.get(value)
                    : undefined;
                return (
                  <div key={f.key} className="grid grid-cols-3 gap-4 py-3">
                    <dt className="flex flex-wrap items-center gap-2 text-body-sm text-stone">
                      {f.label}
                      {isAdminOnly ? (
                        <span className="rounded-full bg-[var(--color-yellow-light)] px-1.5 py-0.5 text-[10px] font-semibold text-[var(--color-yellow-dark)]">
                          Admin only
                        </span>
                      ) : null}
                    </dt>
                    <dd className="col-span-2 text-body-md text-ink wrap-break-word">
                      {linkInfo ? (
                        <span className="inline-flex flex-wrap items-center gap-2">
                          <span className="font-mono text-charcoal">
                            {linkInfo.ref}
                          </span>
                          {linkInfo.title ? (
                            <Badge tone="yellow">{linkInfo.title}</Badge>
                          ) : null}
                        </span>
                      ) : (
                        renderFieldValue(value, f)
                      )}
                    </dd>
                  </div>
                );
              })}
          </dl>
        </Card>

        {/* Timeline + actions */}
        <Card>
          <h2 className="text-h4">Timeline</h2>
          <div className="mt-4">
            <WorkflowGraph
              graph={req.workflowVersion.graphJson as never}
              stepInstances={stepInstances.map((s) => ({
                stepKey: s.stepKey,
                status: s.status,
              }))}
              activeStepKey={activeStep?.stepKey ?? null}
            />
          </div>

          <div className="mt-6 border-t border-[var(--color-hairline-soft)] pt-4">
            <RequestActions
              requestId={req.id}
              formId={req.form.id}
              activeStepInstanceId={activeStep?.id ?? null}
              activeStepKey={activeStep?.stepKey ?? null}
              activeStepType={activeStepType}
              status={req.status}
              isAssignee={isAssignee}
              isRequester={isRequester}
              holdReasons={holdReasons}
              orgUsers={orgUsers}
              schema={schema as never}
              currentValues={fieldValues}
            />
          </div>

          <Link
            href={`/workflows/requests/${req.id}/timeline`}
            className="mt-5 inline-block text-body-sm-medium text-[var(--color-brand-blue)] hover:underline"
          >
            View full audit log →
          </Link>
        </Card>
      </div>

      <CommentThread requestId={req.id} />

      {canOverride ? (
        <Card tone="lavender" size="feature">
          <h2 className="text-h4">Admin overrides</h2>
          <p className="mt-1 text-body-sm text-charcoal/80">
            Use only when the standard flow is stuck. Every override is
            recorded in the audit trail.
          </p>
          <div className="mt-4">
            <AdminOverridePanel
              requestId={req.id}
              activeStepInstanceId={activeStep?.id ?? null}
              isTerminal={
                req.status === "CLOSED" || req.status === "CANCELLED"
              }
              orgUsers={orgUsers}
            />
          </div>
        </Card>
      ) : null}
    </div>
  );
}

function renderFieldValue(v: unknown, field?: { type: string }): string {
  if (v === null || v === undefined) return "—";
  if (field?.type === "DATETIME" && typeof v === "string") {
    return v.replace("T", " ");
  }
  if (typeof v === "boolean") return v ? "Yes" : "No";
  if (Array.isArray(v)) return v.length === 0 ? "—" : v.join(", ");
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
}
