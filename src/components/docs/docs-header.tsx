"use client";

/**
 * Docs Header
 * Mobile header with navigation trigger and search
 */

import { cn } from "@/lib/utils";
import { DocsMobileNav } from "./docs-mobile-nav";
import { Search } from "./search";
import type { DocsNavigation } from "@/lib/docs/types";

interface DocsHeaderProps {
  navigation: DocsNavigation;
  searchDocs: Array<{
    slug: string;
    title: string;
    description: string;
    content: string;
  }>;
  className?: string;
}

export function DocsHeader({
  navigation,
  searchDocs,
  className,
}: DocsHeaderProps) {
  return (
    <div
      className={cn(
        "bg-background/80 supports-[backdrop-filter]:bg-background/60 border-border/60 sticky top-0 z-30 -mx-4 mb-6 flex items-center gap-4 border-b px-4 py-3 backdrop-blur lg:hidden",
        className,
      )}
    >
      {/* Mobile Navigation Trigger */}
      <DocsMobileNav navigation={navigation} />

      {/* Search */}
      <div className="flex-1">
        <Search docs={searchDocs} />
      </div>
    </div>
  );
}
