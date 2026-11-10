"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight, BookOpen, FileText, Search, ShieldCheck,
  LockKeyhole, Plus, Clock3, CheckCheck, Layers3, SlidersHorizontal,
} from "lucide-react";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { usePermissions } from "@/hooks/use-permissions";

type Article = {
  id: string;
  title: string;
  summary: string | null;
  category: string;
  classification: string;
  sourceType: string;
  version: number;
  publishedVersion: number | null;
  hasDraft: boolean;
  updatedAt: string;
  requiresAcknowledgement: boolean;
};

function label(value: string) {
  return value.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function KnowledgeCatalog() {
  const { hasPermission } = usePermissions();
  const mayCreate = hasPermission(PERMISSIONS.KNOWLEDGE_BASE_CREATE);
  const mayManage = hasPermission(PERMISSIONS.KNOWLEDGE_BASE_UPDATE);
  const [items, setItems] = useState<Article[]>([]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("ALL");
  const [manage, setManage] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      setLoading(true);
      setError("");
      try {
        const response = await fetch("/api/knowledge-base" + (manage && mayManage ? "?mode=manage" : ""), {
          signal: controller.signal,
          cache: "no-store",
        });
        if (!response.ok) throw new Error("Unable to load the knowledge library.");
        const data = (await response.json()) as { items: Article[] };
        setItems(data.items);
      } catch (reason) {
        if (!controller.signal.aborted) {
          setError(reason instanceof Error ? reason.message : "Unable to load documents.");
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void load();
    return () => controller.abort();
  }, [manage, mayManage]);

  const categories = useMemo(() => ["ALL", ...new Set(items.map((item) => item.category))], [items]);
  const visible = items.filter((item) => {
    const match = [item.title, item.summary, item.category].join(" ").toLowerCase()
      .includes(query.toLowerCase().trim());
    return match && (category === "ALL" || item.category === category);
  });
  const policies = items.filter((item) => item.category === "POLICIES" || item.category === "CYBERSECURITY").length;

  return (
    <div className="mx-auto max-w-7xl space-y-9 pb-12">
      <section className="relative overflow-hidden rounded-[30px] bg-[#12253f] px-7 py-10 text-white shadow-[0_22px_80px_-40px_rgba(8,31,63,.65)] sm:px-12 sm:py-14">
        <div aria-hidden="true" className="pointer-events-none absolute -right-24 -top-28 h-[420px] w-[420px] rounded-full bg-[#3577b7]/25 blur-3xl" />
        <div aria-hidden="true" className="pointer-events-none absolute bottom-0 right-48 h-44 w-44 rounded-full bg-amber-300/10 blur-3xl" />
        <div className="relative flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#bdd9fb]">
              <BookOpen className="h-3.5 w-3.5" /> TechHub Knowledge
            </span>
            <h1 className="mt-5 text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">
              Knowledge worth keeping.
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-7 text-[#bdd0e6] sm:text-base">
              One trusted home for company policies, cybersecurity guidance, procedures, and practical know-how. Always know which version is published.
            </p>
          </div>
          {mayCreate && (
            <Link href="/knowledge-base/new" className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-[#12253f] shadow-sm transition hover:bg-[#dfeeff]">
              <Plus className="h-4 w-4" /> New knowledge article
            </Link>
          )}
        </div>
        <div className="relative mt-10 grid max-w-lg grid-cols-2 gap-3 border-t border-white/15 pt-6">
          <div>
            <p className="text-3xl font-semibold tabular-nums">{loading ? "—" : items.length}</p>
            <p className="mt-1 text-xs text-[#b8cbdf]">{manage ? "Library entries" : "Published documents"}</p>
          </div>
          <div>
            <p className="text-3xl font-semibold tabular-nums">{loading ? "—" : policies}</p>
            <p className="mt-1 text-xs text-[#b8cbdf]">Policies & cybersecurity</p>
          </div>
        </div>
      </section>

      <section aria-labelledby="kb-library-heading" className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#3b75b5] dark:text-[#86b7ed]">Document library</p>
            <h2 id="kb-library-heading" className="mt-2 text-2xl font-semibold tracking-tight">Explore knowledge</h2>
            <p className="text-muted-foreground mt-1 text-sm">Search published knowledge and explore by category.</p>
          </div>
          {mayManage && (
            <button type="button" aria-pressed={manage} onClick={() => setManage(!manage)}
              className="inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition hover:bg-muted">
              <SlidersHorizontal className="h-4 w-4" /> {manage ? "Published view" : "Manage drafts"}
            </button>
          )}
        </div>
        <div className="flex flex-col gap-3 md:flex-row">
          <div className="relative flex-1">
            <Search className="text-muted-foreground pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2" />
            <input type="search" value={query} onChange={(e) => setQuery(e.target.value)}
              placeholder="Search policies, articles and procedures..." aria-label="Search knowledge"
              className="bg-card h-12 w-full rounded-xl border pl-11 pr-4 text-sm outline-none focus-visible:ring-2 focus-visible:ring-blue-400/30" />
          </div>
          <select aria-label="Knowledge category" value={category} onChange={(event) => setCategory(event.target.value)}
            className="bg-card h-12 rounded-xl border px-4 text-sm outline-none focus-visible:ring-2 focus-visible:ring-blue-400/30 md:max-w-56">
            {categories.map((option) => <option value={option} key={option}>{option === "ALL" ? "All categories" : label(option)}</option>)}
          </select>
        </div>

        {error && <div role="alert" className="rounded-xl border border-red-300/40 bg-red-50 p-4 text-sm text-red-800 dark:bg-red-500/10 dark:text-red-200">{error}</div>}
        {loading ? (
          <div aria-busy="true" className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {[1, 2, 3].map((number) => <div key={number} className="bg-muted/50 h-64 animate-pulse rounded-3xl" />)}
          </div>
        ) : visible.length ? (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {visible.map((item) => (
              <article key={item.id} className="group flex min-h-64 flex-col overflow-hidden rounded-[24px] border bg-card transition duration-200 hover:-translate-y-0.5 hover:border-[#7da8d5] hover:shadow-xl hover:shadow-blue-900/5">
                <Link href={manage && mayManage ? `/knowledge-base/${item.id}?draft=1` : `/knowledge-base/${item.id}`} className="flex flex-1 flex-col p-6">
                  <div className="flex items-start justify-between">
                    <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eaf2fd] text-[#306da8] dark:bg-blue-400/10 dark:text-blue-300">
                      {item.sourceType === "PDF" ? <FileText className="h-6 w-6" /> : <BookOpen className="h-6 w-6" />}
                    </span>
                    {item.classification === "RESTRICTED" ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-1 text-[11px] font-semibold text-amber-700 dark:text-amber-300"><LockKeyhole className="h-3 w-3" /> Restricted</span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-500 dark:bg-white/10 dark:text-slate-300"><ShieldCheck className="h-3 w-3" /> Internal</span>
                    )}
                  </div>
                  <p className="mt-6 text-[11px] font-bold uppercase tracking-[0.16em] text-[#467fb9] dark:text-blue-300">{label(item.category)}</p>
                  <h3 className="mt-2 line-clamp-2 text-lg font-semibold leading-snug tracking-tight">{item.title}</h3>
                  <p className="text-muted-foreground mt-3 line-clamp-3 flex-1 text-sm leading-6">{item.summary || "Curated internal knowledge for the TechHub team."}</p>
                  <div className="mt-6 flex flex-wrap items-center justify-between gap-2 border-t pt-4">
                    <span className="text-muted-foreground inline-flex items-center gap-2 text-xs">
                      <Layers3 className="h-3.5 w-3.5" /> v{item.version}
                      {item.hasDraft && manage ? " · Draft changes" : ""}
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#3578bb] dark:text-[#9cc6f5]">
                      Read <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                    </span>
                  </div>
                </Link>
                {item.requiresAcknowledgement && (
                  <div className="flex items-center gap-2 border-t bg-muted/30 px-6 py-2.5 text-xs text-muted-foreground"><CheckCheck className="h-4 w-4" /> Reading acknowledgement enabled</div>
                )}
              </article>
            ))}
          </div>
        ) : !error ? (
          <div className="rounded-3xl border border-dashed bg-card p-12 text-center">
            <BookOpen className="text-muted-foreground mx-auto h-10 w-10" />
            <h3 className="mt-4 text-lg font-semibold">No documents found</h3>
            <p className="text-muted-foreground mt-2 text-sm">Try another category or search, or publish the first article.</p>
          </div>
        ) : null}
      </section>
      <div className="flex flex-wrap items-center gap-6 border-t pt-5 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-2"><ShieldCheck className="h-4 w-4" /> Role-based access</span>
        <span className="inline-flex items-center gap-2"><Clock3 className="h-4 w-4" /> Versioned publications</span>
        <span className="inline-flex items-center gap-2"><CheckCheck className="h-4 w-4" /> Optional policy acknowledgement</span>
      </div>
    </div>
  );
}
