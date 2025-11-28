"use client";

/**
 * Docs Sidebar
 * Dynamic documentation sidebar with search and navigation
 */

import { BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { Search } from "./search";
import { DocsNavGroup } from "./docs-nav-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { DocsNavigation } from "@/lib/docs/types";

interface DocsSidebarProps {
  navigation: DocsNavigation;
  searchDocs: Array<{
    slug: string;
    title: string;
    description: string;
    content: string;
  }>;
  className?: string;
}

export function DocsSidebar({
  navigation,
  searchDocs,
  className,
}: DocsSidebarProps) {
  return (
    <aside className={cn("hidden w-64 shrink-0 lg:block", className)}>
      <div className="sticky top-20 flex max-h-[calc(100vh-5rem)] flex-col gap-4">
        {/* Search */}
        <Search docs={searchDocs} />

        {/* Navigation Header */}
        <div className="flex items-center gap-2 px-3 text-sm font-semibold">
          <BookOpen className="text-barq-yellow h-4 w-4" />
          <span>Documentation</span>
        </div>

        {/* Navigation Groups */}
        <ScrollArea className="flex-1">
          <nav className="space-y-4 pr-4 pb-8">
            {navigation.categories.map((category) => (
              <DocsNavGroup key={category.id} category={category} />
            ))}
          </nav>
        </ScrollArea>
      </div>
    </aside>
  );
}
