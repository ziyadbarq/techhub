"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  ArrowUp,
  BookOpen,
  ChevronDown,
  ChevronRight,
  ClipboardCheck,
  FilePlus2,
  FileText,
  FileUp,
  Folder,
  FolderInput,
  FolderOpen,
  FolderPlus,
  LockKeyhole,
  MoreHorizontal,
  Pencil,
  RefreshCw,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { usePermissions } from "@/hooks/use-permissions";
import { formatDate } from "@/lib/utils/date-format";
import { cn } from "@/lib/utils";
import { wouldCreateFolderCycle } from "@/lib/knowledge-base/folders-tree";
import { KnowledgeFolderCard } from "./KnowledgeFolderCard";

type FolderItem = { id: string; name: string; parentId: string | null };
type KnowledgeItem = {
  id: string;
  folderId: string | null;
  title: string;
  summary: string | null;
  category: string;
  classification: string;
  sourceType: string;
  version: number;
  publishedVersion: number | null;
  requiresAcknowledgement?: boolean;
  hasDraft: boolean;
  updatedAt: string;
};

const ROOT = "__root__";

type FolderDialog =
  | { kind: "create"; parentId: string | null }
  | { kind: "rename"; folder: FolderItem }
  | { kind: "move-folder"; folder: FolderItem }
  | { kind: "move-document"; item: KnowledgeItem };

function folderPath(
  id: string | null,
  folders: readonly FolderItem[],
): FolderItem[] {
  const path: FolderItem[] = [];
  const visited = new Set<string>();
  let cursor = id;
  while (cursor && !visited.has(cursor)) {
    visited.add(cursor);
    const folder = folders.find((entry) => entry.id === cursor);
    if (!folder) break;
    path.unshift(folder);
    cursor = folder.parentId;
  }
  return path;
}

function pathLabel(id: string | null, folders: readonly FolderItem[]): string {
  const path = folderPath(id, folders);
  return path.length ? path.map((entry) => entry.name).join(" / ") : "Library";
}

function humanize(value: string): string {
  return value.charAt(0) + value.slice(1).toLowerCase().replace(/_/g, " ");
}

async function readError(
  response: Response,
  fallback: string,
): Promise<string> {
  const data = (await response.json().catch(() => ({}))) as { error?: string };
  return data.error ? humanize(data.error) : fallback;
}

