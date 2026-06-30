"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { useEffect, useState } from "react";

import { Button } from "./Button";
import { cn } from "@/lib/utils";

export interface ConfirmOptions {
  title: string;
  message?: string;
  /** Label for the confirm button. Defaults to "Confirm". */
  confirmLabel?: string;
  /** Label for the cancel button. Defaults to "Cancel". */
  cancelLabel?: string;
  /** Render confirm button as danger (red) — for destructive actions. */
  danger?: boolean;
}

const OPEN_EVENT = "flowbit:confirm:open";
let pendingResolve: ((value: boolean) => void) | null = null;

/**
 * Imperative confirm() — returns a Promise<boolean>. Replace browser
 * `confirm()` calls with `await confirm({...})`. The dialog is rendered
 * by `<ConfirmHost />` mounted once near the app root.
 */
export function confirm(options: ConfirmOptions): Promise<boolean> {
  if (typeof window === "undefined") return Promise.resolve(false);
  if (pendingResolve) {
    pendingResolve(false);
    pendingResolve = null;
  }
  return new Promise<boolean>((resolve) => {
    pendingResolve = resolve;
    window.dispatchEvent(
      new CustomEvent<ConfirmOptions>(OPEN_EVENT, { detail: options }),
    );
  });
}

/**
 * Mount this once per app — usually in the dashboard layout. Listens for
 * confirm() invocations and renders a themed Radix Dialog. Multiple mounts
 * are safe but redundant.
 */
export function ConfirmHost() {
  const [open, setOpen] = useState(false);
  const [opts, setOpts] = useState<ConfirmOptions | null>(null);

  useEffect(() => {
    const onOpen = (e: Event) => {
      const ce = e as CustomEvent<ConfirmOptions>;
      setOpts(ce.detail);
      setOpen(true);
    };
    window.addEventListener(OPEN_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_EVENT, onOpen);
  }, []);

  const close = (result: boolean) => {
    setOpen(false);
    if (pendingResolve) {
      pendingResolve(result);
      pendingResolve = null;
    }
  };

  if (!opts) return null;

  return (
    <DialogPrimitive.Root
      open={open}
      onOpenChange={(o) => {
        if (!o) close(false);
      }}
    >
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className={cn(
            "fixed inset-0 z-50 bg-[var(--color-ink)]/40 backdrop-blur-sm",
            "data-[state=open]:animate-in data-[state=open]:fade-in-0",
            "data-[state=closed]:animate-out data-[state=closed]:fade-out-0",
          )}
        />
        <DialogPrimitive.Content
          className={cn(
            "fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2",
            "rounded-xl border border-[var(--color-hairline)] bg-[var(--color-canvas)] p-5 shadow-[var(--shadow-3)]",
            "focus:outline-none",
            "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95",
            "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
          )}
        >
          <DialogPrimitive.Title className="text-h5 text-[var(--color-ink)]">
            {opts.title}
          </DialogPrimitive.Title>
          {opts.message ? (
            <DialogPrimitive.Description className="mt-2 text-body-sm text-[var(--color-slate)]">
              {opts.message}
            </DialogPrimitive.Description>
          ) : (
            <DialogPrimitive.Description className="sr-only">
              {opts.title}
            </DialogPrimitive.Description>
          )}
          <div className="mt-5 flex flex-wrap justify-end gap-2">
            <Button onClick={() => close(false)} variant="ghost" size="sm">
              {opts.cancelLabel ?? "Cancel"}
            </Button>
            <Button
              onClick={() => close(true)}
              variant={opts.danger ? "danger" : "primary"}
              size="sm"
              autoFocus
            >
              {opts.confirmLabel ?? "Confirm"}
            </Button>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
