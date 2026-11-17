"use client";

import { useEffect, useRef, useState } from "react";
import { AlertCircle, Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import type { PDFDocumentProxy } from "pdfjs-dist";

const VIEWER_HEADER = "x-knowledge-viewer";
const MAX_PAGE_WIDTH = 900;

const ERRORS: Record<string, string> = {
  PRIVATE_GCS_STORAGE_REQUIRED:
    "This document can't be shown here: private file storage isn't configured.",
  PDF_NOT_FOUND: "The document file is missing.",
  RESTRICTED_DOCUMENT_ACCESS_REQUIRED:
    "This document is restricted. You don't have access to it.",
};

type LoadState =
  | { status: "loading" }
  | { status: "ready"; pdf: PDFDocumentProxy }
  | { status: "error"; message: string };

/**
 * View-only PDF reader. Pages are drawn as pictures on canvases, with no
 * text layer, so there is nothing to select or copy. There is no download
 * or print button, right-click and dragging are off, and printing the page
 * prints a notice instead of the document.
 *
 * This keeps the policy inside TechHub for normal use. It can't stop a
 * screenshot, or someone determined pulling the file out of the browser.
 */
export function ProtectedPdfViewer({ src }: { src: string }) {
  const [state, setState] = useState<LoadState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    let loadingTask: { destroy: () => Promise<void> } | null = null;
    (async () => {
      try {
        const response = await fetch(src, {
          headers: { [VIEWER_HEADER]: "1" },
          cache: "no-store",
          credentials: "same-origin",
        });
        if (!response.ok) {
          const body = (await response.json().catch(() => null)) as {
            error?: string;
          } | null;
          throw new Error(
            ERRORS[body?.error ?? ""] ?? "The document couldn't be opened.",
          );
        }
        const data = new Uint8Array(await response.arrayBuffer());
        const pdfjs = await import("pdfjs-dist");
        pdfjs.GlobalWorkerOptions.workerSrc = new URL(
          "pdfjs-dist/build/pdf.worker.min.mjs",
          import.meta.url,
        ).toString();
        const task = pdfjs.getDocument({ data });
        loadingTask = task;
        const pdf = await task.promise;
        if (cancelled) return;
        setState({ status: "ready", pdf });
      } catch (error) {
        if (cancelled) return;
        setState({
          status: "error",
          message:
            error instanceof Error &&
            Object.values(ERRORS).includes(error.message)
              ? error.message
              : "The document couldn't be opened.",
        });
      }
    })();
    return () => {
      cancelled = true;
      if (loadingTask) void loadingTask.destroy();
    };
  }, [src]);

  // Ctrl/Cmd+P and +S would print or save the page; neither is wanted here.
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (!(event.ctrlKey || event.metaKey)) return;
      const key = event.key.toLowerCase();
      if (key === "p" || key === "s") {
        event.preventDefault();
        toast.info("This document is view-only.");
      }
    }
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, []);

  return (
    <div>
      <div
        className="select-none print:hidden"
        onContextMenu={(event) => event.preventDefault()}
        onDragStart={(event) => event.preventDefault()}
        onCopy={(event) => event.preventDefault()}
      >
        <p className="text-muted-foreground mb-4 flex items-center gap-1.5 text-xs">
          <ShieldCheck className="h-3.5 w-3.5" />
          View-only document. Copying, downloading and printing are turned off.
        </p>
        {state.status === "loading" ? (
          <div className="text-muted-foreground flex items-center justify-center gap-2 py-24 text-sm">
            <Loader2 className="h-4 w-4 animate-spin" /> Opening document…
          </div>
        ) : state.status === "error" ? (
          <p
            role="alert"
            className="bg-destructive/10 text-destructive flex items-start gap-2 rounded-lg p-4 text-sm"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {state.message}
          </p>
        ) : (
          <PdfPages pdf={state.pdf} />
        )}
      </div>
      <p className="hidden text-sm print:block">
        This document is view-only and can&apos;t be printed.
      </p>
    </div>
  );
}

function PdfPages({ pdf }: { pdf: PDFDocumentProxy }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;
    const measure = () =>
      setWidth(Math.min(element.clientWidth, MAX_PAGE_WIDTH));
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="space-y-4">
      {width > 0
        ? Array.from({ length: pdf.numPages }, (_, index) => (
            <PdfPage
              key={index}
              pdf={pdf}
              pageNumber={index + 1}
              width={width}
            />
          ))
        : null}
      <p className="text-muted-foreground text-center text-xs">
        {pdf.numPages} {pdf.numPages === 1 ? "page" : "pages"}
      </p>
    </div>
  );
}

function PdfPage({
  pdf,
  pageNumber,
  width,
}: {
  pdf: PDFDocumentProxy;
  pageNumber: number;
  width: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let cancelled = false;
    let task: { cancel: () => void } | null = null;
    (async () => {
      const page = await pdf.getPage(pageNumber);
      const canvas = canvasRef.current;
      if (cancelled || !canvas) return;
      const base = page.getViewport({ scale: 1 });
      const ratio = window.devicePixelRatio || 1;
      const viewport = page.getViewport({
        scale: (width / base.width) * ratio,
      });
      canvas.width = Math.floor(viewport.width);
      canvas.height = Math.floor(viewport.height);
      canvas.style.width = `${Math.floor(viewport.width / ratio)}px`;
      canvas.style.height = `${Math.floor(viewport.height / ratio)}px`;
      const renderTask = page.render({ canvas, viewport });
      task = renderTask;
      await renderTask.promise.catch(() => undefined);
    })();
    return () => {
      cancelled = true;
      task?.cancel();
    };
  }, [pdf, pageNumber, width]);

  return (
    <canvas
      ref={canvasRef}
      aria-label={`Page ${pageNumber}`}
      className="mx-auto block rounded-md border bg-white shadow-sm"
    />
  );
}
