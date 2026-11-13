"use client";

import { useState, type ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { BookOpen, FileText, LockKeyhole } from "lucide-react";
import { cn } from "@/lib/utils";

export type FolderPreviewDocument = {
  id: string;
  title: string;
  sourceType: string;
  classification: string;
};

type KnowledgeFolderCardProps = {
  name: string;
  documentCount: number;
  folderCount: number;
  previews: readonly FolderPreviewDocument[];
  onOpen: () => void;
  /** Rendered in the card corner, outside the open button (e.g. a menu). */
  actions?: ReactNode;
  disabled?: boolean;
};

const MAX_PREVIEWS = 3;
const SPRING = {
  type: "spring",
  stiffness: 320,
  damping: 26,
  mass: 0.7,
} as const;

function countLabel(documents: number, folders: number): string {
  const parts: string[] = [];
  parts.push(documents === 1 ? "1 document" : documents + " documents");
  if (folders > 0)
    parts.push(folders === 1 ? "1 folder" : folders + " folders");
  return parts.join(" · ");
}

function PreviewSheet({ document }: { document: FolderPreviewDocument }) {
  const isPdf = document.sourceType === "PDF";
  return (
    <span className="flex h-full w-full flex-col rounded-md border border-black/5 bg-white p-2 text-left shadow-sm dark:border-white/10 dark:bg-zinc-800">
      <span className="flex items-center gap-1">
        {isPdf ? (
          <FileText className="size-3 text-red-500" aria-hidden="true" />
        ) : (
          <BookOpen
            className="size-3 text-sky-600 dark:text-sky-400"
            aria-hidden="true"
          />
        )}
        {document.classification === "RESTRICTED" && (
          <LockKeyhole
            className="ml-auto size-2.5 text-amber-600"
            aria-hidden="true"
          />
        )}
      </span>
      <span className="mt-1.5 line-clamp-2 text-[9px] leading-tight font-semibold text-zinc-700 dark:text-zinc-200">
        {document.title}
      </span>
      <span className="mt-auto space-y-1" aria-hidden="true">
        <span className="block h-px w-full bg-zinc-200 dark:bg-zinc-600" />
        <span className="block h-px w-4/5 bg-zinc-200 dark:bg-zinc-600" />
        <span className="block h-px w-3/5 bg-zinc-200 dark:bg-zinc-600" />
      </span>
    </span>
  );
}

/**
 * Folder card for the knowledge library. On hover (mouse only) or keyboard
 * focus the front flap folds down and the newest documents fan out, so users
 * can peek inside before opening the folder. Reduced motion shows a static
 * card.
 */
export function KnowledgeFolderCard({
  name,
  documentCount,
  folderCount,
  previews,
  onOpen,
  actions,
  disabled = false,
}: KnowledgeFolderCardProps) {
  const reduceMotion = useReducedMotion() ?? false;
  const [peek, setPeek] = useState(false);
  const sheets = previews.slice(0, MAX_PREVIEWS);
  const open = peek && !reduceMotion && !disabled;
  const middle = (sheets.length - 1) / 2;

  return (
    <div className="group/folder relative">
      <button
        type="button"
        disabled={disabled}
        onClick={onOpen}
        onPointerEnter={(event) => {
          if (event.pointerType === "mouse") setPeek(true);
        }}
        onPointerLeave={() => setPeek(false)}
        onFocus={() => setPeek(true)}
        onBlur={() => setPeek(false)}
        aria-label={
          "Open folder " + name + ", " + countLabel(documentCount, folderCount)
        }
        className={cn(
          "bg-card block w-full rounded-xl border p-4 text-left shadow-sm transition-shadow outline-none",
          "focus-visible:border-ring focus-visible:ring-ring/50 hover:shadow-md focus-visible:ring-[3px]",
          "disabled:pointer-events-none disabled:opacity-60",
        )}
      >
        <span
          className="bg-muted/50 block rounded-lg px-4 pt-5 pb-3"
          aria-hidden="true"
        >
          <span className="relative mx-auto block h-28 max-w-[200px] [perspective:900px]">
            {/* Back of the folder with its tab */}
            <span className="absolute inset-x-2 top-3 bottom-0 rounded-lg rounded-tl-none bg-slate-300 dark:bg-slate-600">
              <span className="absolute -top-3 left-0 h-3.5 w-16 rounded-t-md bg-slate-300 dark:bg-slate-600" />
            </span>

            {/* Document previews */}
            {sheets.map((document, index) => {
              const offset = index - middle;
              return (
                <motion.span
                  key={document.id}
                  className="absolute bottom-3 left-1/2 block h-[78%] w-[38%] origin-bottom"
                  style={{ marginLeft: "-19%", zIndex: 1 + index }}
                  initial={false}
                  animate={
                    open
                      ? {
                          x: offset * 58,
                          y: -14 - (offset === 0 ? 6 : 0),
                          rotate: offset * 9,
                        }
                      : { x: offset * 3, y: -index * 2, rotate: 0 }
                  }
                  transition={reduceMotion ? { duration: 0 } : SPRING}
                >
                  <PreviewSheet document={document} />
                </motion.span>
              );
            })}

            {/* Front flap */}
            <motion.span
              className="absolute inset-x-2 bottom-0 z-10 flex h-[62%] items-end justify-between rounded-lg bg-gradient-to-b from-slate-200 to-slate-300 px-3 pb-2.5 shadow-[0_-1px_0_rgba(255,255,255,.6)_inset] dark:from-slate-500 dark:to-slate-600"
              style={{ transformOrigin: "bottom center" }}
              initial={false}
              animate={{ rotateX: open ? -32 : 0 }}
              transition={reduceMotion ? { duration: 0 } : SPRING}
            >
              <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-200">
                {documentCount === 0 && folderCount === 0 ? "Empty" : ""}
              </span>
              <span className="rounded-md bg-white/70 px-1.5 py-0.5 text-[11px] font-semibold text-slate-700 tabular-nums dark:bg-black/25 dark:text-slate-100">
                {documentCount}
              </span>
            </motion.span>
          </span>
        </span>

        <span className="mt-3 block min-w-0 pr-8">
          <span className="block truncate text-sm font-semibold" title={name}>
            {name}
          </span>
          <span className="text-muted-foreground mt-0.5 block text-xs">
            {countLabel(documentCount, folderCount)}
          </span>
        </span>
      </button>
      {actions && <div className="absolute right-3 bottom-3.5">{actions}</div>}
    </div>
  );
}