export function KnowledgeCatalog() {
  const { hasPermission } = usePermissions();
  const mayCreate = hasPermission(PERMISSIONS.KNOWLEDGE_BASE_CREATE);
  const mayManage = hasPermission(PERMISSIONS.KNOWLEDGE_BASE_UPDATE);

  const [folders, setFolders] = useState<FolderItem[]>([]);
  const [items, setItems] = useState<KnowledgeItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [manage, setManage] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [busy, setBusy] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<KnowledgeItem[] | null>(null);
  const [searching, setSearching] = useState(false);

  const [dialog, setDialog] = useState<FolderDialog | null>(null);
  const [nameDraft, setNameDraft] = useState("");
  const [targetDraft, setTargetDraft] = useState(ROOT);
  const [pendingDelete, setPendingDelete] = useState<FolderItem | null>(null);

  const managing = manage && mayManage;
  const modeQuery = managing ? "mode=manage" : "";

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      setLoading(true);
      setLoadError("");
      try {
        const [articlesResponse, foldersResponse] = await Promise.all([
          fetch("/api/knowledge-base" + (modeQuery ? "?" + modeQuery : ""), {
            signal: controller.signal,
            cache: "no-store",
          }),
          fetch("/api/knowledge-base/folders", {
            signal: controller.signal,
            cache: "no-store",
          }),
        ]);
        if (!articlesResponse.ok || !foldersResponse.ok)
          throw new Error("Unable to load the knowledge library.");
        const articles = (await articlesResponse.json()) as {
          items: KnowledgeItem[];
        };
        const folderData = (await foldersResponse.json()) as {
          folders: FolderItem[];
        };
        if (controller.signal.aborted) return;
        setItems(articles.items);
        setFolders(folderData.folders);
      } catch (reason) {
        if (!controller.signal.aborted) {
          setLoadError(
            reason instanceof Error
              ? reason.message
              : "Unable to load knowledge.",
          );
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void load();
    return () => controller.abort();
  }, [modeQuery, refreshKey]);

  // Search runs on the server so published documents match on their full text, not only titles.
  const trimmed = query.trim();
  useEffect(() => {
    if (!trimmed) {
      setResults(null);
      setSearching(false);
      return;
    }
    const controller = new AbortController();
    setSearching(true);
    const timer = window.setTimeout(async () => {
      try {
        const params = new URLSearchParams({ q: trimmed });
        if (modeQuery) params.set("mode", "manage");
        const response = await fetch(
          "/api/knowledge-base?" + params.toString(),
          { signal: controller.signal, cache: "no-store" },
        );
        if (!response.ok) throw new Error("Search failed.");
        const data = (await response.json()) as { items: KnowledgeItem[] };
        if (!controller.signal.aborted) setResults(data.items);
      } catch {
        if (!controller.signal.aborted) {
          const needle = trimmed.toLowerCase();
          setResults(
            items.filter((item) =>
              [item.title, item.summary ?? "", item.category]
                .join(" ")
                .toLowerCase()
                .includes(needle),
            ),
          );
        }
      } finally {
        if (!controller.signal.aborted) setSearching(false);
      }
    }, 250);
    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [trimmed, modeQuery, items]);

  const activeId =
    selectedId && folders.some((folder) => folder.id === selectedId)
      ? selectedId
      : null;
  const path = useMemo(
    () => folderPath(activeId, folders),
    [activeId, folders],
  );

  // Per-folder totals include every nested sub-folder.
  const stats = useMemo(() => {
    const children = new Map<string | null, FolderItem[]>();
    for (const folder of folders) {
      const list = children.get(folder.parentId) ?? [];
      list.push(folder);
      children.set(folder.parentId, list);
    }
    const direct = new Map<string | null, KnowledgeItem[]>();
    for (const item of items) {
      const list = direct.get(item.folderId) ?? [];
      list.push(item);
      direct.set(item.folderId, list);
    }
    const totals = new Map<
      string,
      { documents: KnowledgeItem[]; folders: number }
    >();
    const visit = (
      id: string,
      guard: Set<string>,
    ): { documents: KnowledgeItem[]; folders: number } => {
      const cached = totals.get(id);
      if (cached) return cached;
      if (guard.has(id)) return { documents: [], folders: 0 };
      guard.add(id);
      const documents = [...(direct.get(id) ?? [])];
      let nested = 0;
      for (const child of children.get(id) ?? []) {
        const childStats = visit(child.id, guard);
        documents.push(...childStats.documents);
        nested += 1 + childStats.folders;
      }
      const result = { documents, folders: nested };
      totals.set(id, result);
      return result;
    };
    for (const folder of folders) visit(folder.id, new Set());
    return { children, direct, totals };
  }, [folders, items]);

  const childFolders = (stats.children.get(activeId) ?? [])
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name));
  const documents = stats.direct.get(activeId) ?? [];
  const isSearching = trimmed.length > 0;

  function openFolder(id: string | null) {
    setSelectedId(id);
    setQuery("");
  }

  function startDialog(next: FolderDialog) {
    if (next.kind === "rename") setNameDraft(next.folder.name);
    else setNameDraft("");
    if (next.kind === "move-folder")
      setTargetDraft(next.folder.parentId ?? ROOT);
    if (next.kind === "move-document")
      setTargetDraft(next.item.folderId ?? ROOT);
    setDialog(next);
  }

  async function mutateFolder(
    method: "POST" | "PATCH" | "DELETE",
    id: string | null,
    body?: object,
  ) {
    const response = await fetch(
      id
        ? "/api/knowledge-base/folders/" + encodeURIComponent(id)
        : "/api/knowledge-base/folders",
      {
        method,
        headers: body ? { "Content-Type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      },
    );
    if (!response.ok)
      throw new Error(await readError(response, "Folder operation failed."));
  }

  async function submitDialog(event?: FormEvent) {
    event?.preventDefault();
    if (!dialog || busy) return;
    const target = targetDraft === ROOT ? null : targetDraft;
    setBusy(true);
    try {
      if (dialog.kind === "create") {
        if (!nameDraft.trim()) return;
        await mutateFolder("POST", null, {
          name: nameDraft.trim(),
          parentId: dialog.parentId,
        });
        toast.success("Folder created");
      } else if (dialog.kind === "rename") {
        if (!nameDraft.trim() || nameDraft.trim() === dialog.folder.name) {
          setDialog(null);
          return;
        }
        await mutateFolder("PATCH", dialog.folder.id, {
          name: nameDraft.trim(),
        });
        toast.success("Folder renamed");
      } else if (dialog.kind === "move-folder") {
        if (target === dialog.folder.parentId) {
          setDialog(null);
          return;
        }
        await mutateFolder("PATCH", dialog.folder.id, { parentId: target });
        toast.success("Folder moved to " + pathLabel(target, folders));
      } else {
        const { item } = dialog;
        if (target === item.folderId) {
          setDialog(null);
          return;
        }
        const response = await fetch(
          "/api/knowledge-base/" + encodeURIComponent(item.id) + "/move",
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              folderId: target,
              expectedVersion: item.version,
            }),
          },
        );
        if (!response.ok)
          throw new Error(
            await readError(response, "Unable to move document."),
          );
        toast.success("Moved to " + pathLabel(target, folders));
      }
      setDialog(null);
      setRefreshKey((key) => key + 1);
    } catch (reason) {
      toast.error(
        reason instanceof Error ? reason.message : "Something went wrong.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    const folder = pendingDelete;
    setBusy(true);
    try {
      await mutateFolder("DELETE", folder.id);
      toast.success("Folder deleted");
      if (selectedId === folder.id) openFolder(folder.parentId);
      setRefreshKey((key) => key + 1);
    } catch (reason) {
      toast.error(
        reason instanceof Error ? reason.message : "Unable to delete folder.",
      );
    } finally {
      setBusy(false);
      setPendingDelete(null);
    }
  }

  const newDocumentHref = (type?: "pdf") => {
    const params = new URLSearchParams();
    if (activeId) params.set("folder", activeId);
    if (type) params.set("type", type);
    const suffix = params.toString();
    return "/knowledge-base/new" + (suffix ? "?" + suffix : "");
  };

  const folderOptions = (exclude?: FolderItem) =>
    folders
      .filter(
        (candidate) =>
          !exclude ||
          (candidate.id !== exclude.id &&
            !wouldCreateFolderCycle(folders, exclude.id, candidate.id)),
      )
      .map((candidate) => ({
        id: candidate.id,
        label: pathLabel(candidate.id, folders),
      }))
      .sort((a, b) => a.label.localeCompare(b.label));

  function renderTree(parentId: string | null, depth = 0) {
    if (depth > 30) return null;
    const list = (stats.children.get(parentId) ?? [])
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name));
    return list.map((folder) => {
      const active = activeId === folder.id;
      const inPath = path.some((entry) => entry.id === folder.id);
      const total = stats.totals.get(folder.id)?.documents.length ?? 0;
      return (
        <div key={folder.id}>
          <button
            type="button"
            onClick={() => openFolder(folder.id)}
            style={{ paddingLeft: 10 + depth * 14 }}
            aria-current={active ? "page" : undefined}
            className={cn(
              "hover:bg-accent flex w-full items-center gap-2 rounded-md py-1.5 pr-2 text-left text-sm transition-colors",
              active
                ? "bg-accent text-foreground font-medium"
                : "text-muted-foreground",
            )}
          >
            {active || inPath ? (
              <FolderOpen className="text-muted-foreground size-4 shrink-0" />
            ) : (
              <Folder className="text-muted-foreground size-4 shrink-0" />
            )}
            <span className="min-w-0 flex-1 truncate">{folder.name}</span>
            {total > 0 && (
              <span className="text-muted-foreground text-xs tabular-nums">
                {total}
              </span>
            )}
          </button>
          {(inPath || depth === 0) && renderTree(folder.id, depth + 1)}
        </div>
      );
    });
  }

  function renderDocumentRow(item: KnowledgeItem, showLocation = false) {
    const isPdf = item.sourceType === "PDF";
    const href = managing
      ? "/knowledge-base/" + item.id + "?draft=1"
      : "/knowledge-base/" + item.id;
    return (
      <li
        key={item.id}
        className="group hover:bg-muted/40 flex items-center gap-3 px-4 py-3 transition-colors"
      >
        <span
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-lg border",
            isPdf
              ? "bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-300"
              : "bg-sky-50 text-sky-700 dark:bg-sky-950/30 dark:text-sky-300",
          )}
        >
          {isPdf ? (
            <FileText className="size-5" />
          ) : (
            <BookOpen className="size-5" />
          )}
        </span>
        <Link
          href={href}
          className="min-w-0 flex-1 outline-none focus-visible:underline"
        >
          <span className="flex min-w-0 items-center gap-2">
            <span className="truncate text-sm font-medium group-hover:underline">
              {item.title}
            </span>
            {item.classification === "RESTRICTED" && (
              <span title="Restricted" className="inline-flex">
                <LockKeyhole
                  className="size-3.5 shrink-0 text-amber-600"
                  aria-label="Restricted"
                />
              </span>
            )}
          </span>
          <span className="text-muted-foreground mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
            {showLocation && (
              <span className="inline-flex items-center gap-1">
                <Folder className="size-3" />
                {pathLabel(item.folderId, folders)}
              </span>
            )}
            {showLocation && <span aria-hidden="true">·</span>}
            <span>{isPdf ? "PDF" : "Article"}</span>
            <span aria-hidden="true">·</span>
            <span>{humanize(item.category)}</span>
            <span aria-hidden="true">·</span>
            <span>Updated {formatDate(item.updatedAt)}</span>
            <span aria-hidden="true">·</span>
            <span>v{item.version}</span>
          </span>
          {item.summary && (
            <span className="text-muted-foreground/90 mt-1 line-clamp-1 block text-xs">
              {item.summary}
            </span>
          )}
        </Link>
        <span className="hidden shrink-0 items-center gap-1.5 sm:flex">
          {item.requiresAcknowledgement && (
            <Badge variant="outline" className="gap-1 font-normal">
              <ClipboardCheck className="size-3" /> Acknowledge
            </Badge>
          )}
          {managing && item.publishedVersion == null && (
            <Badge variant="secondary" className="font-normal">
              Unpublished
            </Badge>
          )}
          {managing && item.publishedVersion != null && item.hasDraft && (
            <Badge className="border-transparent bg-amber-100 font-normal text-amber-800 shadow-none hover:bg-amber-100 dark:bg-amber-900/40 dark:text-amber-200">
              Draft changes
            </Badge>
          )}
        </span>
        {mayManage && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={"Actions for " + item.title}
              >
                <MoreHorizontal />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={href}>
                  <BookOpen /> Open
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={"/knowledge-base/" + item.id + "/edit"}>
                  <Pencil /> Edit
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                disabled={!managing}
                onSelect={() => startDialog({ kind: "move-document", item })}
              >
                <FolderInput /> Move to folder…
              </DropdownMenuItem>
              {!managing && (
                <p className="text-muted-foreground px-2 pb-1.5 text-[11px]">
                  Turn on Manage to move documents.
                </p>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </li>
    );
  }

  function folderActions(folder: FolderItem) {
    if (!mayManage) return undefined;
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={"Actions for folder " + folder.name}
          >
            <MoreHorizontal />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onSelect={() => startDialog({ kind: "rename", folder })}
          >
            <Pencil /> Rename
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => startDialog({ kind: "move-folder", folder })}
          >
            <FolderInput /> Move…
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-destructive focus:text-destructive [&_svg]:text-destructive"
            onSelect={() => setPendingDelete(folder)}
          >
            <Trash2 /> Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  const totalDocuments = items.length;
  const currentTitle = activeId ? (path.at(-1)?.name ?? "Library") : "Library";
  const dialogTitle =
    dialog?.kind === "create"
      ? "New folder"
      : dialog?.kind === "rename"
        ? "Rename folder"
        : dialog?.kind === "move-folder"
          ? "Move folder"
          : "Move document";

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-2xl font-bold">Knowledge Base</h2>
          <p className="text-muted-foreground">
            Policies, procedures and guides
            {!loading &&
              " · " +
                totalDocuments +
                (managing ? " documents" : " published") +
                " in " +
                folders.length +
                (folders.length === 1 ? " folder" : " folders")}
          </p>
        </div>
        {mayCreate && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              disabled={busy}
              onClick={() =>
                startDialog({ kind: "create", parentId: activeId })
              }
            >
              <FolderPlus /> New folder
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="bg-barq-yellow text-barq-black hover:bg-barq-yellow/90 gap-2">
                  <FilePlus2 /> New document{" "}
                  <ChevronDown className="opacity-70" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuItem asChild className="items-start py-2">
                  <Link href={newDocumentHref()}>
                    <BookOpen className="mt-0.5" />
                    <span>
                      <span className="block font-medium">
                        Write an article
                      </span>
                      <span className="text-muted-foreground block text-xs">
                        Use the built-in editor
                      </span>
                    </span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="items-start py-2">
                  <Link href={newDocumentHref("pdf")}>
                    <FileUp className="mt-0.5" />
                    <span>
                      <span className="block font-medium">Upload a PDF</span>
                      <span className="text-muted-foreground block text-xs">
                        Keep an approved, signed original
                      </span>
                    </span>
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
        {/* Folder tree */}
        <aside
          className="bg-card hidden rounded-xl border p-2 shadow-sm lg:block lg:self-start"
          aria-label="Folders"
        >
          <p className="text-muted-foreground px-2.5 pt-2 pb-1.5 text-xs font-medium tracking-wide uppercase">
            Folders
          </p>
          <button
            type="button"
            onClick={() => openFolder(null)}
            aria-current={activeId === null ? "page" : undefined}
            className={cn(
              "hover:bg-accent flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-sm transition-colors",
              activeId === null
                ? "bg-accent text-foreground font-medium"
                : "text-muted-foreground",
            )}
          >
            <BookOpen className="size-4 shrink-0" />
            <span className="flex-1">Library</span>
            <span className="text-muted-foreground text-xs tabular-nums">
              {totalDocuments}
            </span>
          </button>
          <div className="mt-0.5 space-y-px">
            {loading && folders.length === 0
              ? Array.from({ length: 4 }, (_, index) => (
                  <Skeleton key={index} className="mx-2.5 my-2 h-4" />
                ))
              : renderTree(null)}
          </div>
        </aside>

        <section className="min-w-0 space-y-5">
          {/* Toolbar */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
              <Input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search titles, summaries and content…"
                aria-label="Search the knowledge base"
                className="pr-9 pl-9 [&::-webkit-search-cancel-button]:hidden"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  aria-label="Clear search"
                  className="text-muted-foreground hover:text-foreground absolute top-1/2 right-2 -translate-y-1/2 rounded p-1"
                >
                  <X className="size-4" />
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              {mayManage && (
                <div className="bg-background flex h-9 items-center gap-2 rounded-md border px-3 shadow-xs">
                  <Switch
                    id="kb-manage"
                    checked={manage}
                    onCheckedChange={setManage}
                    disabled={busy}
                  />
                  <Label
                    htmlFor="kb-manage"
                    className="cursor-pointer text-sm font-normal"
                    title="Show drafts and unpublished documents, and move items between folders"
                  >
                    Manage
                  </Label>
                </div>
              )}
              <Button
                variant="outline"
                size="icon"
                onClick={() => setRefreshKey((key) => key + 1)}
                aria-label="Refresh"
              >
                <RefreshCw className={cn(loading && "animate-spin")} />
              </Button>
            </div>
          </div>

          {loadError && (
            <div
              role="alert"
              className="border-destructive/30 bg-destructive/5 text-destructive flex items-center justify-between gap-3 rounded-lg border px-4 py-3 text-sm"
            >
              {loadError}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setRefreshKey((key) => key + 1)}
              >
                Try again
              </Button>
            </div>
          )}

          {isSearching ? (
            <div className="bg-card overflow-hidden rounded-xl border shadow-sm">
              <div className="flex items-center justify-between border-b px-4 py-3">
                <h3 className="text-sm font-semibold">
                  Results for “{trimmed}”
                </h3>
                <span className="text-muted-foreground text-xs">
                  {searching ? "Searching…" : (results?.length ?? 0) + " found"}
                </span>
              </div>
              {searching && !results ? (
                <div className="space-y-3 p-4">
                  {Array.from({ length: 3 }, (_, index) => (
                    <Skeleton key={index} className="h-12" />
                  ))}
                </div>
              ) : results && results.length > 0 ? (
                <ul className="divide-y">
                  {results.map((item) => renderDocumentRow(item, true))}
                </ul>
              ) : (
                <div className="px-6 py-12 text-center">
                  <Search className="text-muted-foreground/50 mx-auto size-8" />
                  <p className="mt-3 text-sm font-medium">
                    No documents match your search
                  </p>
                  <p className="text-muted-foreground mt-1 text-xs">
                    Try a different keyword
                    {managing ? "" : ", or check the spelling"}.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Breadcrumb */}
              {activeId && (
                <div className="flex min-h-9 flex-wrap items-center justify-between gap-2">
                  <nav
                    aria-label="Folder path"
                    className="flex min-w-0 flex-wrap items-center gap-1 text-sm"
                  >
                    <button
                      type="button"
                      onClick={() => openFolder(null)}
                      className={cn(
                        "rounded px-1 font-medium hover:underline",
                        activeId ? "text-muted-foreground" : "text-foreground",
                      )}
                    >
                      Library
                    </button>
                    {path.map((folder, index) => (
                      <span
                        key={folder.id}
                        className="inline-flex min-w-0 items-center gap-1"
                      >
                        <ChevronRight className="text-muted-foreground size-3.5 shrink-0" />
                        <button
                          type="button"
                          onClick={() => openFolder(folder.id)}
                          className={cn(
                            "truncate rounded px-1 font-medium hover:underline",
                            index === path.length - 1
                              ? "text-foreground"
                              : "text-muted-foreground",
                          )}
                        >
                          {folder.name}
                        </button>
                      </span>
                    ))}
                  </nav>
                  {activeId && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openFolder(path.at(-2)?.id ?? null)}
                    >
                      <ArrowUp /> Up one level
                    </Button>
                  )}
                </div>
              )}

              {loading ? (
                <div className="space-y-5">
                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                    {Array.from({ length: 3 }, (_, index) => (
                      <Skeleton key={index} className="h-[212px] rounded-xl" />
                    ))}
                  </div>
                  <Skeleton className="h-40 rounded-xl" />
                </div>
              ) : childFolders.length === 0 && documents.length === 0 ? (
                <div className="bg-card rounded-xl border border-dashed px-6 py-14 text-center">
                  <FolderOpen className="text-muted-foreground/60 mx-auto size-10" />
                  <p className="mt-3 font-medium">
                    {activeId
                      ? currentTitle + " is empty"
                      : "Your knowledge library is empty"}
                  </p>
                  <p className="text-muted-foreground mt-1 text-sm">
                    {mayCreate
                      ? "Add a folder to organize content, or create the first document here."
                      : "Nothing has been published here yet."}
                  </p>
                  {mayCreate && (
                    <div className="mt-5 flex flex-wrap justify-center gap-2">
                      <Button
                        variant="outline"
                        onClick={() =>
                          startDialog({ kind: "create", parentId: activeId })
                        }
                      >
                        <FolderPlus /> New folder
                      </Button>
                      <Button variant="outline" asChild>
                        <Link href={newDocumentHref()}>
                          <BookOpen /> Write an article
                        </Link>
                      </Button>
                      <Button variant="outline" asChild>
                        <Link href={newDocumentHref("pdf")}>
                          <FileUp /> Upload a PDF
                        </Link>
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  {childFolders.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="text-muted-foreground text-sm font-semibold">
                        Folders{" "}
                        <span className="font-normal">
                          ({childFolders.length})
                        </span>
                      </h3>
                      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                        {childFolders.map((folder) => {
                          const folderStats = stats.totals.get(folder.id);
                          return (
                            <KnowledgeFolderCard
                              key={folder.id}
                              name={folder.name}
                              documentCount={folderStats?.documents.length ?? 0}
                              folderCount={folderStats?.folders ?? 0}
                              previews={folderStats?.documents ?? []}
                              onOpen={() => openFolder(folder.id)}
                              actions={folderActions(folder)}
                              disabled={busy}
                            />
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {documents.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="text-muted-foreground text-sm font-semibold">
                        Documents{" "}
                        <span className="font-normal">
                          ({documents.length})
                        </span>
                      </h3>
                      <ul className="bg-card divide-y overflow-hidden rounded-xl border shadow-sm">
                        {documents.map((item) => renderDocumentRow(item))}
                      </ul>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </section>
      </div>

      {/* Create / rename / move dialog */}
      <Dialog
        open={dialog !== null}
        onOpenChange={(open) => {
          if (!open && !busy) setDialog(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <form
            onSubmit={(event) => {
              void submitDialog(event);
            }}
            className="space-y-5"
          >
            <DialogHeader>
              <DialogTitle>{dialogTitle}</DialogTitle>
              <DialogDescription>
                {dialog?.kind === "create" &&
                  "Created inside " + pathLabel(dialog.parentId, folders) + "."}
                {dialog?.kind === "rename" &&
                  "Folder names must be unique within their parent folder."}
                {dialog?.kind === "move-folder" &&
                  "Moving a folder also moves everything inside it."}
                {dialog?.kind === "move-document" &&
                  "Moving a document does not change its version or acknowledgements."}
              </DialogDescription>
            </DialogHeader>
            {(dialog?.kind === "create" || dialog?.kind === "rename") && (
              <div className="space-y-2">
                <Label htmlFor="kb-folder-name">Folder name</Label>
                <Input
                  id="kb-folder-name"
                  autoFocus
                  maxLength={80}
                  value={nameDraft}
                  onChange={(event) => setNameDraft(event.target.value)}
                  placeholder="e.g. Information Security"
                />
              </div>
            )}
            {(dialog?.kind === "move-folder" ||
              dialog?.kind === "move-document") && (
              <div className="space-y-2">
                <Label htmlFor="kb-move-target">Destination</Label>
                <Select value={targetDraft} onValueChange={setTargetDraft}>
                  <SelectTrigger id="kb-move-target" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ROOT}>Library (top level)</SelectItem>
                    {folderOptions(
                      dialog.kind === "move-folder" ? dialog.folder : undefined,
                    ).map((option) => (
                      <SelectItem key={option.id} value={option.id}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                disabled={busy}
                onClick={() => setDialog(null)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={
                  busy ||
                  ((dialog?.kind === "create" || dialog?.kind === "rename") &&
                    !nameDraft.trim())
                }
              >
                {dialog?.kind === "create"
                  ? "Create folder"
                  : dialog?.kind === "rename"
                    ? "Save"
                    : "Move"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open && !busy) setPendingDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete “{pendingDelete?.name}”?</AlertDialogTitle>
            <AlertDialogDescription>
              Only empty folders can be deleted. Move or archive its documents
              and sub-folders first.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={busy}
              onClick={(event) => {
                event.preventDefault();
                void confirmDelete();
              }}
              className="bg-destructive hover:bg-destructive/90 text-white"
            >
              Delete folder
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
