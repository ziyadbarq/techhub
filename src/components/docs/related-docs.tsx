/**
 * RelatedDocs Component
 * Shows links to related documentation pages
 */

"use client";

import Link from "next/link";
import { FileText, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface RelatedDoc {
  slug: string;
  title: string;
  description?: string;
}

interface RelatedDocsProps {
  docs: RelatedDoc[];
  className?: string;
}

export function RelatedDocs({ docs, className }: RelatedDocsProps) {
  if (!docs || docs.length === 0) {
    return null;
  }

  return (
    <div className={cn("mt-12", className)}>
      <h3 className="mb-4 text-lg font-semibold">Related Documentation</h3>

      <div className="grid gap-3 sm:grid-cols-2">
        {docs.map((doc) => (
          <Link
            key={doc.slug}
            href={`/docs/${doc.slug}`}
            className="group border-border hover:border-barq-yellow/50 hover:bg-muted/50 flex items-start gap-3 rounded-lg border p-4 transition-all"
          >
            <div className="bg-muted group-hover:bg-barq-yellow/10 mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md transition-colors">
              <FileText className="text-muted-foreground group-hover:text-barq-yellow h-4 w-4 transition-colors" />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="group-hover:text-barq-yellow truncate text-sm font-medium transition-colors">
                  {doc.title}
                </span>
                <ArrowRight className="text-muted-foreground h-3.5 w-3.5 shrink-0 transition-transform group-hover:translate-x-0.5" />
              </div>

              {doc.description && (
                <p className="text-muted-foreground mt-1 line-clamp-2 text-xs">
                  {doc.description}
                </p>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
