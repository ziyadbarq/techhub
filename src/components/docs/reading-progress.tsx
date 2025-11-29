/**
 * ReadingProgress Component
 * Shows a progress bar indicating how far the user has scrolled through the document
 */

"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface ReadingProgressProps {
  className?: string;
}

export function ReadingProgress({ className }: ReadingProgressProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const updateProgress = () => {
      const scrollTop = window.scrollY;
      const docHeight =
        document.documentElement.scrollHeight - window.innerHeight;

      if (docHeight > 0) {
        const scrollPercent = (scrollTop / docHeight) * 100;
        setProgress(Math.min(100, Math.max(0, scrollPercent)));
      }
    };

    // Initial calculation
    updateProgress();

    // Add scroll listener
    window.addEventListener("scroll", updateProgress, { passive: true });
    window.addEventListener("resize", updateProgress, { passive: true });

    return () => {
      window.removeEventListener("scroll", updateProgress);
      window.removeEventListener("resize", updateProgress);
    };
  }, []);

  return (
    <div
      className={cn(
        "fixed top-0 right-0 left-0 z-50 h-1 bg-transparent",
        className,
      )}
    >
      <div
        className="h-full bg-gradient-to-r from-emerald-400 via-cyan-300 to-amber-300 transition-all duration-150 ease-out"
        style={{ width: `${progress}%` }}
        role="progressbar"
        aria-valuenow={Math.round(progress)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Reading progress"
      />
    </div>
  );
}
