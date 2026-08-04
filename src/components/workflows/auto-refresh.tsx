"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Tiny client-side helper that triggers `router.refresh()` on an interval.
 * Used to give server-rendered list pages (inbox, notifications, request
 * list) a real-time feel without converting them to TanStack queries.
 *
 * Pauses while the tab is hidden — refreshes resume when it returns to
 * focus.
 */
export function AutoRefresh({ intervalMs = 15_000 }: { intervalMs?: number }) {
  const router = useRouter();

  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | null = null;

    const start = () => {
      if (timer) return;
      timer = setInterval(() => router.refresh(), intervalMs);
    };
    const stop = () => {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
    };

    if (document.visibilityState === "visible") start();
    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        router.refresh();
        start();
      } else {
        stop();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [router, intervalMs]);

  return null;
}
