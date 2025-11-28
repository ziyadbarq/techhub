/**
 * Documentation Navigation Builder
 * Builds navigation structure from file system and filters by permissions
 */

import { join } from "path";
import type { PermissionKey } from "@/core/domain/value-objects/permission-key";
import type {
  DocsNavigation,
  DocNavCategory,
  DocNavItem,
  DocPagination,
  DocContent,
} from "./types";
import {
  getAllCategories,
  loadCategoryMeta,
  getDocsByCategory,
  getAllDocs,
  getDocsPath,
} from "./content-loader";

/**
 * Build a navigation item from a doc
 */
function buildNavItem(doc: DocContent): DocNavItem {
  return {
    title: doc.frontmatter.title,
    slug: doc.slug,
    href: `/docs/${doc.slug}`,
    icon: doc.frontmatter.icon,
    description: doc.frontmatter.description,
    order: doc.frontmatter.order ?? 999,
    requiredPermission: doc.frontmatter.requiredPermission as
      | PermissionKey
      | undefined,
    featureFlag: doc.frontmatter.featureFlag,
    taskType: doc.frontmatter.taskType,
  };
}

/**
 * Check if a user has permission to view a doc or category
 */
function hasPermission(
  requiredPermission: PermissionKey | undefined,
  userPermissions: PermissionKey[] | undefined,
): boolean {
  if (!requiredPermission) return true;
  if (!userPermissions) return true; // No filtering if permissions not provided
  return userPermissions.includes(requiredPermission);
}

/**
 * Check if a feature flag is enabled
 */
function isFeatureEnabled(
  featureFlag: string | undefined,
  enabledFeatures: string[] | undefined,
): boolean {
  if (!featureFlag) return true;
  if (!enabledFeatures) return true; // No filtering if features not provided
  return enabledFeatures.includes(featureFlag);
}

/**
 * Build full navigation structure from file system
 * Optionally filters by user permissions and enabled features
 */
export function buildNavigation(
  userPermissions?: PermissionKey[],
  enabledFeatures?: string[],
): DocsNavigation {
  const categories = getAllCategories();
  const navCategories: DocNavCategory[] = [];

  for (const categoryId of categories) {
    const categoryPath = join(getDocsPath(), categoryId);
    const meta = loadCategoryMeta(categoryPath);

    // Check category-level permission
    if (
      !hasPermission(
        meta.requiredPermission as PermissionKey | undefined,
        userPermissions,
      )
    ) {
      continue;
    }

    // Check category-level feature flag
    if (!isFeatureEnabled(meta.featureFlag, enabledFeatures)) {
      continue;
    }

    // Get docs in this category
    const docs = getDocsByCategory(categoryId);

    // Filter docs by permissions and features
    const filteredDocs = docs.filter((doc) => {
      const docPermission = doc.frontmatter.requiredPermission as
        | PermissionKey
        | undefined;
      const docFeature = doc.frontmatter.featureFlag;

      return (
        hasPermission(docPermission, userPermissions) &&
        isFeatureEnabled(docFeature, enabledFeatures)
      );
    });

    // Only include category if it has visible docs
    if (filteredDocs.length === 0) continue;

    const items: DocNavItem[] = filteredDocs.map(buildNavItem);

    navCategories.push({
      id: categoryId,
      title: meta.title,
      description: meta.description,
      icon: meta.icon,
      order: meta.order ?? 999,
      collapsed: meta.collapsed,
      requiredPermission: meta.requiredPermission as PermissionKey | undefined,
      featureFlag: meta.featureFlag,
      items,
    });
  }

  // Sort categories by order
  navCategories.sort((a, b) => a.order - b.order);

  return { categories: navCategories };
}

/**
 * Get a flat list of all navigation items (for search and pagination)
 */
export function getFlatNavItems(navigation: DocsNavigation): DocNavItem[] {
  const items: DocNavItem[] = [];

  for (const category of navigation.categories) {
    items.push(...category.items);
  }

  return items;
}

/**
 * Get pagination (previous/next) for a specific doc
 */
export function getDocPagination(
  currentSlug: string,
  navigation: DocsNavigation,
): DocPagination {
  const flatItems = getFlatNavItems(navigation);
  const currentIndex = flatItems.findIndex((item) => item.slug === currentSlug);

  if (currentIndex === -1) {
    return { previous: null, next: null };
  }

  return {
    previous: currentIndex > 0 ? flatItems[currentIndex - 1] : null,
    next:
      currentIndex < flatItems.length - 1 ? flatItems[currentIndex + 1] : null,
  };
}

/**
 * Find a navigation item by slug
 */
export function findNavItem(
  slug: string,
  navigation: DocsNavigation,
): DocNavItem | null {
  for (const category of navigation.categories) {
    const item = category.items.find((item) => item.slug === slug);
    if (item) return item;
  }
  return null;
}

/**
 * Find the category for a doc slug
 */
export function findCategoryForDoc(
  slug: string,
  navigation: DocsNavigation,
): DocNavCategory | null {
  for (const category of navigation.categories) {
    if (category.items.some((item) => item.slug === slug)) {
      return category;
    }
  }
  return null;
}

/**
 * Get breadcrumb items for a doc
 */
export function getDocBreadcrumbs(
  slug: string,
  navigation: DocsNavigation,
): Array<{ title: string; href: string }> {
  const breadcrumbs: Array<{ title: string; href: string }> = [
    { title: "Home", href: "/dashboard" },
    { title: "Documentation", href: "/docs" },
  ];

  const category = findCategoryForDoc(slug, navigation);
  if (category) {
    breadcrumbs.push({
      title: category.title,
      href: `/docs?category=${category.id}`,
    });
  }

  const item = findNavItem(slug, navigation);
  if (item) {
    breadcrumbs.push({
      title: item.title,
      href: item.href,
    });
  }

  return breadcrumbs;
}

/**
 * Legacy function for backward compatibility
 * Returns docs formatted for the old navigation structure
 */
export function getDocsNavigation(): DocNavItem[] {
  const docs = getAllDocs();
  return docs.map(buildNavItem);
}
