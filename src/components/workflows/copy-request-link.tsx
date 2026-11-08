"use client";

import { useState } from "react";
import { Check, Copy, AlertCircle } from "lucide-react";

export function CopyRequestLink({ path, label = "Copy form link" }: { path: string; label?: string }) {
  const [state, setState] = useState<"idle" | "copied" | "error">("idle");
  async function copy() {
    try {
      await navigator.clipboard.writeText(new URL(path, window.location.origin).href);
      setState("copied");
    } catch {
      setState("error");
    }
  }
  const Icon = state === "copied" ? Check : state === "error" ? AlertCircle : Copy;
  return (
    <button
      type="button"
      onClick={copy}
      className="inline-flex min-h-10 items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-white"
      aria-label={label}
    >
      <Icon className="h-4 w-4" aria-hidden="true" />
      <span aria-live="polite">{state === "copied" ? "Link copied" : state === "error" ? "Copy unavailable" : label}</span>
    </button>
  );
}
