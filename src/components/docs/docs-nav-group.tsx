"use client";

/**
 * Docs Navigation Group
 * Collapsible category group for documentation navigation
 */

import { useState, createElement } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, ChevronRight, BookOpen } from "lucide-react";
import * as LucideIcons from "lucide-react";
import { cn } from "@/lib/utils";
import type { DocNavCategory, DocNavItem } from "@/lib/docs/types";

interface DocsNavGroupProps {
  category: DocNavCategory;
  defaultExpanded?: boolean;
}

// Render icon by name using createElement to avoid static component rules
function renderIcon(iconName: string | undefined, className?: string) {
  if (!iconName) {
    return createElement(BookOpen, { className });
  }
  const IconComponent = (LucideIcons as Record<string, unknown>)[iconName];
  if (typeof IconComponent === "function") {
    return createElement(
      IconComponent as React.ComponentType<{ className?: string }>,
      { className },
    );
  }
  return createElement(BookOpen, { className });
}

function NavItem({ item, isActive }: { item: DocNavItem; isActive: boolean }) {
  return (
    <Link
      href={item.href}
      className={cn(
        "group flex items-start gap-3 rounded-xl px-3 py-2 text-sm transition-colors",
        isActive
          ? "text-foreground bg-emerald-400/10 shadow-[0_10px_30px_-24px_rgba(16,185,129,0.8)] ring-1 ring-emerald-400/30"
          : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
      )}
    >
      {renderIcon(
        item.icon,
        cn(
          "mt-0.5 h-4 w-4 shrink-0 transition-colors",
          isActive
            ? "text-emerald-300"
            : "text-muted-foreground group-hover:text-foreground",
        ),
      )}
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className={cn("truncate", isActive && "font-semibold")}>
          {item.title}
        </span>
        {item.description && (
          <span className="text-muted-foreground line-clamp-2 text-xs">
            {item.description}
          </span>
        )}
      </div>
    </Link>
  );
}

export function DocsNavGroup({
  category,
  defaultExpanded = true,
}: DocsNavGroupProps) {
  const pathname = usePathname();
  const [isExpanded, setIsExpanded] = useState(
    category.collapsed ? false : defaultExpanded,
  );

  const hasActiveItem = category.items.some(
    (item) => pathname === `/docs/${item.slug}`,
  );

  // Auto-expand if an item is active
  const effectiveExpanded = hasActiveItem || isExpanded;

  return (
    <div className="space-y-1">
      {/* Category Header */}
      <button
        onClick={() => setIsExpanded(!effectiveExpanded)}
        className={cn(
          "flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm font-semibold tracking-tight transition-colors",
          hasActiveItem
            ? "text-emerald-200"
            : "text-foreground hover:bg-accent/60",
        )}
        aria-expanded={effectiveExpanded}
      >
        <div className="flex items-center gap-2">
          {renderIcon(
            category.icon,
            cn(
              "h-4 w-4",
              hasActiveItem ? "text-emerald-300" : "text-muted-foreground",
            ),
          )}
          <span>{category.title}</span>
        </div>
        {effectiveExpanded ? (
          <ChevronDown className="text-muted-foreground h-4 w-4" />
        ) : (
          <ChevronRight className="text-muted-foreground h-4 w-4" />
        )}
      </button>

      {/* Category Items */}
      {effectiveExpanded && (
        <div className="border-border/60 ml-2 space-y-0.5 border-l pl-2">
          {category.items.map((item) => {
            const isActive = pathname === `/docs/${item.slug}`;
            return <NavItem key={item.slug} item={item} isActive={isActive} />;
          })}
        </div>
      )}
    </div>
  );
}
