/**
 * Docs Layout
 * Documentation section with responsive sidebar navigation
 *
 * Features:
 * - Dynamic navigation from file system
 * - Permission-filtered content
 * - Mobile hamburger menu
 * - Responsive 3-column layout (nav, content, TOC)
 * - Full-text search with Cmd+K
 */

import type { Metadata } from "next";
import { DocsSidebar } from "@/components/docs/docs-sidebar";
import { DocsHeader } from "@/components/docs/docs-header";
import { ReadingProgress } from "@/components/docs/reading-progress";
import {
  buildNavigation,
  getAllDocs,
  getUserDocPermissions,
  getUserEnabledFeatures,
} from "@/lib/docs";

export const metadata: Metadata = {
  title: "Documentation | Barq Assets",
  description:
    "Complete documentation for Barq Assets CMDB/ITAM system - user guides, workflows, and references",
};

export default async function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Get user permissions and enabled features for filtering
  const [userPermissions, enabledFeatures] = await Promise.all([
    getUserDocPermissions(),
    getUserEnabledFeatures(),
  ]);

  // Build navigation from file system with permission filtering
  const navigation = buildNavigation(
    userPermissions ?? undefined,
    enabledFeatures,
  );

  // Prepare docs data for search (also filtered by permissions)
  const allDocs = getAllDocs();
  const docsForSearch = allDocs
    .filter((doc) => {
      // Filter by permission
      const requiredPermission = doc.frontmatter.requiredPermission;
      if (requiredPermission && userPermissions) {
        if (!userPermissions.includes(requiredPermission as never)) {
          return false;
        }
      }

      // Filter by feature flag
      const requiredFeature = doc.frontmatter.featureFlag;
      if (requiredFeature && enabledFeatures) {
        if (!enabledFeatures.includes(requiredFeature)) {
          return false;
        }
      }

      return true;
    })
    .map((doc) => ({
      slug: doc.slug,
      title: doc.frontmatter.title,
      description: doc.frontmatter.description,
      content: doc.content,
    }));

  return (
    <>
      {/* Reading progress bar */}
      <ReadingProgress />

      <div className="container mx-auto max-w-7xl px-4 py-6">
        {/* Mobile Header - visible on mobile/tablet */}
        <DocsHeader navigation={navigation} searchDocs={docsForSearch} />

        <div className="flex gap-8">
          {/* Left Sidebar - Desktop Navigation */}
          <DocsSidebar navigation={navigation} searchDocs={docsForSearch} />

          {/* Main Content */}
          <main className="min-w-0 flex-1">{children}</main>
        </div>
      </div>
    </>
  );
}
