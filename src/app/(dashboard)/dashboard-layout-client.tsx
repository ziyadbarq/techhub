"use client";

import type { ReactNode } from "react";
import { Suspense, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { ErrorBoundary } from "@/components/error-boundary";
import { GlobalLoading } from "@/components/global-loading";
import { CommandPaletteProvider } from "@/components/search/command-palette-provider";

export function DashboardLayoutClient({ children }: { children: ReactNode }) {
  const _pathname = usePathname();
  const [isMounted, setIsMounted] = useState(false);

  // Only render after client-side hydration to avoid SSR issues with auth hooks
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsMounted(true);
  }, []);

  // Check if we're on a special page that needs full-width layout (no padding/max-width)
  // Add your special routes here (e.g., editor pages, canvas pages, etc.)
  const isFullWidthPage = false; // Modify this based on your needs

  // Apply padding and max-width to all pages except special full-width pages
  const mainClasses = isFullWidthPage
    ? "flex-1 overflow-y-auto bg-muted/40"
    : "flex-1 overflow-y-auto bg-muted/40 p-4 md:p-6 lg:p-8";

  // Show loading state during SSR/hydration
  if (!isMounted) {
    return <GlobalLoading />;
  }

  return (
    <ErrorBoundary>
      <CommandPaletteProvider>
        <div className="bg-background relative flex min-h-screen">
          {/* Sidebar - Manages its own responsive state */}
          <Sidebar />

          {/* Main Content Area */}
          <div className="flex min-h-screen flex-1 flex-col">
            {/* Header with breadcrumbs and user actions */}
            <Header />

            {/* Page Content */}
            <main className={mainClasses}>
              {isFullWidthPage ? (
                <Suspense fallback={<GlobalLoading />}>{children}</Suspense>
              ) : (
                <div className="mx-auto max-w-7xl">
                  <Suspense fallback={<GlobalLoading />}>{children}</Suspense>
                </div>
              )}
            </main>
          </div>
        </div>
      </CommandPaletteProvider>
    </ErrorBoundary>
  );
}
