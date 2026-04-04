"use client";

import { Suspense, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { ErrorBoundary } from "@/components/error-boundary";
import { GlobalLoading } from "@/components/global-loading";
import { CommandPaletteProvider } from "@/components/search/command-palette-provider";
import { FeatureFlagsProvider } from "@/contexts/feature-flags-context";
import { PermissionsProvider } from "@/contexts/permissions-context";
import { RolePreviewProvider } from "@/contexts/role-preview-context";
import { SessionProvider } from "@/contexts/session-context";
import { SidebarSkeleton } from "@/components/layout/sidebar/SidebarSkeleton";
import { HeaderSkeleton } from "@/components/layout/HeaderSkeleton";

export function DashboardLayoutClient({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const hideSidebar =
    pathname?.startsWith("/settings") || pathname?.startsWith("/docs");

  const isDocsPage = pathname?.startsWith("/docs");

  const mainClasses = isDocsPage
    ? "flex-1 overflow-y-auto bg-muted/40"
    : "flex-1 overflow-y-auto bg-muted/40 p-4 md:p-6 lg:p-8";

  return (
    <ErrorBoundary>
      <SessionProvider>
        <RolePreviewProvider>
          <PermissionsProvider>
            <FeatureFlagsProvider>
              <CommandPaletteProvider>
                <div className="bg-background relative flex min-h-screen">
                  {/* Sidebar with Suspense for non-blocking load */}
                  {!hideSidebar ? (
                    <Suspense fallback={<SidebarSkeleton />}>
                      <Sidebar />
                    </Suspense>
                  ) : null}

                  {/* Main Content Area */}
                  <div className="flex min-h-screen flex-1 flex-col">
                    {/* Header with Suspense for non-blocking load */}
                    <Suspense fallback={<HeaderSkeleton />}>
                      <Header />
                    </Suspense>

                    {/* Page Content */}
                    <main className={mainClasses}>
                      <Suspense fallback={<GlobalLoading />}>
                        {children}
                      </Suspense>
                    </main>
                  </div>
                </div>
              </CommandPaletteProvider>
            </FeatureFlagsProvider>
          </PermissionsProvider>
        </RolePreviewProvider>
      </SessionProvider>
    </ErrorBoundary>
  );
}
