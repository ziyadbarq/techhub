import type { ReactNode } from "react";

interface SetupLayoutProps {
  children: ReactNode;
}

/**
 * Setup Layout
 * Minimal layout for the initial system setup wizard
 * No sidebar, no dashboard chrome - clean presentation
 */
export default function SetupLayout({ children }: SetupLayoutProps) {
  return <div className="bg-background min-h-screen">{children}</div>;
}
