"use client";

import { useEffect, useState } from "react";
import type { RequestFormNav, RequestMenuStatus } from "@/config/navigation";

type State = { forms: RequestFormNav[]; status: RequestMenuStatus };

/**
 * Load published request forms only for permitted users.
 * Refresh on navigation, returning to the tab, and every 60 seconds while
 * visible so newly published and archived forms update without a reload.
 */
export function useRequestFormNav(enabled: boolean, pathname: string | null): State {
  const [state, setState] = useState<State>({ forms: [], status: "loading" });

  useEffect(() => {
    if (!enabled) return;

    const controller = new AbortController();
    let latestRequest = 0;

    async function reload() {
      const requestNumber = ++latestRequest;
      try {
        const response = await fetch("/api/workflow/request-forms", {
          signal: controller.signal,
          cache: "no-store",
        });
        if (!response.ok) throw new Error("REQUEST_FORMS_UNAVAILABLE");
        const payload: unknown = await response.json();
        if (
          !payload ||
          typeof payload !== "object" ||
          !("forms" in payload) ||
          !Array.isArray(payload.forms)
        ) {
          throw new Error("INVALID_REQUEST_FORMS_RESPONSE");
        }
        const forms: RequestFormNav[] = payload.forms.filter(
          (form: unknown): form is RequestFormNav =>
            !!form &&
            typeof form === "object" &&
            "id" in form &&
            typeof form.id === "string" &&
            "name" in form &&
            typeof form.name === "string" &&
            "description" in form &&
            (typeof form.description === "string" || form.description === null),
        );
        if (!controller.signal.aborted && requestNumber === latestRequest) {
          setState({ forms, status: "ready" });
        }
      } catch {
        if (!controller.signal.aborted && requestNumber === latestRequest) {
          // Never expose drafts or cached forms on a permission/network failure.
          setState({ forms: [], status: "error" });
        }
      }
    }

    void reload();
    const onVisibility = () => {
      if (document.visibilityState === "visible") void reload();
    };
    const timer = window.setInterval(onVisibility, 60_000);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("focus", onVisibility);

    return () => {
      controller.abort();
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("focus", onVisibility);
    };
  }, [enabled, pathname]);

  return enabled ? state : { forms: [], status: "loading" };
}
