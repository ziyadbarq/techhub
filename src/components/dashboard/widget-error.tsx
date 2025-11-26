/**
 * Widget Error Boundary
 * Displays error state when a widget fails to load
 */

"use client";

import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface WidgetErrorProps {
  /** Error message to display */
  message?: string;
  /** Optional retry callback */
  onRetry?: () => void;
}

export function WidgetError({
  message = "Failed to load widget",
  onRetry,
}: WidgetErrorProps) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <AlertCircle className="text-destructive mb-3 h-12 w-12" />
      <p className="text-destructive text-sm font-medium">{message}</p>
      {onRetry && (
        <Button
          variant="outline"
          size="sm"
          onClick={onRetry}
          className="mt-3 gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Retry
        </Button>
      )}
    </div>
  );
}
