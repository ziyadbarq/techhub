"use client";

import { CheckCircle2, AlertCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface EmailVerificationBadgeProps {
  isVerified: boolean;
  className?: string;
  showLabel?: boolean;
}

export function EmailVerificationBadge({
  isVerified,
  className,
  showLabel = false,
}: EmailVerificationBadgeProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className={cn("inline-flex items-center gap-1", className)}>
            {isVerified ? (
              <>
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                {showLabel && (
                  <span className="text-xs text-green-600 dark:text-green-400">
                    Verified
                  </span>
                )}
              </>
            ) : (
              <>
                <AlertCircle className="h-4 w-4 text-amber-500" />
                {showLabel && (
                  <span className="text-xs text-amber-600 dark:text-amber-400">
                    Unverified
                  </span>
                )}
              </>
            )}
          </span>
        </TooltipTrigger>
        <TooltipContent>
          <p>
            {isVerified
              ? "Email address verified"
              : "Email address not verified"}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
