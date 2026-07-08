/**
 * Dynamic MDX Documentation Page
 * Renders MDX content from src/content/docs/
 *
 * Features:
 * - Supports nested routes (e.g., /docs/modules/service-management)
 * - Reading time estimate
 * - Previous/Next navigation
 * - Table of contents
 * - Requires authentication (DASHBOARD_VIEW permission)
 */

import { notFound } from "next/navigation";
import { formatDate } from "@/lib/utils/date-format";
import { MDXRemote } from "next-mdx-remote/rsc";
import {
  getDocContent,
  getAllDocSlugs,
  extractHeadings,
  getDocLastModified,
  buildNavigation,
  getDocPagination,
  getReadingTime,
  canAccessDoc,
} from "@/lib/docs";
import type { PermissionKey } from "@/core/domain/value-objects/permission-key";
import { customComponents } from "@/components/mdx/mdx-components";
import { DocsRightSidebar } from "@/components/docs/docs-right-sidebar";
import { DocsPagination } from "@/components/docs/docs-pagination";
import { DocsFeedback } from "@/components/docs/docs-feedback";
import { RelatedDocs } from "@/components/docs/related-docs";
import { ScrollToTop } from "@/components/docs/scroll-to-top";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import { Clock, BookOpen } from "lucide-react";
import { logger } from "@/lib/logger";
import { requirePermission } from "@/lib/permissions/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { handlePermissionRedirect } from "@/lib/permissions/handle-permission-redirect";

export const dynamic = "force-dynamic";

interface DocPageProps {
  params: Promise<{
    slug: string[];
  }>;
}

/**
 * Generate static params for all documentation pages
 */
export async function generateStaticParams() {
  const slugs = getAllDocSlugs();
  return slugs.map((slug) => ({ slug: slug.split("/") }));
}

/**
 * Generate metadata for the page
 */
export async function generateMetadata({ params }: DocPageProps) {
  const { slug } = await params;
  const fullSlug = slug.join("/");

  try {
    const { frontmatter } = getDocContent(fullSlug);
    return {
      title: `${frontmatter.title} | TechHub Documentation`,
      description: frontmatter.description,
    };
  } catch {
    return {
      title: "Documentation | TechHub",
      description: "TechHub documentation",
    };
  }
}

/**
 * Documentation page component
 */
export default async function DocPage({ params }: DocPageProps) {
  const { slug } = await params;
  const fullSlug = slug.join("/");

  // Require DASHBOARD_VIEW permission - docs available to all authenticated users with minimal permissions
  try {
    await requirePermission(PERMISSIONS.DASHBOARD_VIEW);
  } catch (error) {
    handlePermissionRedirect(error, `/docs/${fullSlug}`);
    throw error;
  }

  const scopedLogger = logger.scope("DocPage");

  let docContent;
  try {
    docContent = getDocContent(fullSlug);
  } catch (error) {
    scopedLogger.error("load", "Failed to load documentation", error, {
      slug: fullSlug,
    });
    notFound();
  }

  const { content, frontmatter } = docContent;

  // Check doc-level permission if required
  const docRequiredPermission = frontmatter.requiredPermission as
    | PermissionKey
    | undefined;
  if (docRequiredPermission) {
    const canAccess = await canAccessDoc(docRequiredPermission);
    if (!canAccess) {
      scopedLogger.warn("access", "User lacks permission for doc", {
        slug: fullSlug,
        requiredPermission: docRequiredPermission,
      });
      notFound(); // Return 404 for permission-gated docs user can't access
    }
  }

  // Extract headings for TOC
  const headings = extractHeadings(content);

  // Get last modified date
  const lastModified = getDocLastModified(fullSlug);

  // Calculate reading time
  const readingTime = getReadingTime(frontmatter.estimatedTime, content);

  // Build navigation and get pagination
  const navigation = buildNavigation();
  const pagination = getDocPagination(fullSlug, navigation);

  // Build breadcrumb items
  const breadcrumbItems: Array<{ label: string; href?: string }> = [
    { label: "Documentation", href: "/docs" },
  ];
  if (docContent.category) {
    const category = navigation.categories.find(
      (c) => c.id === docContent.category,
    );
    if (category) {
      breadcrumbItems.push({
        label: category.title,
        href: `/docs?category=${category.id}`,
      });
    }
  }
  breadcrumbItems.push({ label: frontmatter.title });

  // Resolve related docs from frontmatter
  const relatedDocs = (frontmatter.relatedDocs || [])
    .map((relatedSlug: string) => {
      try {
        const relatedDoc = getDocContent(relatedSlug);
        return {
          slug: relatedSlug,
          title: relatedDoc.frontmatter.title,
          description: relatedDoc.frontmatter.description,
        };
      } catch {
        return null;
      }
    })
    .filter(Boolean) as Array<{
    slug: string;
    title: string;
    description: string;
  }>;

  return (
    <div className="relative">
      <div className="flex gap-8">
        {/* Main content */}
        <article className="prose prose-slate dark:prose-invert border-border/60 bg-card/80 prose-headings:tracking-tight prose-headings:text-foreground prose-p:text-muted-foreground prose-li:text-muted-foreground prose-a:text-emerald-300 prose-a:underline prose-a:underline-offset-4 prose-strong:text-foreground max-w-3xl min-w-0 flex-1 rounded-3xl border px-8 py-8 shadow-[0_30px_90px_-70px_rgba(0,0,0,0.9)] backdrop-blur">
          {/* Page title */}
          <div className="border-border mb-8 border-b pb-5">
            <div className="text-xs font-semibold tracking-[0.15em] text-emerald-300 uppercase">
              Documentation
            </div>
            <h1 className="mb-3 text-balance">{frontmatter.title}</h1>
            <p className="text-muted-foreground text-lg leading-7">
              {frontmatter.description}
            </p>

            {/* Metadata row */}
            <div className="text-muted-foreground mt-4 flex flex-wrap items-center gap-4 text-sm">
              {/* Reading time */}
              <div className="flex items-center gap-1.5">
                <BookOpen className="h-4 w-4" />
                <span>{readingTime.text}</span>
              </div>

              {/* Last updated */}
              {lastModified && (
                <div className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4" />
                  <span>Updated {formatDate(lastModified)}</span>
                </div>
              )}
            </div>
          </div>

          {/* MDX Content */}
          <MDXRemote
            source={content}
            components={customComponents}
            options={{
              mdxOptions: {
                remarkPlugins: [remarkGfm],
                rehypePlugins: [
                  rehypeHighlight,
                  rehypeSlug,
                  [rehypeAutolinkHeadings, { behavior: "wrap" }],
                ],
              },
            }}
          />

          {/* Related Documentation */}
          {relatedDocs.length > 0 && <RelatedDocs docs={relatedDocs} />}

          {/* Pagination */}
          <DocsPagination pagination={pagination} />

          {/* Feedback */}
          <DocsFeedback slug={fullSlug} className="mt-12" />
        </article>

        {/* Right Sidebar - Table of Contents */}
        <DocsRightSidebar headings={headings} />
      </div>

      {/* Scroll to top button */}
      <ScrollToTop />
    </div>
  );
}
