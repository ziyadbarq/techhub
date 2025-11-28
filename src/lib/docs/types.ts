/**
 * Documentation System Types
 * TypeScript interfaces for the documentation system
 */

import type { PermissionKey } from "@/core/domain/value-objects/permission-key";

/**
 * Enhanced frontmatter schema for documentation pages
 */
export interface DocFrontmatter {
  // Required fields
  title: string;
  description: string;

  // Navigation
  icon?: string; // Lucide icon name
  order?: number; // Sort order within category (lower = higher)

  // Role/Feature gating
  requiredPermission?: PermissionKey; // Server-side permission check
  featureFlag?: string; // Feature flag check

  // Task-oriented metadata
  taskType?: "how-to" | "reference" | "troubleshooting" | "concept";
  estimatedTime?: string; // e.g., "5 minutes"
  relatedDocs?: string[]; // Slugs of related docs

  // Search enhancement
  keywords?: string[]; // Additional search terms
  searchBoost?: number; // 1-10, higher = more prominent in search

  // Maintenance
  lastReviewedDate?: string; // ISO date string

  // Allow additional fields
  [key: string]: unknown;
}

/**
 * Category metadata from _meta.ts files
 */
export interface CategoryMeta {
  title: string;
  description?: string;
  icon?: string; // Lucide icon name
  order?: number; // Category sort order
  collapsed?: boolean; // Start collapsed in nav
  requiredPermission?: PermissionKey; // Gate entire category
  featureFlag?: string; // Feature flag for category
}

/**
 * Parsed document content with metadata
 */
export interface DocContent {
  content: string;
  frontmatter: DocFrontmatter;
  slug: string; // Full slug path (e.g., "user-guides/assets")
  category?: string; // Category ID (e.g., "user-guides")
  fileName: string; // File name without extension (e.g., "assets")
}

/**
 * Navigation item for a single document
 */
export interface DocNavItem {
  title: string;
  slug: string;
  href: string;
  icon?: string;
  description?: string;
  order: number;
  requiredPermission?: PermissionKey;
  featureFlag?: string;
  isNew?: boolean;
  taskType?: DocFrontmatter["taskType"];
}

/**
 * Navigation category containing documents
 */
export interface DocNavCategory {
  id: string;
  title: string;
  description?: string;
  icon?: string;
  order: number;
  collapsed?: boolean;
  requiredPermission?: PermissionKey;
  featureFlag?: string;
  items: DocNavItem[];
}

/**
 * Full navigation structure
 */
export interface DocsNavigation {
  categories: DocNavCategory[];
}

/**
 * Table of contents heading
 */
export interface TocHeading {
  id: string;
  text: string;
  level: number; // 2, 3, or 4
}

/**
 * Search result item
 */
export interface DocSearchResult {
  slug: string;
  title: string;
  description: string;
  category?: string;
  categoryTitle?: string;
  excerpt?: string; // Highlighted excerpt containing match
  score: number;
  icon?: string;
}

/**
 * Search options
 */
export interface DocSearchOptions {
  query: string;
  limit?: number;
  userPermissions?: PermissionKey[];
  enabledFeatures?: string[];
}

/**
 * Reading time result
 */
export interface ReadingTime {
  minutes: number;
  words: number;
  text: string; // e.g., "5 min read"
}

/**
 * Pagination context for previous/next navigation
 */
export interface DocPagination {
  previous: DocNavItem | null;
  next: DocNavItem | null;
}

/**
 * Full document context for rendering
 */
export interface DocContext {
  doc: DocContent;
  navigation: DocsNavigation;
  pagination: DocPagination;
  toc: TocHeading[];
  readingTime: ReadingTime;
  lastModified: Date | null;
}
