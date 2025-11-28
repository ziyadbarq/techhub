/**
 * Documentation System
 * Barrel export for all documentation utilities
 */

// Types
export type {
  DocFrontmatter,
  CategoryMeta,
  DocContent,
  DocNavItem,
  DocNavCategory,
  DocsNavigation,
  TocHeading,
  DocSearchResult,
  DocSearchOptions,
  ReadingTime,
  DocPagination,
  DocContext,
} from "./types";

// Content Loading
export {
  getAllCategories,
  getAllDocSlugs,
  getDocContent,
  getDocsByCategory,
  getAllDocs,
  docExists,
  getDocLastModified,
  extractHeadings,
  loadCategoryMeta,
  getDocsPath,
} from "./content-loader";

// Navigation Building
export {
  buildNavigation,
  getFlatNavItems,
  getDocPagination,
  findNavItem,
  findCategoryForDoc,
  getDocBreadcrumbs,
  getDocsNavigation,
} from "./navigation-builder";

// Reading Time
export { calculateReadingTime, getReadingTime } from "./reading-time";

// Glossary & Search Enhancement
export {
  DOCS_GLOSSARY,
  expandSearchQuery,
  getCanonicalTerm,
  matchesGlossaryTerms,
} from "./glossary";

// Permissions (server-side only)
export {
  getUserDocPermissions,
  canAccessDoc,
  getUserEnabledFeatures,
} from "./permissions";
