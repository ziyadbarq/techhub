"use client";

import { createAuthClient } from "better-auth/react";
import { twoFactorClient } from "better-auth/client/plugins";
import { toast } from "sonner";

export const authClient = createAuthClient({
  baseURL: typeof window !== "undefined" ? window.location.origin : process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  fetchOptions: {
    onError(context) {
      // Handle rate limiting errors with user-friendly message
      if (context.response?.status === 429) {
        toast.error("Too many requests. Please wait a moment and try again.");
      }
    },
  },
  plugins: [
    twoFactorClient({
      onTwoFactorRedirect: async () => {
        if (typeof window === "undefined") return;
        const params = new URLSearchParams();
        const callbackPath = `${window.location.pathname}${window.location.search}`;
        params.set("callbackURL", callbackPath || "/dashboard");
        window.location.href = `/auth/two-factor?${params.toString()}`;
      },
    }),
  ],
});

export const { useSession } = authClient;
