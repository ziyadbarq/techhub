"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { logger } from "@/lib/logger";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * Global error boundary for dashboard routes
 * Catches unexpected errors and provides a user-friendly interface with retry option
 */
export default function DashboardError({ error, reset }: ErrorProps) {
  useEffect(() => {
    const scopedLogger = logger.scope("DashboardError");
    scopedLogger.error(
      "useEffect",
      "Dashboard error boundary caught an error",
      error,
      {
        digest: error.digest,
      },
    );
  }, [error]);

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-6">
      <Card className="max-w-md">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="bg-destructive/10 rounded-full p-2">
              <AlertTriangle className="text-destructive h-6 w-6" />
            </div>
            <CardTitle>Something went wrong</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground text-sm">
            An unexpected error occurred while loading this page. This error has
            been logged and we'll look into it.
          </p>

          {/* Show error message in development */}
          {process.env.NODE_ENV === "development" && (
            <div className="bg-muted rounded-lg p-3">
              <p className="text-destructive font-mono text-xs break-all">
                {error.message}
              </p>
              {error.digest && (
                <p className="text-muted-foreground mt-2 text-xs">
                  Error ID: {error.digest}
                </p>
              )}
            </div>
          )}

          <div className="flex gap-2">
            <Button onClick={reset} variant="default" className="flex-1">
              Try again
            </Button>
            <Button
              onClick={() => (window.location.href = "/dashboard")}
              variant="outline"
              className="flex-1"
            >
              Go to Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
