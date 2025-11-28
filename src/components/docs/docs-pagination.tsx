"use client";

/**
 * Docs Pagination
 * Previous/Next navigation for documentation pages
 */

import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DocPagination } from "@/lib/docs/types";

interface DocsPaginationProps {
  pagination: DocPagination;
  className?: string;
}

export function DocsPagination({ pagination, className }: DocsPaginationProps) {
  const { previous, next } = pagination;

  if (!previous && !next) {
    return null;
  }

  return (
    <nav
      className={cn("mt-12 flex items-stretch gap-4 border-t pt-8", className)}
      aria-label="Pagination"
    >
      {/* Previous */}
      {previous ? (
        <Link
          href={previous.href}
          className="group hover:border-barq-yellow hover:bg-barq-yellow/5 flex flex-1 flex-col items-start gap-1 rounded-lg border p-4 transition-colors"
        >
          <div className="text-muted-foreground group-hover:text-barq-yellow flex items-center gap-1 text-sm">
            <ChevronLeft className="h-4 w-4" />
            <span>Previous</span>
          </div>
          <span className="group-hover:text-barq-yellow font-medium">
            {previous.title}
          </span>
        </Link>
      ) : (
        <div className="flex-1" />
      )}

      {/* Next */}
      {next ? (
        <Link
          href={next.href}
          className="group hover:border-barq-yellow hover:bg-barq-yellow/5 flex flex-1 flex-col items-end gap-1 rounded-lg border p-4 text-right transition-colors"
        >
          <div className="text-muted-foreground group-hover:text-barq-yellow flex items-center gap-1 text-sm">
            <span>Next</span>
            <ChevronRight className="h-4 w-4" />
          </div>
          <span className="group-hover:text-barq-yellow font-medium">
            {next.title}
          </span>
        </Link>
      ) : (
        <div className="flex-1" />
      )}
    </nav>
  );
}
