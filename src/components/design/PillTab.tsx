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
        "inline-flex h-9 items-center rounded-full px-4 text-[14px] font-medium transition-colors",
        active
          ? "bg-[var(--color-ink)] text-white border border-[var(--color-ink)]"
          : "bg-[var(--color-canvas)] text-[var(--color-steel)] border border-[var(--color-hairline)] hover:text-[var(--color-ink)]",
      ].join(" ")}
    >
      {children}
    </Link>
  );
}

export function PillTabs({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap items-center gap-2">{children}</div>;
}
