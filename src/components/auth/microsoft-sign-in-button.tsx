"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useClientSetting } from "@/hooks/use-client-settings";
import { authClient } from "@/lib/auth/client";
import { safeReturnPath } from "@/lib/auth/safe-return-path";

type Props = {
  callbackURL: string;
  reauthenticate?: boolean;
};

/** Same Microsoft button and Better Auth OAuth flow used on the main login page. */
export function MicrosoftSignInButton({ callbackURL, reauthenticate = false }: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const enabled = useClientSetting("NEXT_PUBLIC_ENABLE_MS_AUTH") !== "false";

  async function handleSignIn() {
    if (busy || !enabled) return;
    setBusy(true);
    setError(null);

    try {
      // Replacing an email-based session guarantees that a fresh OAuth session
      // (not a previously authenticated password session) is evaluated.
      if (reauthenticate) {
        const signedOut = await authClient.signOut();
        if (signedOut.error) {
          throw new Error(signedOut.error.message || "Could not sign out of the previous session");
        }
      }

      const result = await authClient.signIn.social({
        provider: "microsoft",
        callbackURL: safeReturnPath(callbackURL),
      });

      if (result.error) {
        throw new Error(result.error.message || "Microsoft sign-in could not be started");
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : "Microsoft sign-in failed");
      setBusy(false);
    }
  }

  return (
    <div className="w-full space-y-2">
      <Button onClick={handleSignIn} type="button" className="w-full" size="lg" variant="outline" disabled={!enabled || busy}>
        <svg className="mr-2 h-5 w-5" viewBox="0 0 21 21" fill="currentColor" aria-hidden="true">
          <rect x="1" y="1" width="9" height="9" fill="#F25022" />
          <rect x="1" y="11" width="9" height="9" fill="#00A4EF" />
          <rect x="11" y="1" width="9" height="9" fill="#7FBA00" />
          <rect x="11" y="11" width="9" height="9" fill="#FFB900" />
        </svg>
        {busy ? "Connecting to Microsoft…" : "Continue with Microsoft"}
      </Button>
      {!enabled ? <p className="text-center text-xs text-slate-500">Microsoft authentication is currently disabled.</p> : null}
      {error ? <p role="alert" className="text-center text-xs text-red-600 dark:text-red-400">{error}</p> : null}
    </div>
  );
}
