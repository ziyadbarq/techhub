import Link from "next/link";
import { redirect } from "next/navigation";

import { Badge, Card, PillTab, PillTabs } from "@/components/design";
import { prisma } from "@/infrastructure/database/prisma/client";
import { getCurrentUserId } from "@/lib/auth/session";
import { FEATURE_FLAGS } from "@/lib/features/feature-flag-keys";
import { requireFeature } from "@/lib/features/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { requirePermission } from "@/lib/permissions/server";

import { SavedFiltersBar } from "./saved-filters-bar";

export const dynamic = "force-dynamic";

const STATUSES = [
  "DRAFT",
  "SUBMITTED",
  "IN_REVIEW",
  "ON_HOLD",
  "IN_PROGRESS",
  "CLOSED",
  "CANCELLED",
] as const;

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

export default async function RequestsListPage({
  searchParams,
}: {
  searchParams: Promise<{ scope?: string; status?: string; formId?: string }>;
}) {
  await requireFeature(FEATURE_FLAGS.WORKFLOW_ENGINE);
  await requirePermission(PERMISSIONS.WORKFLOWS_REQUESTS_VIEW_OWN);

  const userId = await getCurrentUserId();
  if (!userId) redirect("/login");

  const sp = await searchParams;
  const scope = sp.scope === "mine" ? "mine" : "all";
  const statusFilter = STATUSES.includes(sp.status as never)
    ? (sp.status as string)
    : null;
  const formIdFilter = sp.formId ?? null;

  const [requests, savedFilters, formsForFilter] = await Promise.all([
    prisma.request.findMany({
      where: {
        ...(scope === "mine" ? { requesterId: userId } : {}),
        ...(statusFilter ? { status: statusFilter as never } : {}),
        ...(formIdFilter ? { formId: formIdFilter } : {}),
      },
      include: {
        form: { select: { name: true } },
        requester: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    prisma.savedFilter.findMany({
      where: { userId },
      orderBy: { name: "asc" },
    }),
    prisma.form.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const currentFilter = {
    scope,
    ...(statusFilter ? { status: statusFilter } : {}),
    ...(formIdFilter ? { formId: formIdFilter } : {}),
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="text-micro-uppercase text-stone">Requests</span>
          <h1 className="mt-1 text-h2">
            {scope === "mine" ? "My requests" : "All requests"}
          </h1>
          <p className="mt-1 text-subtitle text-slate">
            {scope === "mine"
              ? "Requests you submitted."
              : "Everything submitted across your organization."}
          </p>
        </div>
        <PillTabs>
          <PillTab href="/workflows/requests" active={scope === "all"}>
            All
          </PillTab>
          <PillTab
            href="/workflows/requests?scope=mine"
            active={scope === "mine"}
          >
            Mine
          </PillTab>
        </PillTabs>
      </div>

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-micro-uppercase text-stone">Status</span>
            <Link
              href={`?scope=${scope}${formIdFilter ? `&formId=${formIdFilter}` : ""}`}
              className={
                "rounded-full px-3 py-1 text-caption-bold border " +
                (statusFilter === null
                  ? "border-[var(--color-ink)] bg-[var(--color-ink)] text-white"
                  : "border-[var(--color-hairline)] bg-[var(--color-canvas)] text-[var(--color-charcoal)]")
              }
            >
              All
            </Link>
            {STATUSES.map((s) => (
              <Link
                key={s}
                href={`?scope=${scope}&status=${s}${formIdFilter ? `&formId=${formIdFilter}` : ""}`}
                className={
                  "rounded-full px-3 py-1 text-caption-bold border " +
                  (statusFilter === s
                    ? "border-[var(--color-ink)] bg-[var(--color-ink)] text-white"
                    : "border-[var(--color-hairline)] bg-[var(--color-canvas)] text-[var(--color-charcoal)]")
                }
              >
                {s}
              </Link>
            ))}
          </div>
          <SavedFiltersBar
            filters={savedFilters.map((f) => ({
              id: f.id,
              name: f.name,
              filter: f.filterJson as Record<string, unknown>,
            }))}
            currentFilter={currentFilter}
            forms={formsForFilter}
          />
        </div>
      </Card>

      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left">
            <thead className="border-b border-[var(--color-hairline-soft)] bg-[var(--color-surface-soft)]">
              <tr className="text-micro-uppercase text-stone">
                <th className="px-5 py-3">Reference</th>
                <th className="px-5 py-3">Form</th>
                <th className="px-5 py-3">Requester</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Submitted</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {requests.map((r) => (
                <tr
                  key={r.id}
                  className="border-b border-[var(--color-hairline-soft)] last:border-0"
                >
                  <td className="px-5 py-3 font-mono text-caption text-charcoal">
                    {r.referenceNumber}
                  </td>
                  <td className="px-5 py-3 text-body-sm-medium text-ink">
                    {r.form.name}
                  </td>
                  <td className="px-5 py-3 text-body-sm text-slate">
                    {r.requester.name || r.requester.email}
                  </td>
                  <td className="px-5 py-3">
                    {statusBadge(r.status, r.outcome)}
                  </td>
                  <td className="px-5 py-3 text-body-sm text-stone">
                    {r.submittedAt
                      ? new Date(r.submittedAt).toLocaleString()
                      : "—"}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <Link
                      href={`/workflows/requests/${r.id}`}
                      className="text-body-sm-medium text-[var(--color-brand-blue)] hover:underline"
                    >
                      Open →
                    </Link>
                  </td>
                </tr>
              ))}
              {requests.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-12 text-center text-body-md text-stone"
                  >
                    No requests match this filter.
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
