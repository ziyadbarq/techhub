"use client";

import { Suspense, useSyncExternalStore, type ReactNode } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { ErrorBoundary } from "@/components/error-boundary";
import { GlobalLoading } from "@/components/global-loading";
import { CommandPaletteProvider } from "@/components/search/command-palette-provider";
import { FeatureFlagsProvider } from "@/contexts/feature-flags-context";
import { SidebarSkeleton } from "@/components/layout/sidebar/SidebarSkeleton";
import { HeaderSkeleton } from "@/components/layout/HeaderSkeleton";

// Hydration detection using useSyncExternalStore (React 18+ recommended pattern)
// This fixes "Cannot read properties of null (reading 'useRef')" errors
// that occur when Better-Auth's useSession() is called before React is ready
const emptySubscribe = () => () => {};

function useHydrated(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true, // Client: always hydrated
    () => false, // Server: not hydrated
  );
}

export function DashboardLayoutClient({ children }: { children: ReactNode }) {
  const isHydrated = useHydrated();

  if (!isHydrated) {
    return <GlobalLoading />;
  }

  // Check if we're on a special page that needs full-width layout (no padding/max-width)
  // Add your special routes here (e.g., editor pages, canvas pages, etc.)
  const isFullWidthPage = false; // Modify this based on your needs

  // Apply padding and max-width to all pages except special full-width pages
  const mainClasses = isFullWidthPage
    ? "flex-1 overflow-y-auto bg-muted/40"
    : "flex-1 overflow-y-auto bg-muted/40 p-4 md:p-6 lg:p-8";

  return (
    <ErrorBoundary>
      <FeatureFlagsProvider>
        <CommandPaletteProvider>
          <div className="bg-background relative flex min-h-screen">
            {/* Sidebar with Suspense for non-blocking load */}
            <Suspense fallback={<SidebarSkeleton />}>
              <Sidebar />
            </Suspense>

            {/* Main Content Area */}
            <div className="flex min-h-screen flex-1 flex-col">
              {/* Header with Suspense for non-blocking load */}
              <Suspense fallback={<HeaderSkeleton />}>
                <Header />
              </Suspense>

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
      </FeatureFlagsProvider>
    </ErrorBoundary>
  );
}
