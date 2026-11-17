"use client";

import { useEffect, useRef, useState, type DragEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  AlertCircle,
  ArrowLeft,
  BookOpen,
  Eye,
  FileText,
  FileUp,
  LayoutTemplate,
  Loader2,
  LockKeyhole,
  PenLine,
  RefreshCw,
  Save,
  Send,
  ShieldCheck,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { usePermissions } from "@/hooks/use-permissions";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import {
  KNOWLEDGE_CATEGORIES,
  type KnowledgeBlock,
} from "@/lib/knowledge-base/schema";
import { hasContent } from "@/lib/knowledge-base/editor";
import { cn } from "@/lib/utils";
import { KnowledgeBlockEditor, newBlockId } from "./KnowledgeBlockEditor";
import { KnowledgeBlocksView } from "./KnowledgeBlocksView";

type SourceType = "EDITOR" | "PDF";
type Metadata = {
  title: string;
  summary: string;
  category: (typeof KNOWLEDGE_CATEGORIES)[number];
  classification: "INTERNAL" | "RESTRICTED";
  requiresAcknowledgement: boolean;
  folderId: string | null;
};

type ExistingArticle = Metadata & {
  id: string;
  sourceType: SourceType;
  blocks: KnowledgeBlock[] | null;
  fileName: string | null;
  latestVersion: number;
  publishedVersion: number | null;
};

const MAX_PDF_BYTES = 10 * 1024 * 1024;
const ROOT = "__root__";

const STARTERS: Array<{
  id: string;
  name: string;
  description: string;
  category: Metadata["category"];
  sections: Array<{ type: KnowledgeBlock["type"]; text: string }>;
}> = [
  {
    id: "policy",
    name: "Policy",
    description: "Purpose, scope, roles, requirements",
    category: "POLICIES",
    sections: [
      { type: "heading", text: "1. Purpose" },
      {
        type: "paragraph",
        text: "[Describe what this policy protects and why.]",
      },
      { type: "heading", text: "2. Scope" },
      {
        type: "paragraph",
        text: "[Define affected employees, systems and information.]",
      },
      { type: "heading", text: "3. Roles & Responsibilities" },
      { type: "bullet", text: "[Policy owner and responsible team]" },
      { type: "bullet", text: "[Employee obligations]" },
      { type: "heading", text: "4. Policy Requirements" },
      {
        type: "paragraph",
        text: "[Document the approved technical and organizational requirements.]",
      },
      { type: "heading", text: "5. Exceptions & Escalation" },
      {
        type: "paragraph",
        text: "[Define exception approvals and escalation paths.]",
      },
      { type: "heading", text: "6. Review Cycle" },
      {
        type: "paragraph",
        text: "[Specify the policy owner, effective date and planned review cadence.]",
      },
    ],
  },
  {
    id: "procedure",
    name: "Procedure",
    description: "Objective, prerequisites, numbered steps",
    category: "PROCEDURES",
    sections: [
      { type: "heading", text: "Objective" },
      { type: "paragraph", text: "[Explain the operational outcome.]" },
      { type: "heading", text: "When to use" },
      { type: "paragraph", text: "[Define entry criteria and prerequisites.]" },
      { type: "heading", text: "Procedure" },
      { type: "numbered", text: "[Step 1]" },
      { type: "numbered", text: "[Step 2]" },
      { type: "heading", text: "Validation & Evidence" },
      {
        type: "paragraph",
        text: "[Define success checks and retained records.]",
      },
    ],
  },
  {
    id: "guide",
    name: "How-to guide",
    description: "Overview, steps and troubleshooting",
    category: "GUIDES",
    sections: [
      { type: "heading", text: "Overview" },
      { type: "paragraph", text: "[What will the reader learn?]" },
      { type: "heading", text: "Before you begin" },
      { type: "bullet", text: "[Required access or tools]" },
      { type: "heading", text: "Instructions" },
      { type: "numbered", text: "[First action]" },
      { type: "numbered", text: "[Next action]" },
      { type: "heading", text: "Troubleshooting" },
      { type: "paragraph", text: "[Common problems and where to get help.]" },
    ],
  },
];

const initialMetadata: Metadata = {
  title: "",
  summary: "",
  category: "POLICIES",
  classification: "INTERNAL",
  requiresAcknowledgement: false,
  folderId: null,
};

type FolderOption = { id: string; parentId: string | null; name: string };

function folderLabel(folder: FolderOption, all: FolderOption[]): string {
  const names = [folder.name];
  const visited = new Set([folder.id]);
  let next = folder.parentId;
  while (next && !visited.has(next)) {
    visited.add(next);
    const parent = all.find((entry) => entry.id === next);
    if (!parent) break;
    names.unshift(parent.name);
    next = parent.parentId;
  }
  return names.join(" / ");
}

function humanize(value: string): string {
  return value.charAt(0) + value.slice(1).toLowerCase().replace(/_/g, " ");
}

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return Math.max(1, Math.round(bytes / 1024)) + " KB";
  return (bytes / 1024 / 1024).toFixed(1) + " MB";
}

