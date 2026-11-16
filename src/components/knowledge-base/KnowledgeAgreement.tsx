"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  ClipboardCheck,
  Download,
  History,
  Loader2,
  Search,
  Users,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/lib/utils/date-format";
import { cn } from "@/lib/utils";
import type {
  AgreementReport,
  AgreementRow,
} from "@/lib/knowledge-base/agreement-report";

/* -------------------------------------------------------------------------- */
/*                          Reader: "I agree" card                             */
/* -------------------------------------------------------------------------- */

export function PolicyAgreementCard({
  version,
  agreedAt,
  previousAgreedVersion,
  busy,
  onAgree,
}: {
  version: number;
  agreedAt: string | null;
  previousAgreedVersion: number | null;
  busy: boolean;
  onAgree: () => Promise<boolean>;
}) {
  const [confirmed, setConfirmed] = useState(false);

  if (agreedAt) {
    return (
      <section
        aria-labelledby="policy-agreement-title"
        className="border-t bg-emerald-50/60 px-7 py-6 sm:px-11 dark:bg-emerald-950/20"
      >
        <div className="flex items-start gap-3">
          <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <div>
            <h2 id="policy-agreement-title" className="font-semibold">
              You agreed to this policy
            </h2>
            <p className="text-muted-foreground mt-1 text-sm">
              Version {version} · {new Date(agreedAt).toLocaleString()}
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      aria-labelledby="policy-agreement-title"
      className="bg-muted/30 border-t px-7 py-7 sm:px-11"
    >
      <div className="flex items-start gap-3">
        <ClipboardCheck className="mt-1 h-6 w-6 shrink-0 text-amber-500" />
        <div className="flex-1">
          <h2 id="policy-agreement-title" className="font-semibold">
            Your agreement is required
          </h2>
          {previousAgreedVersion ? (
            <p className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-800 dark:bg-amber-950/30 dark:text-amber-300">
              <History className="h-3.5 w-3.5" /> Updated since you agreed to
              version {previousAgreedVersion}. Please review it again.
            </p>
          ) : null}
          <p className="text-muted-foreground mt-2 text-sm">
            Read the policy above, then confirm. Your agreement is recorded
            against version {version}; a new published version asks again.
          </p>

          <label
            htmlFor="policy-agree"
            className="bg-card mt-5 flex cursor-pointer items-start gap-3 rounded-xl border p-4"
          >
            <Checkbox
              id="policy-agree"
              checked={confirmed}
              disabled={busy}
              onCheckedChange={(checked) => setConfirmed(checked === true)}
              className="mt-0.5"
            />
            <span className="text-sm leading-6">
              I have read and understood this policy (version {version}) and I
              agree to comply with it.
            </span>
          </label>

          <button
            type="button"
            disabled={!confirmed || busy}
            onClick={() => {
              void onAgree().then((ok) => {
                if (!ok) setConfirmed(false);
              });
            }}
            className="bg-barq-yellow text-barq-black mt-4 inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle2 className="h-4 w-4" />
            )}
            I agree
          </button>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*                       Owner: who agreed / who hasn't                        */
/* -------------------------------------------------------------------------- */

type Tab = "pending" | "agreed";

function initials(name: string): string {
  const parts = name.split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "?";
}

function PersonRow({ row }: { row: AgreementRow }) {
  return (
    <li className="flex items-center gap-3 py-2.5">
      <span
        aria-hidden="true"
        className="bg-muted text-muted-foreground flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold"
      >
        {initials(row.name)}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{row.name}</p>
        <p className="text-muted-foreground truncate text-xs">
          {row.department ? `${row.department} · ` : ""}
          {row.email}
        </p>
      </div>
      <span className="text-muted-foreground shrink-0 text-right text-xs">
        {row.agreedAt
          ? formatDate(row.agreedAt)
          : row.previousVersion
            ? `Agreed to v${row.previousVersion}`
            : "Not yet"}
      </span>
    </li>
  );
}

export function AgreementReportPanel({
  articleId,
  version,
}: {
  articleId: string;
  version: number;
}) {
  const [report, setReport] = useState<AgreementReport | null>(null);
  const [failed, setFailed] = useState(false);
  const [tab, setTab] = useState<Tab>("pending");
  const [query, setQuery] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/knowledge-base/${encodeURIComponent(articleId)}/agreements`, {
      cache: "no-store",
    })
      .then(async (response) => {
        if (!response.ok) throw new Error(String(response.status));
        return (await response.json()) as AgreementReport;
      })
      .then((data) => {
        if (!cancelled) setReport(data);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
    // `version` re-reads the report after a new version is published.
  }, [articleId, version]);

  const rows = useMemo(() => {
    if (!report) return [];
    const list = tab === "pending" ? report.pending : report.agreed;
    const q = query.trim().toLowerCase();
    if (!q) return list;
    return list.filter((row) =>
      [row.name, row.email, row.department ?? ""]
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [report, tab, query]);

  const percent =
    report && report.total > 0
      ? Math.round((report.agreedCount / report.total) * 100)
      : 0;

  return (
    <div className="bg-card rounded-xl border p-6 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Users className="text-muted-foreground h-5 w-5" />
          <h2 className="font-semibold">Agreements</h2>
        </div>
        {report && report.total > 0 && (
          <a
            href={`/api/knowledge-base/${encodeURIComponent(articleId)}/agreements?format=csv`}
            className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-xs font-medium"
          >
            <Download className="h-3.5 w-3.5" /> CSV
          </a>
        )}
      </div>

      {failed ? (
        <p className="text-muted-foreground mt-4 text-sm">
          Couldn&apos;t load the agreement report.
        </p>
      ) : !report ? (
        <div className="mt-5 space-y-3" aria-busy="true">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-2 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : (
        <>
          <p className="mt-5 text-3xl font-semibold tracking-tight tabular-nums">
            {percent}%
          </p>
          <p className="text-muted-foreground mt-1 text-xs">
            {report.agreedCount} of {report.total} agreed to version{" "}
            {report.version}
          </p>
          <div
            className="bg-muted mt-3 h-2 overflow-hidden rounded-full"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={percent}
            aria-label="Agreement progress"
          >
            <div
              className="h-full rounded-full bg-emerald-500 transition-[width] duration-500"
              style={{ width: `${percent}%` }}
            />
          </div>

          <div
            role="tablist"
            aria-label="Agreement status"
            className="bg-muted mt-5 grid grid-cols-2 gap-1 rounded-lg p-1 text-xs font-medium"
          >
            {(
              [
                ["pending", `Pending · ${report.pendingCount}`],
                ["agreed", `Agreed · ${report.agreedCount}`],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={tab === key}
                onClick={() => setTab(key)}
                className={cn(
                  "rounded-md px-2 py-1.5 transition-colors",
                  tab === key
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {label}
              </button>
            ))}
          </div>

          {report.total > 8 && (
            <div className="relative mt-3">
              <Search className="text-muted-foreground absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search people"
                aria-label="Search people"
                className="h-8 pl-8 text-xs"
              />
            </div>
          )}

          {rows.length === 0 ? (
            <p className="text-muted-foreground mt-4 text-center text-xs">
              {query
                ? "No one matches your search."
                : tab === "pending"
                  ? "Everyone has agreed."
                  : "No agreements yet."}
            </p>
          ) : (
            <ul className="divide-border mt-2 max-h-80 divide-y overflow-y-auto pr-1">
              {rows.map((row) => (
                <PersonRow key={row.userId} row={row} />
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
