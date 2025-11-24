/**
 * Dynamic MDX Documentation Page
 * Renders MDX content from src/content/docs/
 * Requires authentication (any authenticated user with DASHBOARD_VIEW can access)
 */

import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import {
  getDocContent,
  getAllDocSlugs,
  extractHeadings,
  getDocLastModified,
} from "@/lib/mdx";
import { customComponents } from "@/components/mdx/mdx-components";
import { TableOfContents } from "@/components/docs/table-of-contents";
import { Breadcrumb } from "@/components/docs/breadcrumb";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import { Clock } from "lucide-react";
import { logger } from "@/lib/logger";
import { requirePermission } from "@/lib/permissions/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { handlePermissionRedirect } from "@/lib/permissions/handle-permission-redirect";

export const dynamic = "force-dynamic";

interface DocPageProps {
  params: Promise<{
    slug: string;
  }>;
}

/**
 * Generate static params for all documentation pages
 */
export async function generateStaticParams() {
  const slugs = getAllDocSlugs();
  return slugs.map((slug) => ({ slug }));
}

/**
 * Generate metadata for the page
 */
export async function generateMetadata({ params }: DocPageProps) {
  const { slug } = await params;

  try {
    const { frontmatter } = getDocContent(slug);
    return {
      title: `${frontmatter.title} | Barq Assets Documentation`,
      description: frontmatter.description,
    };
  } catch {
    return {
      title: "Documentation | Barq Assets",
      description: "Barq Assets documentation",
    };
  }
}

/**
 * Documentation page component
 */
export default async function DocPage({ params }: DocPageProps) {
  // Require DASHBOARD_VIEW permission - docs available to all authenticated users with minimal permissions
  try {
    await requirePermission(PERMISSIONS.DASHBOARD_VIEW);
  } catch (error) {
    const { slug } = await params;
    handlePermissionRedirect(error, `/docs/${slug}`);
    throw error;
  }

  const { slug } = await params;
  const scopedLogger = logger.scope("DocPage");

  let docContent;
  try {
    docContent = getDocContent(slug);
  } catch (error) {
    scopedLogger.error("load", "Failed to load documentation", error, { slug });
    notFound();
  }

  const { content, frontmatter } = docContent;

  // Extract headings for TOC
  const headings = extractHeadings(content);

  // Get last modified date
  const lastModified = getDocLastModified(slug);

  return (
    <div className="relative">
      {/* Breadcrumb */}
      <div className="mb-6">
        <Breadcrumb
          items={[
            { label: "Documentation", href: "/docs" },
            { label: frontmatter.title },
          ]}
        />
      </div>

      <div className="flex gap-8">
        {/* Main content */}
        <article className="prose prose-slate dark:prose-invert max-w-none min-w-0 flex-1">
          {/* Page title */}
          <div className="border-border mb-8 border-b pb-4">
            <h1 className="mb-2">{frontmatter.title}</h1>
            <p className="text-muted-foreground text-lg">
              {frontmatter.description}
            </p>
            {lastModified && (
              <div className="text-muted-foreground mt-4 flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4" />
                <span>
                  Last updated:{" "}
                  {lastModified.toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
              </div>
            )}
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
        </article>

        {/* Table of Contents sidebar */}
        {headings.length > 0 && (
          <aside className="hidden w-64 shrink-0 xl:block">
            <div className="sticky top-20">
              <TableOfContents headings={headings} />
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
