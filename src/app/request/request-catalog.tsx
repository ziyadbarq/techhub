"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, FileText, Search, ShieldCheck, Sparkles, X } from "lucide-react";
import { CopyRequestLink } from "@/components/workflows/copy-request-link";

type PortalForm = { id: string; name: string; description: string | null };

export function RequestCatalog({ forms }: { forms: PortalForm[] }) {
  const [query, setQuery] = useState("");
  const normalized = query.trim().toLocaleLowerCase();
  const visible = forms.filter((form) =>
    (form.name + " " + (form.description ?? "")).toLocaleLowerCase().includes(normalized),
  );

  return (
    <div className="mx-auto max-w-7xl px-5 pb-10 pt-8 sm:px-8 sm:pt-12 lg:px-12">
      <section className="relative overflow-hidden rounded-[32px] bg-[#13243d] px-6 py-10 text-white shadow-[0_28px_80px_-38px_rgba(13,32,61,0.6)] sm:px-12 sm:py-16 lg:px-16">
        <div aria-hidden="true" className="absolute -right-24 -top-48 h-[500px] w-[500px] rounded-full bg-[#4a8bc6]/25 blur-3xl" />
        <div aria-hidden="true" className="absolute -bottom-40 right-24 h-64 w-64 rounded-full bg-[#f3bd66]/15 blur-3xl" />
        <div className="relative max-w-2xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#bad7f4]">
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" /> TechHub · Self-service
          </span>
          <h1 className="mt-6 text-4xl font-semibold leading-[1.1] tracking-[-0.04em] sm:text-5xl lg:text-6xl">
            What can we help you with today?
          </h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-[#b8c9dd] sm:text-lg">
            Find the right form, tell us what you need, and let your request move through the existing approval workflow. No dashboard navigation required.
          </p>
          <div className="mt-9 flex flex-wrap gap-3 text-xs font-medium text-white/85">
            <span className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-3 py-2"><CheckCircle2 className="h-4 w-4 text-[#8be1b0]" aria-hidden="true" /> Published forms only</span>
            <span className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-3 py-2"><ShieldCheck className="h-4 w-4 text-[#8be1b0]" aria-hidden="true" /> Protected by TechHub access</span>
          </div>
        </div>
        <div aria-hidden="true" className="absolute bottom-0 right-10 hidden h-44 w-44 translate-y-1/3 rotate-12 rounded-[42px] border border-white/10 bg-white/[0.04] lg:block" />
      </section>

      <section className="mt-10 sm:mt-12" aria-labelledby="available-forms">
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.17em] text-[#4677b3] dark:text-[#94bdf6]">Service catalog</p>
            <h2 id="available-forms" className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">Start a new request</h2>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{forms.length} available {forms.length === 1 ? "form" : "forms"} · Choose a form to continue</p>
          </div>
          <div className="relative w-full md:max-w-sm">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
            <input aria-label="Search request forms" type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search request forms..."
              className="h-12 w-full rounded-2xl border border-slate-200 bg-white pl-11 pr-11 text-sm text-slate-900 shadow-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-400/15 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-slate-500" />
            {query ? <button type="button" onClick={() => setQuery("")} aria-label="Clear search" className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-white"><X className="h-4 w-4" /></button> : null}
          </div>
        </div>
        {visible.length > 0 ? (
          <div className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((form, index) => (
              <article key={form.id} className="group flex min-h-64 flex-col overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-[0_8px_30px_-22px_rgba(11,34,60,0.35)] transition duration-200 hover:-translate-y-1 hover:border-blue-200 hover:shadow-[0_24px_45px_-26px_rgba(11,34,60,0.4)] dark:border-white/10 dark:bg-[#111a2b] dark:hover:border-blue-400/30">
                <Link href={"/request/" + form.id} className="flex flex-1 flex-col px-6 pb-5 pt-6 focus-visible:outline-2 focus-visible:outline-blue-500">
                  <div className="flex items-start justify-between">
                    <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eaf2fb] text-[#336aa7] dark:bg-[#253a55] dark:text-[#a8cdf7]"><FileText className="h-6 w-6" aria-hidden="true" /></span>
                    <span className="font-mono text-xs text-slate-300 dark:text-slate-600">{String(index + 1).padStart(2, "0")}</span>
                  </div>
                  <h3 className="mt-6 line-clamp-2 text-lg font-semibold tracking-tight">{form.name}</h3>
                  <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-500 dark:text-slate-400">{form.description || "Submit this request using the approved TechHub workflow."}</p>
                  <span className="mt-auto inline-flex items-center gap-2 pt-7 text-sm font-semibold text-[#326eaf] dark:text-[#9bc9ff]">Start request <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" /></span>
                </Link>
                <div className="flex items-center justify-between border-t border-slate-100 px-3 py-1.5 dark:border-white/10">
                  <span className="pl-3 text-[11px] text-slate-400">Shareable internal link</span>
                  <CopyRequestLink path={"/request/" + form.id} />
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="mt-7 rounded-3xl border border-dashed border-slate-300 bg-white/70 p-12 text-center dark:border-white/15 dark:bg-white/5">
            <FileText className="mx-auto h-9 w-9 text-slate-400" aria-hidden="true" />
            <h3 className="mt-4 text-lg font-semibold">{forms.length === 0 ? "No published forms available" : "No matching requests"}</h3>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{forms.length === 0 ? "Published request forms will appear here when they're ready." : "Try a different search term."}</p>
          </div>
        )}
      </section>
    </div>
  );
}
