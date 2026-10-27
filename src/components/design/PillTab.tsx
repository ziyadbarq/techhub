import Link from "next/link";
import type { ReactNode } from "react";

interface PillTabProps {
  href: string;
  active?: boolean;
  children: ReactNode;
}

export function PillTab({ href, active, children }: PillTabProps) {
  return (
    <Link
      href={href}
      className={[
        "inline-flex h-7 items-center rounded-md px-3 text-sm font-medium whitespace-nowrap transition-colors",
        active
          ? "bg-background text-foreground dark:bg-input/30 shadow-sm"
          : "text-muted-foreground hover:text-foreground",
      ].join(" ")}
    >
      {children}
    </Link>
  );
}

export function PillTabs({ children }: { children: ReactNode }) {
  // Segmented control, like TechHub's tab lists.
  return (
    <div className="bg-muted text-muted-foreground inline-flex w-fit flex-wrap items-center gap-1 rounded-lg p-1">
      {children}
    </div>
  );
}
