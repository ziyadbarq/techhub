"use client";

/**
 * Docs Navigation
 * Sidebar navigation for documentation pages
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  BookOpen,
  Database,
  GitBranch,
  ShieldCheck,
  Lightbulb,
} from "lucide-react";

const docsNavItems = [
  {
    title: "Getting Started",
    href: "/docs/getting-started/overview",
    icon: Lightbulb,
    description: "Foundation layer and data management basics",
  },
  {
    title: "Workflows",
    href: "/docs/user-guides/workflows",
    icon: GitBranch,
    description: "Common workflows and step-by-step guides",
  },
  {
    title: "Admin Guide",
    href: "/docs/admin-guides/overview",
    icon: ShieldCheck,
    description: "RBAC, permissions, and user management",
  },
  {
    title: "Entity Reference",
    href: "/docs/reference/entities",
    icon: Database,
    description: "Complete guide to all entities and their fields",
  },
];

export function DocsNav() {
  const pathname = usePathname();

  return (
    <nav className="space-y-1">
      <div className="mb-4 flex items-center gap-2 px-3 text-sm font-semibold">
        <BookOpen className="h-4 w-4" />
        <span>Documentation</span>
      </div>

      {docsNavItems.map((item) => {
        const Icon = item.icon;
        const isActive =
          pathname === item.href || pathname?.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-start gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
              isActive
                ? "bg-barq-yellow/10 text-barq-yellow font-medium"
                : "text-muted-foreground hover:bg-accent hover:text-foreground",
            )}
          >
            <Icon
              className={cn(
                "mt-0.5 h-4 w-4 shrink-0",
                isActive ? "text-barq-yellow" : "",
              )}
            />
            <div className="flex flex-col gap-1">
              <span className={isActive ? "font-semibold" : ""}>
                {item.title}
              </span>
              <span className="text-muted-foreground text-xs">
                {item.description}
              </span>
            </div>
          </Link>
        );
      })}
    </nav>
  );
}
