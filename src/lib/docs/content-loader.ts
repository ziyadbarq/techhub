/**
 * Documentation Content Loader
 * Utilities for loading and parsing MDX documentation files
 * Supports nested folder structure with _meta.ts category configuration
 */

import { readFileSync, existsSync, readdirSync, statSync } from "fs";
import { join, basename } from "path";
import matter from "gray-matter";
import { logger } from "@/lib/logger";
import type {
  DocContent,
  DocFrontmatter,
  CategoryMeta,
  TocHeading,
} from "./types";

// Base path for documentation content
const DOCS_PATH = join(process.cwd(), "src", "content", "docs");

// Default category metadata
const DEFAULT_CATEGORY_META: CategoryMeta = {
  title: "Documentation",
  order: 999,
};

/**
 * Check if a path is a directory
 */
function isDirectory(path: string): boolean {
  try {
    return existsSync(path) && statSync(path).isDirectory();
  } catch {
    return false;
  }
}

/**
 * Load category metadata from _meta.ts file
 * @param categoryPath - Path to the category directory
 */
export function loadCategoryMeta(categoryPath: string): CategoryMeta {
  const metaPath = join(categoryPath, "_meta.ts");

  if (!existsSync(metaPath)) {
    // Generate default title from folder name
    const folderName = basename(categoryPath);
    return {
      ...DEFAULT_CATEGORY_META,
      title: folderName
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" "),
    };
  }

  try {
    // Read and evaluate the _meta.ts file
    // Note: In production, you might want to use a proper TypeScript compiler
    const content = readFileSync(metaPath, "utf8");

    // Extract the default export object (simple parsing)
    const match = content.match(
      /export\s+default\s+({[\s\S]*?});?\s*(?:\/\/|$)/,
    );
    if (match) {
      // Use Function constructor to evaluate (safer than eval for object literals)
      const metaObj = new Function(`return ${match[1]}`)();
      return { ...DEFAULT_CATEGORY_META, ...metaObj };
    }

    return DEFAULT_CATEGORY_META;
  } catch (error) {
    logger
      .scope("ContentLoader")
      .error("meta", `Error loading category meta from ${metaPath}`, error);
    return DEFAULT_CATEGORY_META;
  }
}

/**
 * Get all categories in the docs directory
 * @returns Array of category IDs (folder names)
 */
export function getAllCategories(): string[] {
  if (!existsSync(DOCS_PATH)) {
    return [];
  }

  return readdirSync(DOCS_PATH)
    .filter((item) => {
      const itemPath = join(DOCS_PATH, item);
      // Only include directories, exclude _config
      return isDirectory(itemPath) && !item.startsWith("_");
    })
    .sort((a, b) => {
      const metaA = loadCategoryMeta(join(DOCS_PATH, a));
      const metaB = loadCategoryMeta(join(DOCS_PATH, b));
      return (metaA.order ?? 999) - (metaB.order ?? 999);
    });
}

/**
 * Get all document slugs (supports nested folders)
 * Returns slugs in format: "category/filename" or "filename" for root level
 */
export function getAllDocSlugs(): string[] {
  if (!existsSync(DOCS_PATH)) {
    return [];
  }

  const slugs: string[] = [];

  function scanDirectory(dirPath: string, prefix: string = "") {
    const items = readdirSync(dirPath);

    for (const item of items) {
      const itemPath = join(dirPath, item);

      // Skip config directories and meta files
      if (item.startsWith("_")) continue;

      if (isDirectory(itemPath)) {
        // Recurse into subdirectory
        const newPrefix = prefix ? `${prefix}/${item}` : item;
        scanDirectory(itemPath, newPrefix);
      } else if (item.endsWith(".mdx")) {
        // Add MDX file
        const fileName = item.replace(/\.mdx$/, "");
        const slug = prefix ? `${prefix}/${fileName}` : fileName;
        slugs.push(slug);
      }
    }
  }

  scanDirectory(DOCS_PATH);
  return slugs;
}

/**
 * Get the file path for a doc slug
 */
function getDocFilePath(slug: string): string {
  return join(DOCS_PATH, `${slug}.mdx`);
}

