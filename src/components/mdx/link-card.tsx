/**
 * LinkCard Component
 * A card component for linking to documentation pages or external resources
 *
 * Usage in MDX:
 * <LinkCard
 *   href="/docs/getting-started"
 *   title="Getting Started"
 *   description="Learn the basics of the system"
 *   icon="Lightbulb"
 * />
 *
 * <CardGrid>
 *   <LinkCard href="/docs/assets" title="Assets" icon="Package" />
 *   <LinkCard href="/docs/inventory" title="Inventory" icon="Boxes" />
 * </CardGrid>
 */

"use client";

import Link from "next/link";
import * as LucideIcons from "lucide-react";
import { cn } from "@/lib/utils";
import { ArrowRight, ExternalLink } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface LinkCardProps {
  /** Link destination */
  href: string;
  /** Card title */
  title: string;
  /** Optional description */
  description?: string;
  /** Lucide icon name */
  icon?: string;
  /** Optional custom className */
  className?: string;
}

export function LinkCard({
  href,
  title,
  description,
  icon,
  className,
}: LinkCardProps) {
  const isExternal = href.startsWith("http");
  const Component = isExternal ? "a" : Link;

  // Dynamically get icon component
  const IconComponent = icon
    ? (LucideIcons[icon as keyof typeof LucideIcons] as LucideIcon)
    : null;

  return (
    <Component
      href={href}
      className={cn(
        "group border-border bg-card hover:border-barq-yellow/50 hover:bg-muted/50 flex flex-col rounded-lg border p-4 transition-all",
        className,
      )}
      {...(isExternal && {
        target: "_blank",
        rel: "noopener noreferrer",
      })}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        {IconComponent && (
          <div className="bg-muted group-hover:bg-barq-yellow/10 mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-md transition-colors">
            <IconComponent className="text-muted-foreground group-hover:text-barq-yellow h-5 w-5 transition-colors" />
          </div>
        )}

        <div className="min-w-0 flex-1">
          {/* Title */}
          <div className="flex items-center gap-2">
            <span className="group-hover:text-barq-yellow truncate font-medium transition-colors">
              {title}
            </span>
            {isExternal ? (
              <ExternalLink className="text-muted-foreground h-3.5 w-3.5 shrink-0" />
            ) : (
              <ArrowRight className="text-muted-foreground h-3.5 w-3.5 shrink-0 transition-transform group-hover:translate-x-0.5" />
            )}
          </div>

          {/* Description */}
          {description && (
            <p className="text-muted-foreground mt-1 line-clamp-2 text-sm">
              {description}
            </p>
          )}
        </div>
      </div>
    </Component>
  );
}

interface CardGridProps {
  children: React.ReactNode;
  /** Number of columns (1-4) */
  columns?: 1 | 2 | 3 | 4;
  className?: string;
}

export function CardGrid({ children, columns = 2, className }: CardGridProps) {
  const gridCols = {
    1: "grid-cols-1",
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
  };

  return (
    <div className={cn("my-6 grid gap-4", gridCols[columns], className)}>
      {children}
    </div>
  );
}
