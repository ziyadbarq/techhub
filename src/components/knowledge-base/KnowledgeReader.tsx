"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { formatDate } from "@/lib/utils/date-format";
import {
  ArrowLeft,
  BookOpen,
  Download,
  FileText,
  ShieldCheck,
  LockKeyhole,
  History,
  Edit3,
  CheckCircle2,
  AlertCircle,
  Send,
  Archive,
  ExternalLink,
  ClipboardCheck,
  Clock3,
  RotateCcw,
} from "lucide-react";
import { usePermissions } from "@/hooks/use-permissions";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { parseBlocks } from "@/lib/knowledge-base/schema";
import { KnowledgeBlocksView } from "./KnowledgeBlocksView";

type RevisionInfo = { version: number; createdAt: string; editedById: string };
type KnowledgeDocument = {
  id: string;
  title: string;
  summary: string | null;
  category: string;
  classification: string;
  sourceType: string;
  blocks: unknown;
  fileName: string | null;
  fileSize: number | null;
  version: number;
  latestVersion: number;
  publishedVersion: number | null;
  updatedAt: string;
  requiresAcknowledgement: boolean;
  acknowledgedAt: string | null;
  canEdit: boolean;
  revisions: RevisionInfo[];
};

export function KnowledgeReader({
  articleId,
  draft,
  historicalVersion,
}: {
  articleId: string;
  draft: boolean;
  historicalVersion?: number;
}) {
  const { hasPermission } = usePermissions();
  const mayPublish = hasPermission(PERMISSIONS.KNOWLEDGE_BASE_PUBLISH);
  const mayArchive = hasPermission(PERMISSIONS.KNOWLEDGE_BASE_ARCHIVE);
  const mayEdit = hasPermission(PERMISSIONS.KNOWLEDGE_BASE_UPDATE);
  const [document, setDocument] = useState<KnowledgeDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const reload = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const suffix = historicalVersion
        ? "?version=" + historicalVersion
        : draft
          ? "?draft=1"
          : "";
      const response = await fetch(
        `/api/knowledge-base/${encodeURIComponent(articleId)}${suffix}`,
        { cache: "no-store" },
      );
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Unable to open this document.");
      }
      setDocument(await response.json());
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Unable to open the document.",
      );
    } finally {
      setLoading(false);
    }
  }, [articleId, draft, historicalVersion]);
  useEffect(() => {
    void reload();
  }, [reload]);

  async function action(name: "publish" | "archive") {
    if (!document || busy) return;
    if (
      name === "archive" &&
      !window.confirm(
        "Archive this article? Its published version will no longer be available.",
      )
    )
      return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch(
        "/api/knowledge-base/" + encodeURIComponent(articleId),
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: name,
            expectedVersion: document.latestVersion,
          }),
        },
      );
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.error || "Unable to update publication status.");
      setSuccess(
        name === "publish"
          ? "The latest revision is now published."
          : "This article was archived.",
      );
      if (name === "publish") await reload();
      else window.location.assign("/knowledge-base");
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Unable to update article.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function acknowledge() {
    if (!document || busy) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch(
        "/api/knowledge-base/" + encodeURIComponent(articleId) + "/acknowledge",
        { method: "POST" },
      );
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "Unable to record acknowledgement.");
      setDocument((previous) =>
        previous
          ? { ...previous, acknowledgedAt: data.acknowledgedAt }
          : previous,
      );
      setSuccess(
        "Your acknowledgement has been recorded for this published version.",
      );
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Unable to acknowledge.",
      );
    } finally {
      setBusy(false);
    }
  }

  if (loading)
    return (
      <div aria-busy="true" className="mx-auto max-w-6xl space-y-5">
        <div className="bg-muted h-10 w-64 animate-pulse rounded-xl" />
        <div className="bg-muted h-96 animate-pulse rounded-3xl" />
      </div>
    );
  if (!document)
    return (
      <div
        role="alert"
        className="mx-auto max-w-2xl rounded-2xl border p-9 text-center"
      >
        <AlertCircle className="mx-auto h-8 w-8 text-amber-500" />
        <p className="mt-4 font-semibold">{error || "Article unavailable"}</p>
        <Link
          href="/knowledge-base"
          className="mt-4 inline-block text-sm underline"
        >
          Back to library
        </Link>
      </div>
    );

  const blocks =
    document.sourceType === "EDITOR" ? parseBlocks(document.blocks) : [];
  const isPending = document.publishedVersion !== document.latestVersion;

  return (
    <div className="mx-auto max-w-7xl space-y-7 pb-14">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/knowledge-base"
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-2 text-sm font-medium"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Knowledge Base
        </Link>
        <div className="flex flex-wrap gap-2">
          {!draft &&
            !historicalVersion &&
            document.canEdit &&
            document.publishedVersion &&
            isPending && (
              <Link
                href={`/knowledge-base/${articleId}?draft=1`}
                className="hover:bg-muted rounded-xl border px-3 py-2 text-xs font-semibold"
              >
                View pending draft
              </Link>
            )}
          {(draft || historicalVersion) && document.publishedVersion && (
            <Link
              href={"/knowledge-base/" + articleId}
              className="hover:bg-muted rounded-xl border px-3 py-2 text-xs font-semibold"
            >
              Published version
            </Link>
          )}
          {mayEdit && document.canEdit && (
            <Link
              href={`/knowledge-base/${articleId}/edit`}
              className="hover:bg-muted inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold"
            >
              <Edit3 className="h-4 w-4" /> Edit
            </Link>
          )}
          {mayPublish &&
            document.canEdit &&
            !historicalVersion &&
            (draft || !document.publishedVersion) && (
              <button
                type="button"
                disabled={busy}
                onClick={() => {
                  void action("publish");
                }}
                className="bg-barq-yellow text-barq-black inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold disabled:opacity-50"
              >
                <Send className="h-4 w-4" /> Publish v{document.latestVersion}
              </button>
            )}
          {mayArchive && document.canEdit && (
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                void action("archive");
              }}
              className="inline-flex items-center gap-2 rounded-xl border border-red-300/30 px-4 py-2 text-sm font-semibold text-red-600 disabled:opacity-50 dark:text-red-300"
            >
              <Archive className="h-4 w-4" /> Archive
            </button>
          )}
        </div>
      </div>

      {error && (
        <p
          role="alert"
          className="rounded-xl bg-red-50 p-4 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-300"
        >
          {error}
        </p>
      )}
      {success && (
        <p
          role="status"
          className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300"
        >
          {success}
        </p>
      )}

      <div className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_280px]">
        <article className="bg-card min-w-0 overflow-hidden rounded-xl border shadow-sm">
          <div className="bg-muted/30 border-b px-7 py-8 sm:px-11 sm:py-10">
            <div className="text-muted-foreground flex flex-wrap items-center gap-3 text-xs font-semibold tracking-[.14em] uppercase">
              <span>{document.category.replace(/_/g, " ")}</span>
              <span className="opacity-50">/</span>
              <span className="inline-flex items-center gap-1.5">
                {document.classification === "RESTRICTED" ? (
                  <LockKeyhole className="h-3.5 w-3.5" />
                ) : (
                  <ShieldCheck className="h-3.5 w-3.5" />
                )}
                {document.classification}
              </span>
              <span className="opacity-50">/</span>
              <span>Version {document.version}</span>
            </div>
            <h1 className="mt-5 text-3xl leading-tight font-semibold tracking-[-.035em] break-words sm:text-4xl">
              {document.title}
            </h1>
            {document.summary && (
              <p className="text-muted-foreground mt-5 max-w-2xl text-sm leading-7 sm:text-base">
                {document.summary}
              </p>
            )}
            <div className="border-border text-muted-foreground mt-8 flex flex-wrap gap-4 border-t pt-5 text-xs">
              <span className="inline-flex items-center gap-1.5">
                <Clock3 className="h-4 w-4" /> Updated{" "}
                {formatDate(document.updatedAt)}
              </span>
              <span className="inline-flex items-center gap-1.5">
                {historicalVersion
                  ? "Historical revision"
                  : draft || !document.publishedVersion
                    ? "Working revision"
                    : "Published knowledge"}
              </span>
            </div>
          </div>
          <div className="px-7 py-9 sm:px-11 sm:py-12">
            {document.sourceType === "PDF" ? (
              <div className="bg-muted/30 flex flex-col items-center rounded-3xl border border-dashed p-10 text-center">
                <span className="flex h-20 w-20 items-center justify-center rounded-2xl bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-300">
                  <FileText className="h-10 w-10" />
                </span>
                <h2 className="mt-6 text-xl font-semibold">
                  Official PDF document
                </h2>
                <p className="text-muted-foreground mt-3 max-w-md text-sm break-words">
                  {document.fileName}
                </p>
                <p className="text-muted-foreground mt-2 text-xs">
                  {document.fileSize
                    ? (document.fileSize / 1024 / 1024).toFixed(2) + " MB"
                    : ""}
                </p>
                <a
                  href={`/api/knowledge-base/${articleId}/download${historicalVersion ? "?version=" + historicalVersion : draft ? "?draft=1" : ""}`}
                  className="bg-barq-yellow text-barq-black hover:bg-barq-yellow/90 mt-7 inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold"
                >
                  <Download className="h-4 w-4" /> Download protected PDF
                </a>
                <p className="text-muted-foreground mt-4 text-xs">
                  File access is checked for every download. Private GCS storage
                  is required.
                </p>
              </div>
            ) : (
              <KnowledgeBlocksView blocks={blocks} />
            )}
          </div>

          {document.requiresAcknowledgement &&
            document.publishedVersion === document.version &&
            !draft &&
            !historicalVersion && (
              <section className="bg-muted/30 border-t px-7 py-7 sm:px-11">
                <div className="flex items-start gap-3">
                  <ClipboardCheck className="mt-1 h-6 w-6 shrink-0 text-amber-500" />
                  <div className="flex-1">
                    <h2 className="font-semibold">Reading acknowledgement</h2>
                    <p className="text-muted-foreground mt-2 text-sm">
                      Confirm that you have read and understood this published
                      revision. A new published version requires a new
                      acknowledgement.
                    </p>
                    {document.acknowledgedAt ? (
                      <p className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-emerald-700 dark:text-emerald-400">
                        <CheckCircle2 className="h-4 w-4" /> Acknowledged on{" "}
                        {new Date(document.acknowledgedAt).toLocaleString()}
                      </p>
                    ) : (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => {
                          void acknowledge();
                        }}
                        className="bg-barq-yellow text-barq-black mt-5 inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold disabled:opacity-50"
                      >
                        <CheckCircle2 className="h-4 w-4" /> I have read this
                        document
                      </button>
                    )}
                  </div>
                </div>
              </section>
            )}
        </article>

        <aside className="space-y-5">
          <div className="bg-card rounded-xl border p-6 shadow-sm">
            <div className="flex items-center gap-2">
              <BookOpen className="text-muted-foreground h-5 w-5" />
              <h2 className="font-semibold">Document details</h2>
            </div>
            <dl className="mt-5 space-y-4 text-sm">
              <div>
                <dt className="text-muted-foreground text-xs">Format</dt>
                <dd className="mt-1 font-medium">
                  {document.sourceType === "PDF"
                    ? "Protected PDF"
                    : "Knowledge article"}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground text-xs">
                  Classification
                </dt>
                <dd className="mt-1 font-medium">{document.classification}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground text-xs">
                  Published revision
                </dt>
                <dd className="mt-1 font-medium">
                  {document.publishedVersion
                    ? "v" + document.publishedVersion
                    : "Not published"}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground text-xs">
                  Acknowledgement
                </dt>
                <dd className="mt-1 font-medium">
                  {document.requiresAcknowledgement
                    ? "Required"
                    : "Not required"}
                </dd>
              </div>
            </dl>
          </div>
          {document.revisions.length > 0 && (
            <div className="bg-card rounded-xl border p-6 shadow-sm">
              <div className="flex items-center gap-2">
                <History className="text-muted-foreground h-5 w-5" />
                <h2 className="font-semibold">Revision history</h2>
              </div>
              <ol className="mt-5 space-y-4">
                {document.revisions.map((revision) => (
                  <li
                    key={revision.version}
                    className="flex items-center justify-between gap-3 text-sm"
                  >
                    <Link
                      href={`/knowledge-base/${articleId}?version=${revision.version}`}
                      className="font-medium hover:underline"
                    >
                      Version {revision.version}
                    </Link>
                    <span className="text-muted-foreground text-xs">
                      {formatDate(revision.createdAt)}
                    </span>
                  </li>
                ))}
              </ol>
              <p className="text-muted-foreground mt-4 text-xs">
                Revision snapshots are retained for auditability.
              </p>
            </div>
          )}
          <Link
            href="/knowledge-base"
            className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm font-medium"
          >
            <RotateCcw className="h-4 w-4" /> Browse library{" "}
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        </aside>
      </div>
    </div>
  );
}