/**
 * Get MDX content for a specific doc
 * @param slug - Document slug (e.g., "user-guides/assets" or "getting-started")
 */
export function getDocContent(slug: string): DocContent {
  const filePath = getDocFilePath(slug);

  if (!existsSync(filePath)) {
    throw new Error(`Documentation file not found: ${slug}.mdx`);
  }

  const fileContent = readFileSync(filePath, "utf8");
  const { data, content } = matter(fileContent);

  // Determine category from slug path
  const parts = slug.split("/");
  const category = parts.length > 1 ? parts[0] : undefined;
  const fileName = parts[parts.length - 1];

  return {
    content,
    frontmatter: data as DocFrontmatter,
    slug,
    category,
    fileName,
  };
}

/**
 * Get all docs in a specific category
 * @param category - Category ID (folder name)
 */
export function getDocsByCategory(category: string): DocContent[] {
  const categoryPath = join(DOCS_PATH, category);

  if (!existsSync(categoryPath) || !isDirectory(categoryPath)) {
    return [];
  }

  const docs: DocContent[] = [];
  const items = readdirSync(categoryPath);

  for (const item of items) {
    if (item.endsWith(".mdx") && !item.startsWith("_")) {
      const fileName = item.replace(/\.mdx$/, "");
      const slug = `${category}/${fileName}`;

      try {
        docs.push(getDocContent(slug));
      } catch (error) {
        logger
          .scope("ContentLoader")
          .error("load", `Error loading doc: ${slug}`, error);
      }
    }
  }

  // Sort by order, then by title
  return docs.sort((a, b) => {
    const orderA = a.frontmatter.order ?? 999;
    const orderB = b.frontmatter.order ?? 999;
    if (orderA !== orderB) return orderA - orderB;
    return a.frontmatter.title.localeCompare(b.frontmatter.title);
  });
}

/**
 * Get all docs with their frontmatter
 * Sorted by category order, then doc order
 */
export function getAllDocs(): DocContent[] {
  const slugs = getAllDocSlugs();

  const docs = slugs
    .map((slug) => {
      try {
        return getDocContent(slug);
      } catch (error) {
        logger
          .scope("ContentLoader")
          .error("load", `Error loading doc: ${slug}`, error);
        return null;
      }
    })
    .filter((doc): doc is DocContent => doc !== null);

  // Sort by order
  return docs.sort((a, b) => {
    // First by category order
    if (a.category !== b.category) {
      const catOrderA = a.category
        ? (loadCategoryMeta(join(DOCS_PATH, a.category)).order ?? 999)
        : 0;
      const catOrderB = b.category
        ? (loadCategoryMeta(join(DOCS_PATH, b.category)).order ?? 999)
        : 0;
      if (catOrderA !== catOrderB) return catOrderA - catOrderB;
    }

    // Then by doc order
    const orderA = a.frontmatter.order ?? 999;
    const orderB = b.frontmatter.order ?? 999;
    return orderA - orderB;
  });
}

/**
 * Check if a doc exists
 */
export function docExists(slug: string): boolean {
  return existsSync(getDocFilePath(slug));
}

/**
 * Get last modified date for a doc
 */
export function getDocLastModified(slug: string): Date | null {
  const filePath = getDocFilePath(slug);

  if (!existsSync(filePath)) {
    return null;
  }

  const stats = statSync(filePath);
  return stats.mtime;
}

/**
 * Extract headings from markdown content for table of contents
 * @param content - Raw markdown content
 * @param maxDepth - Maximum heading depth (2-4, default 3)
 */
export function extractHeadings(
  content: string,
  maxDepth: number = 3,
): TocHeading[] {
  const headingRegex = /^(#{2,4})\s+(.+)$/gm;
  const headings: TocHeading[] = [];
  let match;

  while ((match = headingRegex.exec(content)) !== null) {
    const level = match[1].length;

    // Skip headings deeper than maxDepth
    if (level > maxDepth) continue;

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
 * Get docs directory path
 */
export function getDocsPath(): string {
  return DOCS_PATH;
}
