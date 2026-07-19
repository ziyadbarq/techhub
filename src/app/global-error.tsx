"use client";

/**
 * Global Error Boundary
 *
 * Last-resort error boundary: catches errors thrown by the root layout
 * itself, where the (dashboard)/error.tsx boundary cannot help. Must render
 * its own <html>/<body> because the root layout has crashed.
 */

import { useEffect } from "react";

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    // Root layout is down — console is the only safe channel here
    console.error("[GlobalError]", error.message, error.digest ?? "");
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          display: "flex",
          minHeight: "100vh",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div style={{ textAlign: "center", maxWidth: 420, padding: 24 }}>
          <h1 style={{ fontSize: 20, marginBottom: 8 }}>
            Something went wrong
          </h1>
          <p style={{ color: "#666", fontSize: 14, marginBottom: 16 }}>
            An unexpected error occurred. Try again, and contact the Technology
            team if the problem persists.
            {error.digest ? ` (Ref: ${error.digest})` : null}
          </p>
          <button
            onClick={reset}
            style={{
              padding: "8px 16px",
              borderRadius: 6,
              border: "1px solid #ccc",
              background: "#fff",
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
