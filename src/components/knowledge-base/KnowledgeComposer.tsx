"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, ArrowRight, BookOpen, FileUp, FileText,
  Heading1, Heading2, List, ListOrdered, Quote, AlignLeft,
  Plus, Trash2, ChevronUp, ChevronDown, Save, Send, ShieldCheck,
  LockKeyhole, Eye, CheckCircle2, AlertCircle, Sparkles, Loader2,
} from "lucide-react";
import { usePermissions } from "@/hooks/use-permissions";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { KNOWLEDGE_CATEGORIES, BLOCK_TYPES, type KnowledgeBlock } from "@/lib/knowledge-base/schema";

type Metadata = {
  title: string; summary: string; category: typeof KNOWLEDGE_CATEGORIES[number];
  classification: "INTERNAL" | "RESTRICTED";
  requiresAcknowledgement: boolean;
};

type ExistingArticle = Metadata & {
  id: string;
  sourceType: "EDITOR" | "PDF";
  blocks: KnowledgeBlock[] | null;
  fileName: string | null;
  latestVersion: number;
  publishedVersion: number | null;
};

const TYPES = [
  { type: "paragraph", label: "Paragraph", icon: AlignLeft },
  { type: "heading", label: "Heading", icon: Heading1 },
  { type: "subheading", label: "Subheading", icon: Heading2 },
  { type: "bullet", label: "Bullet", icon: List },
  { type: "numbered", label: "Numbered", icon: ListOrdered },
  { type: "quote", label: "Quote", icon: Quote },
] as const;

const initialMetadata: Metadata = {
  title: "", summary: "", category: "POLICIES", classification: "INTERNAL",
  requiresAcknowledgement: false,
};

function newBlock(type: KnowledgeBlock["type"] = "paragraph"): KnowledgeBlock {
  return { id: crypto.randomUUID(), type, text: "" };
}

function blocksPreview(blocks: KnowledgeBlock[]) {
  return blocks.map((block) => {
    const text = block.text || "Write something meaningful…";
    const key = block.id;
    switch (block.type) {
      case "heading":
        return <h2 key={key} className="pt-5 text-2xl font-semibold tracking-tight">{text}</h2>;
      case "subheading":
        return <h3 key={key} className="pt-3 text-lg font-semibold">{text}</h3>;
      case "quote":
        return <blockquote key={key} className="border-l-4 border-blue-500 bg-blue-500/5 px-4 py-3 italic leading-7">{text}</blockquote>;
      case "bullet":
        return <p key={key} className="flex gap-3 leading-7"><span aria-hidden="true" className="pt-0.5 text-blue-500">•</span>{text}</p>;
      case "numbered":
        return <p key={key} className="border-l-2 border-slate-300 pl-4 leading-7">{text}</p>;
      default:
        return <p key={key} className="whitespace-pre-wrap leading-7">{text}</p>;
    }
  });
}

