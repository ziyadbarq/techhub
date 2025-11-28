"use client";

/**
 * Docs Right Sidebar
 * Table of contents and related content for documentation pages
 */

import { cn } from "@/lib/utils";
import { TableOfContents } from "./table-of-contents";
import type { TocHeading } from "@/lib/docs/types";

interface DocsRightSidebarProps {
  headings: TocHeading[];
  relatedDocs?: string[];
  className?: string;
}

export function DocsRightSidebar({
  headings,
  className,
}: DocsRightSidebarProps) {
  // Only show if there are headings to display
  if (!headings || headings.length === 0) {
    return null;
  }

  return (
    <aside className={cn("hidden w-56 shrink-0 xl:block", className)}>
      <div className="sticky top-20 max-h-[calc(100vh-5rem)] overflow-y-auto">
        <div className="space-y-6 pb-8">
          {/* Table of Contents */}
          <TableOfContents headings={headings} />

          {/* Future: Related docs, feedback widget, etc. can go here */}
        </div>
      </div>
    </aside>
  );
}
