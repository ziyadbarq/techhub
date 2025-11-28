/**
 * Documentation Categories Configuration
 * Defines all documentation categories with metadata
 */

import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import type { CategoryMeta } from "@/lib/docs/types";

/**
 * All documentation categories
 * Order determines display sequence in navigation
 */
export const DOC_CATEGORIES: Record<string, CategoryMeta> = {
  "getting-started": {
    title: "Getting Started",
    description: "Foundation and quick start guides",
    icon: "Lightbulb",
    order: 1,
  },
  "user-guides": {
    title: "User Guides",
    description: "Step-by-step guides for common tasks",
    icon: "BookOpen",
    order: 2,
  },
  "admin-guides": {
    title: "Admin Guides",
    description: "System administration and RBAC",
    icon: "ShieldCheck",
    order: 3,
    requiredPermission: PERMISSIONS.USERS_MANAGE,
  },
  modules: {
    title: "Feature Modules",
    description: "Documentation for specific modules",
    icon: "Puzzle",
    order: 4,
  },
  reference: {
    title: "Reference",
    description: "Quick lookups and field references",
    icon: "Database",
    order: 5,
  },
  troubleshooting: {
    title: "Troubleshooting",
    description: "Common issues and solutions",
    icon: "AlertCircle",
    order: 6,
  },
};

/**
 * Get category metadata by ID
 */
export function getCategoryMeta(categoryId: string): CategoryMeta | undefined {
  return DOC_CATEGORIES[categoryId];
}

/**
 * Get all category IDs in order
 */
export function getCategoryIds(): string[] {
  return Object.entries(DOC_CATEGORIES)
    .sort(([, a], [, b]) => (a.order ?? 999) - (b.order ?? 999))
    .map(([id]) => id);
}
