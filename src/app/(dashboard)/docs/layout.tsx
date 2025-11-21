/**
 * Docs Layout
 * Documentation section with sidebar navigation
 */

import type { Metadata } from "next";
import { DocsNav } from "@/components/docs/docs-nav";
import { Search } from "@/components/docs/search";
import { getAllDocs } from "@/lib/mdx";

export const metadata: Metadata = {
  title: "Documentation | Barq Assets",
  description:
    "Complete documentation for Barq Assets CMDB/ITAM system - user guides, workflows, and references",
};

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Prepare docs data for search
  const allDocs = getAllDocs();
  const docsForSearch = allDocs.map((doc) => ({
    slug: doc.slug,
    title: doc.frontmatter.title,
    description: doc.frontmatter.description,
    content: doc.content,
  }));

  return (
    <div className="container mx-auto max-w-7xl py-6">
      <div className="flex gap-8">
        {/* Docs Navigation Sidebar */}
        <aside className="hidden w-64 shrink-0 lg:block">
          <div className="sticky top-20 space-y-4">
            {/* Search */}
            <Search docs={docsForSearch} />

            {/* Navigation */}
            <DocsNav />
          </div>
        </aside>

        {/* Main Content */}
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
