"use client";

import { createAuthClient } from "better-auth/react";
import { toast } from "sonner";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  fetchOptions: {
    onError(context) {
      // Handle rate limiting errors with user-friendly message
      if (context.response?.status === 429) {
        toast.error("Too many requests. Please wait a moment and try again.");
      }
    },
  },
});

export const { useSession } = authClient;
