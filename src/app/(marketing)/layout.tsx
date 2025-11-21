import type { ReactNode } from "react";

interface MarketingLayoutProps {
  children: ReactNode;
}

/**
 * Marketing Layout
 * Minimal layout for public-facing pages (landing page, etc.)
 * No sidebar, no dashboard chrome - clean presentation
 */
export default function MarketingLayout({ children }: MarketingLayoutProps) {
  return <div className="bg-background min-h-screen">{children}</div>;
}
