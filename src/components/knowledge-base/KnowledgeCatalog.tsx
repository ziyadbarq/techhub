"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  BookOpen, ChevronRight, FileText, Folder, FolderOpen,
  LockKeyhole, Plus, Search, ShieldCheck, Pencil, Trash2,
  RefreshCw, SlidersHorizontal,
} from "lucide-react";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { usePermissions } from "@/hooks/use-permissions";
import { formatDate } from "@/lib/utils/date-format";

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
  hasDraft: boolean;
  updatedAt: string;
};

function folderPath(id: string | null, folders: readonly FolderItem[]): FolderItem[] {
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

export function KnowledgeCatalog() {
  const { hasPermission } = usePermissions();
  const mayCreate = hasPermission(PERMISSIONS.KNOWLEDGE_BASE_CREATE);
  const mayManage = hasPermission(PERMISSIONS.KNOWLEDGE_BASE_UPDATE);
  const [folders, setFolders] = useState<FolderItem[]>([]);
  const [items, setItems] = useState<KnowledgeItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [manage, setManage] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      setLoading(true);
      setError("");
      try {
        const [articlesResponse, foldersResponse] = await Promise.all([
          fetch("/api/knowledge-base" + (manage && mayManage ? "?mode=manage" : ""), {
            signal: controller.signal, cache: "no-store",
          }),
          fetch("/api/knowledge-base/folders", { signal: controller.signal, cache: "no-store" }),
        ]);
        if (!articlesResponse.ok || !foldersResponse.ok) {
          throw new Error("Unable to load the knowledge library.");
        }
        const articles = await articlesResponse.json() as { items: KnowledgeItem[] };
        const folderData = await foldersResponse.json() as { folders: FolderItem[] };
        if (!controller.signal.aborted) {
          setItems(articles.items);
          setFolders(folderData.folders);
        }
      } catch (reason) {
        if (!controller.signal.aborted) {
          setError(reason instanceof Error ? reason.message : "Unable to load knowledge.");
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void load();
    return () => controller.abort();
  }, [manage, mayManage, refreshKey]);

  const activeId = selectedId && folders.some((folder) => folder.id === selectedId)
    ? selectedId : null;
  const path = useMemo(() => folderPath(activeId, folders), [activeId, folders]);
  const searching = query.trim().length > 0;
  const matches = items.filter((item) => {
    if (!searching && item.folderId !== activeId) return false;
    if (!searching) return true;
    return [item.title, item.summary ?? "", item.category].join(" ")
      .toLowerCase().includes(query.trim().toLowerCase());
  });
  const childFolders = searching ? [] : folders.filter((folder) => folder.parentId === activeId);

  function openFolder(id: string | null) {
    setSelectedId(id);
    setQuery("");
  }

  async function mutateFolder(method: "POST" | "PATCH" | "DELETE", id: string | null, body?: object) {
    setBusy(true);
    setError("");
    try {
      const response = await fetch(id ? "/api/knowledge-base/folders/" + encodeURIComponent(id)
        : "/api/knowledge-base/folders", {
        method,
        headers: body ? { "Content-Type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });
      if (!response.ok) {
        const data = await response.json() as { error?: string };
        throw new Error(data.error ?? "Folder operation failed.");
      }
      setRefreshKey((key) => key + 1);
      return true;
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Folder operation failed.");
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function createFolder() {
    const name = window.prompt("Folder name");
    if (name === null || !name.trim()) return;
    await mutateFolder("POST", null, { name: name.trim(), parentId: activeId });
  }

  async function renameFolder(folder: FolderItem) {
    const name = window.prompt("Rename folder", folder.name);
    if (name === null || !name.trim() || name.trim() === folder.name) return;
    await mutateFolder("PATCH", folder.id, { name: name.trim() });
  }

  async function deleteFolder(folder: FolderItem) {
    if (!window.confirm('Delete empty folder "' + folder.name + '"?')) return;
    const deleted = await mutateFolder("DELETE", folder.id);
    if (deleted && selectedId === folder.id) openFolder(folder.parentId);
  }

  async function moveDocument(item: KnowledgeItem, folderId: string | null) {
    if (item.folderId === folderId) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/knowledge-base/" + encodeURIComponent(item.id) + "/move", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folderId, expectedVersion: item.version }),
      });
      if (!response.ok) {
        const data = await response.json() as { error?: string };
        throw new Error(data.error ?? "Unable to move document.");
      }
      setItems((previous) => previous.map((entry) =>
        entry.id === item.id ? { ...entry, folderId } : entry));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to move document.");
    } finally {
      setBusy(false);
    }
  }

  function renderTree(parentId: string | null, depth = 0) {
    if (depth > 30) return null;
    return folders.filter((folder) => folder.parentId === parentId).map((folder) => (
      <div key={folder.id}>
        <button type="button" onClick={() => openFolder(folder.id)}
          style={{ paddingLeft: 12 + depth * 15 }}
          className={"flex w-full items-center gap-2 rounded-lg py-2 pr-2 text-left text-sm transition hover:bg-muted " +
            (activeId === folder.id ? "bg-blue-500/10 font-semibold text-blue-700 dark:text-blue-300" : "text-muted-foreground")}>
          {activeId === folder.id ? <FolderOpen className="h-4 w-4 shrink-0" />
            : <Folder className="h-4 w-4 shrink-0" />}
          <span className="min-w-0 truncate">{folder.name}</span>
        </button>
        {renderTree(folder.id, depth + 1)}
      </div>
    ));
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-12">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b pb-5">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <BookOpen className="h-4 w-4" /> TechHub / Knowledge
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Knowledge Base</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Company policies, procedures and documentation, organized in folders.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {mayCreate && <button type="button" disabled={busy} onClick={() => { void createFolder(); }}
            className="inline-flex h-10 items-center gap-2 rounded-lg border px-3 text-sm font-medium hover:bg-muted disabled:opacity-50">
            <Folder className="h-4 w-4" /> New folder
          </button>}
          {mayCreate && <Link href={"/knowledge-base/new" + (activeId ? "?folder=" + encodeURIComponent(activeId) : "")}
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#163b62] px-3 text-sm font-medium text-white hover:bg-[#24517c]">
            <Plus className="h-4 w-4" /> New document
          </Link>}
        </div>
      </header>

      <div className="grid gap-5 lg:grid-cols-[230px_minmax(0,1fr)]">
        <aside className="rounded-xl border bg-card p-3 lg:self-start">
          <div className="mb-3 px-3 pt-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Folders</div>
          <button type="button" onClick={() => openFolder(null)}
            className={"flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-muted " +
              (activeId === null ? "bg-blue-500/10 font-semibold text-blue-700 dark:text-blue-300" : "text-muted-foreground")}>
            <FolderOpen className="h-4 w-4" /> All root files
          </button>
          <div className="mt-1 space-y-0.5">{renderTree(null)}</div>
          <div className="mt-3 border-t px-3 pt-3 text-xs text-muted-foreground">
            {folders.length} folders · {items.length} {manage ? "documents" : "published"}
          </div>
        </aside>

        <section className="min-w-0 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <nav aria-label="Folder path" className="flex min-w-0 flex-wrap items-center gap-1 text-sm">
              <button type="button" className="font-medium text-muted-foreground hover:text-foreground"
                onClick={() => openFolder(null)}>Library</button>
              {path.map((folder) => (
                <span key={folder.id} className="inline-flex items-center gap-1">
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                  <button type="button" onClick={() => openFolder(folder.id)}
                    className="font-medium hover:underline">{folder.name}</button>
                </span>
              ))}
            </nav>
            <div className="flex items-center gap-2">
              {mayManage && <button type="button" disabled={busy} aria-pressed={manage}
                onClick={() => setManage((value) => !value)}
                className={"inline-flex h-9 items-center gap-2 rounded-lg border px-3 text-xs font-medium hover:bg-muted " +
                  (manage ? "bg-muted" : "")}>
                <SlidersHorizontal className="h-3.5 w-3.5" /> {manage ? "Manage mode" : "Show drafts"}
              </button>}
              <button type="button" onClick={() => setRefreshKey((key) => key + 1)}
                className="flex h-9 w-9 items-center justify-center rounded-lg border hover:bg-muted"
                aria-label="Refresh knowledge library"><RefreshCw className="h-4 w-4" /></button>
            </div>
          </div>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input type="search" value={query} onChange={(event) => setQuery(event.target.value)}
              placeholder="Search documents across all folders..." aria-label="Search documents"
              className="h-11 w-full rounded-lg border bg-card pl-10 pr-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30" />
          </div>
          {error && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/10 dark:text-red-300">{error}</div>}
          <div className="overflow-hidden rounded-xl border bg-card">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3">
              <h2 className="text-sm font-semibold">{searching ? "Search results" : activeId ? path.at(-1)?.name : "Library root"}</h2>
              <span className="text-xs text-muted-foreground">
                {loading ? "Loading..." : childFolders.length + matches.length + " items"}
              </span>
            </div>
            {loading ? (
              <div aria-busy="true" className="p-6 text-sm text-muted-foreground">Loading knowledge...</div>
            ) : childFolders.length === 0 && matches.length === 0 ? (
              <div className="p-12 text-center">
                <FolderOpen className="mx-auto h-9 w-9 text-muted-foreground/50" />
                <p className="mt-3 text-sm font-medium">{searching ? "No matching documents" : "This folder is empty"}</p>
                <p className="mt-1 text-xs text-muted-foreground">Create a folder or document to get started.</p>
              </div>
            ) : (
              <div className="divide-y">
                {childFolders.map((folder) => (
                  <div key={folder.id} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30">
                    <button type="button" onClick={() => openFolder(folder.id)}
                      className="flex min-w-0 flex-1 items-center gap-3 text-left">
                      <Folder className="h-5 w-5 shrink-0 text-[#c59441]" />
                      <span className="truncate text-sm font-medium">{folder.name}</span>
                      <ChevronRight className="ml-auto h-4 w-4 text-muted-foreground" />
                    </button>
                    {mayManage && <div className="flex shrink-0 items-center gap-1">
                      <button type="button" disabled={busy} onClick={() => { void renameFolder(folder); }}
                        aria-label={"Rename " + folder.name} className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button type="button" disabled={busy} onClick={() => { void deleteFolder(folder); }}
                        aria-label={"Delete " + folder.name} className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-red-600">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>}
                  </div>
                ))}
                {matches.map((item) => (
                  <div key={item.id} className="flex flex-wrap items-center gap-3 px-4 py-3 hover:bg-muted/30">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                      {item.sourceType === "PDF"
                        ? <FileText className="h-4 w-4 text-blue-700 dark:text-blue-300" />
                        : <BookOpen className="h-4 w-4 text-blue-700 dark:text-blue-300" />}
                    </span>
                    <Link href={manage && mayManage ? "/knowledge-base/" + item.id + "?draft=1" : "/knowledge-base/" + item.id}
                      className="min-w-[160px] flex-1">
                      <div className="truncate text-sm font-medium hover:text-blue-700 dark:hover:text-blue-300">{item.title}</div>
                      <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <span>{formatDate(item.updatedAt)}</span>
                        <span>·</span><span>v{item.version}</span>
                        {item.hasDraft && manage && <span>· Draft changes</span>}
                        {item.classification === "RESTRICTED"
                          ? <LockKeyhole className="h-3 w-3" aria-label="Restricted" />
                          : <ShieldCheck className="h-3 w-3" aria-label="Internal" />}
                      </div>
                    </Link>
                    {mayManage && manage && <select aria-label={"Move " + item.title + " to folder"}
                      disabled={busy} value={item.folderId ?? ""}
                      onChange={(event) => { void moveDocument(item, event.target.value || null); }}
                      className="h-9 max-w-48 rounded-lg border bg-background px-2 text-xs">
                      <option value="">Root / Unfiled</option>
                      {folders.map((folder) => (
                        <option key={folder.id} value={folder.id}>
                          {folderPath(folder.id, folders).map((entry) => entry.name).join(" / ")}
                        </option>
                      ))}
                    </select>}
                  </div>
                ))}
              </div>
            )}
          </div>
          {searching && <p className="text-xs text-muted-foreground">Search includes documents across folders you can access.</p>}
        </section>
      </div>
    </div>
  );
}