function validatePdf(file: File): string | null {
  const isPdf =
    file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
  if (!isPdf) return "Only PDF files can be uploaded.";
  if (file.size > MAX_PDF_BYTES) return "The PDF is larger than 10 MB.";
  if (file.size < 8) return "The selected file is empty.";
  return null;
}

export function KnowledgeComposer({
  articleId,
  initialFolderId = null,
  initialSourceType = "EDITOR",
}: {
  articleId?: string;
  initialFolderId?: string | null;
  initialSourceType?: SourceType;
}) {
  const router = useRouter();
  const { hasPermission } = usePermissions();
  const canPublish = hasPermission(PERMISSIONS.KNOWLEDGE_BASE_PUBLISH);
  const canRestrict = hasPermission(PERMISSIONS.KNOWLEDGE_BASE_RESTRICTED_VIEW);
  const [metadata, setMetadata] = useState<Metadata>(() => ({
    ...initialMetadata,
    folderId: initialFolderId,
  }));
  const [folders, setFolders] = useState<FolderOption[]>([]);
  const [sourceType, setSourceType] = useState<SourceType>(
    articleId ? "EDITOR" : initialSourceType,
  );
  const [blocks, setBlocks] = useState<KnowledgeBlock[]>(() => [
    { id: newBlockId(), type: "paragraph", text: "" },
  ]);
  const [file, setFile] = useState<File | null>(null);
  const [existingPdf, setExistingPdf] = useState<string | null>(null);
  const [version, setVersion] = useState<number | undefined>();
  const [publishedVersion, setPublishedVersion] = useState<number | null>(null);
  const [loading, setLoading] = useState(Boolean(articleId));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [pendingStarter, setPendingStarter] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const submitRef = useRef<(publish: boolean) => Promise<void>>(async () => {});

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/knowledge-base/folders", {
      signal: controller.signal,
      cache: "no-store",
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("Unable to load folders");
        return response.json() as Promise<{ folders: FolderOption[] }>;
      })
      .then((result) => setFolders(result.folders))
      .catch(() => {});
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!articleId) return;
    let active = true;
    fetch("/api/knowledge-base/" + encodeURIComponent(articleId) + "?draft=1", {
      cache: "no-store",
    })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok)
          throw new Error(data.error || "Cannot load the working revision.");
        return data as ExistingArticle;
      })
      .then((data) => {
        if (!active) return;
        setMetadata({
          title: data.title,
          summary: data.summary || "",
          category: data.category,
          classification: data.classification,
          requiresAcknowledgement: data.requiresAcknowledgement,
          folderId: data.folderId ?? null,
        });
        setSourceType(data.sourceType);
        setBlocks(
          data.blocks?.length
            ? data.blocks
            : [{ id: newBlockId(), type: "paragraph", text: "" }],
        );
        setExistingPdf(data.fileName);
        setVersion(data.latestVersion);
        setPublishedVersion(data.publishedVersion);
      })
      .catch((reason) => {
        if (active)
          setError(
            reason instanceof Error
              ? reason.message
              : "Failed to load document",
          );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [articleId]);

  // Warn before leaving with unsaved changes; Ctrl/Cmd+S saves a draft.
  useEffect(() => {
    function beforeUnload(event: BeforeUnloadEvent) {
      if (!dirty) return;
      event.preventDefault();
      event.returnValue = "";
    }
    function onKey(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        void submitRef.current(false);
      }
    }
    window.addEventListener("beforeunload", beforeUnload);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("beforeunload", beforeUnload);
      window.removeEventListener("keydown", onKey);
    };
  }, [dirty]);

  function updateMeta<K extends keyof Metadata>(key: K, value: Metadata[K]) {
    setMetadata((previous) => ({ ...previous, [key]: value }));
    setDirty(true);
  }

  function updateBlocks(next: KnowledgeBlock[]) {
    setBlocks(next);
    setDirty(true);
  }

  function applyStarter(id: string) {
    const starter = STARTERS.find((entry) => entry.id === id);
    if (!starter) return;
    setBlocks(
      starter.sections.map((section) => ({ ...section, id: newBlockId() })),
    );
    setMetadata((previous) => ({ ...previous, category: starter.category }));
    setDirty(true);
    setPreview(false);
    setPendingStarter(null);
  }

  function requestStarter(id: string) {
    if (hasContent(blocks)) setPendingStarter(id);
    else applyStarter(id);
  }

  function pickFile(candidate: File | null | undefined) {
    if (!candidate) return;
    const problem = validatePdf(candidate);
    if (problem) {
      toast.error(problem);
      return;
    }
    setFile(candidate);
    setDirty(true);
    if (!metadata.title.trim()) {
      const suggested = candidate.name
        .replace(/\.pdf$/i, "")
        .replace(/[_-]+/g, " ")
        .trim()
        .slice(0, 200);
      if (suggested.length >= 4)
        setMetadata((previous) => ({ ...previous, title: suggested }));
    }
  }

  function onDrop(event: DragEvent<HTMLElement>) {
    event.preventDefault();
    setDragging(false);
    pickFile(event.dataTransfer.files?.[0]);
  }

  async function submit(publish: boolean) {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      if (metadata.title.trim().length < 4)
        throw new Error("Enter a descriptive title (at least 4 characters).");
      if (metadata.classification === "RESTRICTED" && !canRestrict) {
        throw new Error(
          "You need restricted-document access to classify this article as restricted.",
        );
      }
      if (sourceType === "EDITOR" && !hasContent(blocks)) {
        throw new Error("Add some content before saving.");
      }
      if (sourceType === "PDF" && !file && !existingPdf) {
        throw new Error("Choose a PDF file before saving.");
      }
      let nextId = articleId;
      let response: Response;

      if (sourceType === "PDF" && file) {
        const form = new FormData();
        form.set("file", file);
        form.set(
          "metadata",
          JSON.stringify({ ...metadata, expectedVersion: version }),
        );
        if (articleId) form.set("articleId", articleId);
        response = await fetch("/api/knowledge-base/upload", {
          method: "POST",
          body: form,
        });
      } else {
        // Empty blocks are noise; keep at least one so the schema stays valid.
        const cleaned = blocks.filter((block) => block.text.trim());
        const body = {
          ...metadata,
          ...(articleId
            ? { expectedVersion: version }
            : { sourceType: "EDITOR" }),
          ...(sourceType === "EDITOR"
            ? { blocks: cleaned.length ? cleaned : blocks.slice(0, 1) }
            : {}),
        };
        response = await fetch(
          articleId
            ? `/api/knowledge-base/${encodeURIComponent(articleId)}`
            : "/api/knowledge-base",
          {
            method: articleId ? "PATCH" : "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          },
        );
      }
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.error || "Unable to save the document.");
      nextId = result.id as string;
      const nextVersion = result.version as number;
      setVersion(nextVersion);
      setDirty(false);
      if (publish) {
        if (!canPublish)
          throw new Error(
            "Draft saved. Publishing requires the Knowledge Base Publish permission.",
          );
        const published = await fetch(
          "/api/knowledge-base/" + encodeURIComponent(nextId!),
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "publish",
              expectedVersion: nextVersion,
            }),
          },
        );
        const publishResult = await published.json();
        if (!published.ok)
          throw new Error(
            publishResult.error || "Draft saved, but publication failed.",
          );
      }
      toast.success(publish ? "Published" : "Draft saved");
      router.push(
        "/knowledge-base/" +
          encodeURIComponent(nextId!) +
          (publish ? "" : "?draft=1"),
      );
      router.refresh();
    } catch (reason) {
      const message =
        reason instanceof Error ? reason.message : "Unable to save article.";
      setError(message);
      toast.error(message);
    } finally {
      setBusy(false);
    }
  }
  submitRef.current = submit;

  if (loading) {
    return (
      <div aria-busy="true" className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
          <Skeleton className="h-[520px] rounded-xl" />
          <Skeleton className="h-80 rounded-xl" />
        </div>
      </div>
    );
  }

  const backHref = articleId
    ? "/knowledge-base/" + articleId + "?draft=1"
    : "/knowledge-base";
  const status = !articleId
    ? "New document"
    : publishedVersion == null
      ? "Draft v" + version
      : publishedVersion === version
        ? "Published v" + publishedVersion
        : "Draft v" + version + " · Published v" + publishedVersion;

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="space-y-3">
        <Link
          href={backHref}
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm"
        >
          <ArrowLeft className="size-4" />{" "}
          {articleId ? "Back to document" : "Knowledge Base"}
        </Link>
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-2xl font-bold">
              {articleId ? "Edit document" : "New document"}
            </h2>
            <p className="text-muted-foreground">
              Saving creates a private draft. Readers keep seeing the last
              published version until you publish.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="font-normal">
              {status}
            </Badge>
            {dirty && (
              <Badge className="border-transparent bg-amber-100 font-normal text-amber-800 shadow-none hover:bg-amber-100 dark:bg-amber-900/40 dark:text-amber-200">
                Unsaved changes
              </Badge>
            )}
          </div>
        </div>
      </div>

      {!articleId && (
        <div
          role="radiogroup"
          aria-label="Document type"
          className="bg-muted inline-flex rounded-lg border p-1"
        >
          {(
            [
              { value: "EDITOR", label: "Write an article", icon: PenLine },
              { value: "PDF", label: "Upload a PDF", icon: FileUp },
            ] as const
          ).map((option) => {
            const Icon = option.icon;
            const selected = sourceType === option.value;
            return (
              <button
                key={option.value}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => setSourceType(option.value)}
                className={cn(
                  "inline-flex items-center gap-2 rounded-md px-3.5 py-1.5 text-sm font-medium transition-colors",
                  selected
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className="size-4" /> {option.label}
              </button>
            );
          })}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start">
        <div className="min-w-0 space-y-4">
          {/* Title & summary */}
          <div className="bg-card rounded-xl border p-5 shadow-sm sm:px-8">
            <label htmlFor="knowledge-title" className="sr-only">
              Title
            </label>
            <input
              id="knowledge-title"
              value={metadata.title}
              maxLength={200}
              autoFocus={!articleId}
              onChange={(event) => updateMeta("title", event.target.value)}
              placeholder="Document title"
              className="placeholder:text-muted-foreground/50 w-full bg-transparent text-2xl font-semibold tracking-tight outline-none"
            />
            <label htmlFor="knowledge-summary" className="sr-only">
              Summary
            </label>
            <textarea
              id="knowledge-summary"
              rows={2}
              maxLength={1500}
              value={metadata.summary}
              onChange={(event) => updateMeta("summary", event.target.value)}
              placeholder="Short summary — what will readers learn, and who is it for? (optional)"
              className="text-muted-foreground placeholder:text-muted-foreground/50 mt-2 w-full resize-none bg-transparent text-sm leading-6 outline-none"
            />
          </div>

          {sourceType === "PDF" ? (
            <div className="bg-card space-y-3 rounded-xl border p-5 shadow-sm">
              <div>
                <h3 className="font-semibold">PDF document</h3>
                <p className="text-muted-foreground text-sm">
                  Upload the approved original. Files are stored privately and
                  every download is permission-checked.
                </p>
              </div>
              {file || existingPdf ? (
                <div className="bg-muted/30 flex items-center gap-3 rounded-lg border p-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-lg border bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-300">
                    <FileText className="size-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">
                      {file?.name ?? existingPdf}
                    </span>
                    <span className="text-muted-foreground block text-xs">
                      {file
                        ? formatBytes(file.size) + " · ready to upload"
                        : "Current file"}
                    </span>
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInput.current?.click()}
                  >
                    <RefreshCw /> Replace
                  </Button>
                  {file && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Remove selected file"
                      onClick={() => setFile(null)}
                    >
                      <X />
                    </Button>
                  )}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInput.current?.click()}
                  onDragOver={(event) => {
                    event.preventDefault();
                    setDragging(true);
                  }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={onDrop}
                  className={cn(
                    "flex min-h-52 w-full flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 text-center transition-colors",
                    dragging
                      ? "border-barq-yellow bg-barq-yellow/10"
                      : "hover:border-foreground/30 hover:bg-muted/40",
                  )}
                >
                  <span className="bg-muted flex size-12 items-center justify-center rounded-full">
                    <FileUp className="text-muted-foreground size-6" />
                  </span>
                  <span className="mt-3 text-sm font-medium">
                    Drop a PDF here, or click to browse
                  </span>
                  <span className="text-muted-foreground mt-1 text-xs">
                    PDF only · up to 10 MB
                  </span>
                </button>
              )}
              <input
                ref={fileInput}
                id="knowledge-pdf"
                className="sr-only"
                type="file"
                accept=".pdf,application/pdf"
                onChange={(event) => {
                  pickFile(event.target.files?.[0]);
                  event.target.value = "";
                }}
              />
            </div>
          ) : preview ? (
            <div className="bg-card rounded-xl border shadow-sm">
              <div className="flex items-center justify-between border-b px-4 py-2">
                <span className="text-sm font-medium">Preview</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setPreview(false)}
                >
                  <PenLine /> Back to editing
                </Button>
              </div>
              <div className="px-5 py-6 sm:px-12">
                <h1 className="text-3xl font-semibold tracking-tight">
                  {metadata.title || "Untitled document"}
                </h1>
                {metadata.summary && (
                  <p className="text-muted-foreground mt-2">
                    {metadata.summary}
                  </p>
                )}
                <KnowledgeBlocksView blocks={blocks} className="mt-6" />
              </div>
            </div>
          ) : (
            <>
              {!hasContent(blocks) && (
                <div className="bg-card flex flex-wrap items-center gap-2 rounded-xl border border-dashed px-4 py-3">
                  <LayoutTemplate className="text-muted-foreground size-4" />
                  <span className="text-muted-foreground text-sm">
                    Start from a template:
                  </span>
                  {STARTERS.map((starter) => (
                    <Button
                      key={starter.id}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => applyStarter(starter.id)}
                    >
                      {starter.name}
                    </Button>
                  ))}
                </div>
              )}
              <KnowledgeBlockEditor
                blocks={blocks}
                onChange={updateBlocks}
                disabled={busy}
                toolbarEnd={
                  <>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button type="button" variant="ghost" size="sm">
                          <LayoutTemplate />{" "}
                          <span className="hidden sm:inline">Templates</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-64">
                        <DropdownMenuLabel className="text-muted-foreground text-xs">
                          Replace content with a template
                        </DropdownMenuLabel>
                        {STARTERS.map((starter) => (
                          <DropdownMenuItem
                            key={starter.id}
                            onSelect={() => requestStarter(starter.id)}
                            className="flex-col items-start gap-0"
                          >
                            <span className="font-medium">{starter.name}</span>
                            <span className="text-muted-foreground text-xs">
                              {starter.description}
                            </span>
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setPreview(true)}
                    >
                      <Eye /> <span className="hidden sm:inline">Preview</span>
                    </Button>
                  </>
                }
              />
            </>
          )}
        </div>

        {/* Sidebar */}
        <aside className="space-y-4 lg:sticky lg:top-20">
          <div className="bg-card space-y-4 rounded-xl border p-5 shadow-sm">
            <h3 className="font-semibold">Details</h3>
            <div className="space-y-1.5">
              <Label htmlFor="knowledge-folder">Folder</Label>
              <Select
                value={metadata.folderId ?? ROOT}
                onValueChange={(value) =>
                  updateMeta("folderId", value === ROOT ? null : value)
                }
              >
                <SelectTrigger id="knowledge-folder" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ROOT}>Library (top level)</SelectItem>
                  {folders
                    .map((folder) => ({
                      id: folder.id,
                      label: folderLabel(folder, folders),
                    }))
                    .sort((a, b) => a.label.localeCompare(b.label))
                    .map((folder) => (
                      <SelectItem key={folder.id} value={folder.id}>
                        {folder.label}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="knowledge-category">Category</Label>
              <Select
                value={metadata.category}
                onValueChange={(value) =>
                  updateMeta("category", value as Metadata["category"])
                }
              >
                <SelectTrigger id="knowledge-category" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {KNOWLEDGE_CATEGORIES.map((name) => (
                    <SelectItem key={name} value={name}>
                      {humanize(name)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="knowledge-classification">Access</Label>
              <Select
                value={metadata.classification}
                onValueChange={(value) =>
                  updateMeta(
                    "classification",
                    value as Metadata["classification"],
                  )
                }
              >
                <SelectTrigger id="knowledge-classification" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="INTERNAL">
                    Internal — all viewers
                  </SelectItem>
                  {(canRestrict ||
                    metadata.classification === "RESTRICTED") && (
                    <SelectItem value="RESTRICTED" disabled={!canRestrict}>
                      Restricted — elevated access
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
              {metadata.classification === "RESTRICTED" && (
                <p className="flex gap-1.5 text-xs text-amber-700 dark:text-amber-300">
                  <LockKeyhole className="mt-px size-3.5 shrink-0" /> Only
                  accounts with restricted access can open it.
                </p>
              )}
            </div>
            <div className="flex items-start justify-between gap-3 rounded-lg border p-3">
              <div className="space-y-0.5">
                <Label htmlFor="knowledge-ack">Require acknowledgement</Label>
                <p className="text-muted-foreground text-xs">
                  Readers confirm each published version.
                </p>
              </div>
              <Switch
                id="knowledge-ack"
                checked={metadata.requiresAcknowledgement}
                onCheckedChange={(checked) =>
                  updateMeta("requiresAcknowledgement", checked)
                }
              />
            </div>
          </div>

          <div className="bg-card space-y-3 rounded-xl border p-5 shadow-sm">
            {error && (
              <p
                role="alert"
                className="bg-destructive/10 text-destructive flex items-start gap-2 rounded-lg p-3 text-xs leading-5"
              >
                <AlertCircle className="size-4 shrink-0" /> {error}
              </p>
            )}
            {canPublish && (
              <Button
                type="button"
                disabled={busy}
                onClick={() => {
                  void submit(true);
                }}
                className="bg-barq-yellow text-barq-black hover:bg-barq-yellow/90 w-full"
              >
                {busy ? <Loader2 className="animate-spin" /> : <Send />} Save &
                publish
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              disabled={busy}
              onClick={() => {
                void submit(false);
              }}
              className="w-full"
            >
              {busy && !canPublish ? (
                <Loader2 className="animate-spin" />
              ) : (
                <Save />
              )}{" "}
              Save draft
              <kbd className="bg-muted text-muted-foreground ml-auto hidden rounded border px-1.5 font-mono text-[10px] sm:inline">
                Ctrl S
              </kbd>
            </Button>
            <p className="text-muted-foreground flex items-start gap-2 text-xs">
              <ShieldCheck className="mt-px size-3.5 shrink-0" />
              Every save keeps a revision, so earlier versions stay available
              for audit.
            </p>
          </div>

          {sourceType === "EDITOR" && (
            <p className="text-muted-foreground flex items-start gap-2 px-1 text-xs">
              <BookOpen className="mt-px size-3.5 shrink-0" />
              <span>
                Tip: type <kbd className="rounded border px-1 font-mono">#</kbd>{" "}
                for a heading,{" "}
                <kbd className="rounded border px-1 font-mono">-</kbd> for a
                list or <kbd className="rounded border px-1 font-mono">1.</kbd>{" "}
                for steps.
              </span>
            </p>
          )}
        </aside>
      </div>

      <AlertDialog
        open={pendingStarter !== null}
        onOpenChange={(open) => {
          if (!open) setPendingStarter(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Replace your content?</AlertDialogTitle>
            <AlertDialogDescription>
              The template will replace everything currently in the editor. Your
              last saved draft is not affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep my content</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => pendingStarter && applyStarter(pendingStarter)}
            >
              Use template
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
