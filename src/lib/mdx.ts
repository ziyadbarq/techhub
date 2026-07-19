/**
 * MDX Utility Functions
 * Utilities for reading and parsing MDX documentation files
 */

import { readFileSync, existsSync, readdirSync, statSync } from "fs";
import { logger } from "@/lib/logger";
import { join } from "path";
import matter from "gray-matter";
import type { TocHeading } from "@/components/docs/table-of-contents";

const moduleLogger = logger.scope("MDX");

const DOCS_PATH = join(process.cwd(), "src", "content", "docs");

export interface DocFrontmatter {
  title: string;
  description: string;
  icon?: string;
  order?: number;
  [key: string]: unknown;
}

export interface DocContent {
  content: string;
  frontmatter: DocFrontmatter;
  slug: string;
}

/**
 * Get all available doc slugs
 */
export function getAllDocSlugs(): string[] {
  if (!existsSync(DOCS_PATH)) {
    return [];
  }

  return readdirSync(DOCS_PATH)
    .filter((file) => file.endsWith(".mdx"))
    .map((file) => file.replace(/\.mdx$/, ""));
}

/**
 * Get MDX content for a specific doc
 * @param slug - Document slug (filename without .mdx)
 * @returns Parsed content and frontmatter
 */
export function getDocContent(slug: string): DocContent {
  const filePath = join(DOCS_PATH, `${slug}.mdx`);

  if (!existsSync(filePath)) {
    throw new Error(`Documentation file not found: ${slug}.mdx`);
  }

  const fileContent = readFileSync(filePath, "utf8");
  const { data, content } = matter(fileContent);

  return {
    content,
    frontmatter: data as DocFrontmatter,
    slug,
  };
}

/**
 * Get all docs with their frontmatter
 * Useful for generating navigation or lists
 */
export function getAllDocs(): DocContent[] {
  const slugs = getAllDocSlugs();

  return slugs
    .map((slug) => {
      try {
        return getDocContent(slug);
      } catch (error) {
        moduleLogger.error("handler", `Error loading doc: ${slug}`, error);
        return null;
      }
    })
    .filter((doc): doc is DocContent => doc !== null)
    .sort((a, b) => {
      // Sort by order if specified, otherwise by slug
      const orderA = a.frontmatter.order ?? 999;
      const orderB = b.frontmatter.order ?? 999;
      return orderA - orderB;
    });
}

/**
 * Check if a doc exists
 */
export function docExists(slug: string): boolean {
  const filePath = join(DOCS_PATH, `${slug}.mdx`);
  return existsSync(filePath);
}

/**
 * Extract headings from markdown content for table of contents
 * @param content - Raw markdown content
 * @returns Array of headings with id, text, and level
 */
export function extractHeadings(content: string): TocHeading[] {
  const headingRegex = /^(#{2,4})\s+(.+)$/gm;
  const headings: TocHeading[] = [];
  let match;

  while ((match = headingRegex.exec(content)) !== null) {
    const level = match[1].length;
    const text = match[2].trim();
    // Generate slug-like ID from heading text
    const id = text
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-");

    headings.push({ id, text, level });
  }

  return headings;
}

/**
 * Get last modified date for a doc
 * @param slug - Document slug
 * @returns Last modified date or null if file doesn't exist
 */
export function getDocLastModified(slug: string): Date | null {
  const filePath = join(DOCS_PATH, `${slug}.mdx`);

  if (!existsSync(filePath)) {
    return null;
  }

  const stats = statSync(filePath);
  return stats.mtime;
}