export function KnowledgeComposer({ articleId }: { articleId?: string }) {
  const router = useRouter();
  const { hasPermission } = usePermissions();
  const canPublish = hasPermission(PERMISSIONS.KNOWLEDGE_BASE_PUBLISH);
  const canRestrict = hasPermission(PERMISSIONS.KNOWLEDGE_BASE_RESTRICTED_VIEW);
  const [metadata, setMetadata] = useState<Metadata>(initialMetadata);
  const [sourceType, setSourceType] = useState<"EDITOR" | "PDF">("EDITOR");
  const [blocks, setBlocks] = useState<KnowledgeBlock[]>([{ id: "new-first-block", type: "paragraph", text: "" }]);
  const [file, setFile] = useState<File | null>(null);
  const [existingPdf, setExistingPdf] = useState<string | null>(null);
  const [version, setVersion] = useState<number | undefined>();
  const [publishedVersion, setPublishedVersion] = useState<number | null>(null);
  const [loading, setLoading] = useState(Boolean(articleId));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState(false);

  useEffect(() => {
    if (!articleId) return;
    let active = true;
    fetch("/api/knowledge-base/" + encodeURIComponent(articleId) + "?draft=1", { cache: "no-store" })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Cannot load the working revision.");
        return data as ExistingArticle;
      })
      .then((data) => {
        if (!active) return;
        setMetadata({
          title: data.title, summary: data.summary || "", category: data.category,
          classification: data.classification, requiresAcknowledgement: data.requiresAcknowledgement,
        });
        setSourceType(data.sourceType);
        setBlocks(data.blocks ?? [{ id: "first-block", type: "paragraph", text: "" }]);
        setExistingPdf(data.fileName);
        setVersion(data.latestVersion);
        setPublishedVersion(data.publishedVersion);
      })
      .catch((reason) => { if (active) setError(reason instanceof Error ? reason.message : "Failed to load document"); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [articleId]);

  function updateMeta<K extends keyof Metadata>(key: K, value: Metadata[K]) {
    setMetadata((previous) => ({ ...previous, [key]: value }));
  }
  function patchBlock(id: string, patch: Partial<KnowledgeBlock>) {
    setBlocks((previous) => previous.map((block) => block.id === id ? { ...block, ...patch } : block));
  }
  function moveBlock(index: number, offset: number) {
    setBlocks((previous) => {
      const next = [...previous]; const target = index + offset;
      if (target < 0 || target >= next.length) return previous;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  async function submit(publish: boolean) {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      if (metadata.title.trim().length < 4) throw new Error("Enter a descriptive title (at least 4 characters).");
      if (metadata.classification === "RESTRICTED" && !canRestrict) {
        throw new Error("You need restricted-document access to classify this article as restricted.");
      }
      if (sourceType === "EDITOR" && !blocks.some((block) => block.text.trim())) {
        throw new Error("Add some content before saving.");
      }
      if (sourceType === "PDF" && !file && !existingPdf) {
        throw new Error("Choose a PDF file before saving.");
      }
      let nextId = articleId;
      let nextVersion: number;
      let response: Response;

      if (sourceType === "PDF" && file) {
        const form = new FormData();
        form.set("file", file);
        form.set("metadata", JSON.stringify({ ...metadata, expectedVersion: version }));
        if (articleId) form.set("articleId", articleId);
        response = await fetch("/api/knowledge-base/upload", { method: "POST", body: form });
      } else {
        const body = {
          ...metadata, ...(articleId ? { expectedVersion: version } : { sourceType: "EDITOR" }),
          ...(sourceType === "EDITOR" ? { blocks } : {}),
        };
        response = await fetch(articleId ? `/api/knowledge-base/${encodeURIComponent(articleId)}` : "/api/knowledge-base", {
          method: articleId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      }
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to save the document.");
      nextId = result.id as string;
      nextVersion = result.version as number;
      setVersion(nextVersion);
      if (publish) {
        if (!canPublish) throw new Error("Draft saved. Publishing requires the Knowledge Base Publish permission.");
        const published = await fetch("/api/knowledge-base/" + encodeURIComponent(nextId!), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "publish", expectedVersion: nextVersion }),
        });
        const publishResult = await published.json();
        if (!published.ok) throw new Error(publishResult.error || "Draft saved, but publication failed.");
      }
      router.push("/knowledge-base/" + encodeURIComponent(nextId!) + (publish ? "" : "?draft=1"));
      router.refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to save article.");
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <div aria-busy="true" className="mx-auto max-w-6xl space-y-6"><div className="h-12 w-72 animate-pulse rounded-xl bg-muted" /><div className="h-[500px] animate-pulse rounded-3xl bg-muted" /></div>;

  return (
    <div className="mx-auto max-w-7xl space-y-7 pb-16">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href={articleId ? "/knowledge-base/" + articleId : "/knowledge-base"} className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to Knowledge Base
        </Link>
        <span className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold text-muted-foreground">
          <ShieldCheck className="h-3.5 w-3.5" /> Private draft workspace
        </span>
      </div>

      <header className="rounded-[28px] bg-[#132842] px-7 py-9 text-white sm:px-10">
        <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-[#a8cff2]"><Sparkles className="h-4 w-4" /> Knowledge Studio</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">{articleId ? "Refine your knowledge." : "Create something useful."}</h1>
        <p className="mt-3 max-w-xl text-sm leading-7 text-[#b7cce1]">
          Publish controlled policies, guidelines and reusable answers, with reliable history and clear ownership.
        </p>
        {version && <p className="mt-5 text-xs font-semibold text-[#b6d8f5]">Working revision v{version} {publishedVersion ? " · Published v" + publishedVersion : " · Unpublished"}</p>}
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
        <div className="min-w-0 space-y-6">
          {!articleId && (
            <section className="rounded-[24px] border bg-card p-6 sm:p-8">
              <h2 className="text-lg font-semibold">1. Choose how to create</h2>
              <p className="mt-1 text-sm text-muted-foreground">Use the Knowledge Studio or upload an official PDF.</p>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <button type="button" aria-pressed={sourceType === "EDITOR"} onClick={() => setSourceType("EDITOR")}
                  className={"rounded-2xl border p-5 text-left transition " + (sourceType === "EDITOR" ? "border-blue-500 bg-blue-500/5 ring-2 ring-blue-500/10" : "hover:bg-muted/50")}>
                  <BookOpen className="h-7 w-7 text-blue-500" />
                  <span className="mt-4 block font-semibold">Write an article</span>
                  <span className="mt-1 block text-xs leading-5 text-muted-foreground">Structured blocks, headings, lists and live preview.</span>
                </button>
                <button type="button" aria-pressed={sourceType === "PDF"} onClick={() => setSourceType("PDF")}
                  className={"rounded-2xl border p-5 text-left transition " + (sourceType === "PDF" ? "border-blue-500 bg-blue-500/5 ring-2 ring-blue-500/10" : "hover:bg-muted/50")}>
                  <FileUp className="h-7 w-7 text-blue-500" />
                  <span className="mt-4 block font-semibold">Upload a PDF</span>
                  <span className="mt-1 block text-xs leading-5 text-muted-foreground">Keep the signed or approved policy in its original format.</span>
                </button>
              </div>
            </section>
          )}

          <section className="space-y-5 rounded-[24px] border bg-card p-6 sm:p-8">
            <div><h2 className="text-lg font-semibold">{articleId ? "1." : "2."} Document information</h2><p className="mt-1 text-sm text-muted-foreground">Make knowledge easy to find, interpret, and govern.</p></div>
            <div className="space-y-2">
              <label htmlFor="knowledge-title" className="text-sm font-semibold">Document title *</label>
              <input id="knowledge-title" value={metadata.title} maxLength={200} onChange={(e) => updateMeta("title", e.target.value)}
                placeholder="e.g. Information Security Policy" className="h-12 w-full rounded-xl border bg-background px-4 text-sm focus-visible:outline-2 focus-visible:outline-blue-400" />
            </div>
            <div className="space-y-2">
              <label htmlFor="knowledge-summary" className="text-sm font-semibold">Summary</label>
              <textarea id="knowledge-summary" rows={3} maxLength={1500} value={metadata.summary} onChange={(e) => updateMeta("summary", e.target.value)}
                placeholder="What will employees learn from this document?" className="w-full resize-y rounded-xl border bg-background px-4 py-3 text-sm leading-6 focus-visible:outline-2 focus-visible:outline-blue-400" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="knowledge-category" className="text-sm font-semibold">Category</label>
                <select id="knowledge-category" value={metadata.category} onChange={(e) => updateMeta("category", e.target.value as Metadata["category"])}
                  className="h-12 w-full rounded-xl border bg-background px-4 text-sm">
                  {KNOWLEDGE_CATEGORIES.map((name) => <option key={name} value={name}>{name.replace(/_/g, " ")}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label htmlFor="knowledge-classification" className="text-sm font-semibold">Access classification</label>
                <select id="knowledge-classification" value={metadata.classification}
                  onChange={(e) => updateMeta("classification", e.target.value as Metadata["classification"])}
                  className="h-12 w-full rounded-xl border bg-background px-4 text-sm">
                  <option value="INTERNAL">Internal · Knowledge viewers</option>
                  {canRestrict && <option value="RESTRICTED">Restricted · Elevated permission</option>}
                </select>
              </div>
            </div>
          </section>

          <section className="space-y-5 rounded-[24px] border bg-card p-6 sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div><h2 className="text-lg font-semibold">{articleId ? "2." : "3."} {sourceType === "PDF" ? "Original PDF" : "Article editor"}</h2><p className="mt-1 text-sm text-muted-foreground">{sourceType === "PDF" ? "Only private GCS storage is permitted." : "Write in reusable blocks. No unsafe HTML or pasted scripts."}</p></div>
              {sourceType === "EDITOR" && <button type="button" onClick={() => setPreview(!preview)} className="inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold hover:bg-muted"><Eye className="h-4 w-4" /> {preview ? "Edit blocks" : "Preview"}</button>}
            </div>
            {sourceType === "PDF" ? (
              <div className="space-y-4">
                <label htmlFor="knowledge-pdf" className="group flex min-h-56 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-blue-300/60 bg-blue-500/5 p-7 text-center hover:bg-blue-500/10">
                  <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-300"><FileUp className="h-7 w-7" /></span>
                  <span className="mt-4 font-semibold">Select an official PDF</span>
                  <span className="mt-2 text-xs text-muted-foreground">Maximum 10 MB · Private storage required</span>
                  <input id="knowledge-pdf" className="sr-only" type="file" accept=".pdf,application/pdf"
                    onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
                </label>
                {(file || existingPdf) && <div className="flex items-center gap-3 rounded-xl border p-4"><FileText className="h-6 w-6 shrink-0 text-blue-500" /><span className="min-w-0 break-all text-sm font-semibold">{file?.name ?? existingPdf}</span><CheckCircle2 className="ml-auto h-4 w-4 shrink-0 text-emerald-600" /></div>}
              </div>
            ) : preview ? (
              <div className="min-h-48 space-y-5 rounded-2xl border bg-background p-7">{blocksPreview(blocks)}</div>
            ) : (
              <div className="space-y-4">
                {blocks.map((block, index) => (
                  <div key={block.id} className="group rounded-2xl border bg-background p-4 transition focus-within:border-blue-400/60">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3">
                      <label className="text-xs font-semibold text-muted-foreground" htmlFor={"block-" + block.id}>Block {index + 1}</label>
                      <div className="flex flex-wrap items-center gap-1">
                        <select aria-label={"Block " + (index + 1) + " style"} value={block.type}
                          onChange={(e) => patchBlock(block.id, { type: e.target.value as KnowledgeBlock["type"] })}
                          className="h-8 max-w-32 rounded-lg border bg-background px-2 text-xs">
                          {TYPES.map((entry) => <option key={entry.type} value={entry.type}>{entry.label}</option>)}
                        </select>
                        <button type="button" disabled={index === 0} onClick={() => moveBlock(index, -1)} aria-label={"Move block " + (index + 1) + " up"} className="rounded-md p-1.5 hover:bg-muted disabled:opacity-30"><ChevronUp className="h-4 w-4" /></button>
                        <button type="button" disabled={index === blocks.length - 1} onClick={() => moveBlock(index, 1)} aria-label={"Move block " + (index + 1) + " down"} className="rounded-md p-1.5 hover:bg-muted disabled:opacity-30"><ChevronDown className="h-4 w-4" /></button>
                        <button type="button" disabled={blocks.length === 1} onClick={() => setBlocks((previous) => previous.filter((entry) => entry.id !== block.id))} aria-label={"Delete block " + (index + 1)} className="rounded-md p-1.5 text-red-500 hover:bg-red-500/10 disabled:opacity-30"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </div>
                    <textarea id={"block-" + block.id} value={block.text} rows={block.type === "heading" ? 2 : 4} maxLength={12000}
                      onChange={(e) => patchBlock(block.id, { text: e.target.value })}
                      placeholder={block.type === "heading" ? "Section heading" : block.type === "bullet" ? "One bullet point" : "Write your knowledge here…"}
                      className="mt-3 w-full resize-y bg-transparent px-1 py-2 text-sm leading-7 outline-none placeholder:text-muted-foreground/60" />
                  </div>
                ))}
                <button type="button" disabled={blocks.length >= 150} onClick={() => setBlocks((previous) => [...previous, newBlock()])}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed p-4 text-sm font-semibold text-blue-600 transition hover:bg-blue-500/5 disabled:opacity-30 dark:text-blue-300"><Plus className="h-4 w-4" /> Add content block</button>
                <p className="text-xs text-muted-foreground">Supports headings, paragraphs, quotes and lists, with a safe read-only preview.</p>
              </div>
            )}
          </section>
        </div>

        <aside className="space-y-5 lg:sticky lg:top-24">
          <div className="space-y-5 rounded-[24px] border bg-card p-6">
            <h2 className="text-lg font-semibold">Publication controls</h2>
            <div className="flex items-start gap-3 rounded-xl bg-blue-500/5 p-4">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-blue-600 dark:text-blue-300" />
              <p className="text-xs leading-6 text-muted-foreground">Saving creates a private working revision. Readers only see the last published revision until you publish again.</p>
            </div>
            <label className="flex cursor-pointer items-start gap-3 rounded-xl border p-4">
              <input type="checkbox" checked={metadata.requiresAcknowledgement} onChange={(e) => updateMeta("requiresAcknowledgement", e.target.checked)} className="mt-1 h-4 w-4 accent-blue-600" />
              <span><span className="block text-sm font-semibold">Require reading acknowledgement</span><span className="mt-1 block text-xs leading-5 text-muted-foreground">Employees confirm they have read each new published version.</span></span>
            </label>
            {metadata.classification === "RESTRICTED" && <p className="flex gap-2 rounded-xl bg-amber-500/10 p-3 text-xs text-amber-800 dark:text-amber-200"><LockKeyhole className="h-4 w-4 shrink-0" /> Only accounts with the restricted-view permission can access this article.</p>}
            <div className="space-y-2 border-t pt-5">
              <button type="button" disabled={busy} onClick={() => { void submit(false); }}
                className="flex w-full items-center justify-center gap-2 rounded-xl border px-5 py-3 text-sm font-semibold transition hover:bg-muted disabled:opacity-50">
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save draft
              </button>
              {canPublish && <button type="button" disabled={busy} onClick={() => { void submit(true); }} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#163b62] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#24527f] disabled:opacity-50"><Send className="h-4 w-4" /> Save & publish</button>}
            </div>
            {error && <p role="alert" className="flex items-start gap-2 rounded-xl bg-red-500/10 p-3 text-xs leading-5 text-red-700 dark:text-red-300"><AlertCircle className="h-4 w-4 shrink-0" /> {error}</p>}
          </div>
          <div className="rounded-[24px] border p-6">
            <p className="text-xs font-bold uppercase tracking-[.13em] text-muted-foreground">Knowledge lifecycle</p>
            <ol className="mt-4 space-y-4 text-sm">
              <li className="flex items-center gap-3"><span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-500/10 text-xs font-bold text-blue-600">1</span>Draft & review</li>
              <li className="flex items-center gap-3"><span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-500/10 text-xs font-bold text-blue-600">2</span>Publish approved revision</li>
              <li className="flex items-center gap-3"><span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-500/10 text-xs font-bold text-blue-600">3</span>Read & acknowledge</li>
            </ol>
            <Link href="/knowledge-base" className="mt-6 inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-300">Explore Knowledge Base <ArrowRight className="h-3.5 w-3.5" /></Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
