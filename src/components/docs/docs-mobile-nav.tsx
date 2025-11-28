"use client";

/**
 * Docs Mobile Navigation
 * Sheet-based mobile navigation for documentation
 */

import { useState, createElement } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, ChevronDown, ChevronRight, BookOpen } from "lucide-react";
import * as LucideIcons from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import type {
  DocsNavigation,
  DocNavCategory,
  DocNavItem,
} from "@/lib/docs/types";

interface DocsMobileNavProps {
  navigation: DocsNavigation;
  className?: string;
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

function CategoryItem({
  item,
  pathname,
  onNavigate,
}: {
  item: DocNavItem;
  pathname: string;
  onNavigate: () => void;
}) {
  const isActive = pathname === `/docs/${item.slug}`;

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={cn(
        "flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors",
        isActive
          ? "bg-barq-yellow/10 text-barq-yellow font-medium"
          : "text-muted-foreground hover:bg-accent hover:text-foreground",
      )}
    >
      {renderIcon(item.icon, "h-4 w-4 shrink-0")}
      <span className="truncate">{item.title}</span>
    </Link>
  );
}

function CategoryGroup({
  category,
  pathname,
  onNavigate,
}: {
  category: DocNavCategory;
  pathname: string;
  onNavigate: () => void;
}) {
  const [isExpanded, setIsExpanded] = useState(true);
  const hasActiveItem = category.items.some(
    (item) => pathname === `/docs/${item.slug}`,
  );

  return (
    <div className="space-y-1">
      {/* Category Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          "flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors",
          hasActiveItem
            ? "bg-barq-yellow/10 text-barq-yellow"
            : "text-foreground hover:bg-accent",
        )}
      >
        <div className="flex items-center gap-2">
          {renderIcon(category.icon, "h-4 w-4")}
          <span>{category.title}</span>
        </div>
        {isExpanded ? (
          <ChevronDown className="h-4 w-4" />
        ) : (
          <ChevronRight className="h-4 w-4" />
        )}
      </button>

      {/* Category Items */}
      {isExpanded && (
        <div className="ml-4 space-y-1 border-l pl-3">
          {category.items.map((item) => (
            <CategoryItem
              key={item.slug}
              item={item}
              pathname={pathname}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function DocsMobileNav({ navigation, className }: DocsMobileNavProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const handleNavigate = () => {
    setIsOpen(false);
  };

  return (
    <div className={cn("lg:hidden", className)}>
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" className="shrink-0">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle documentation menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-80 p-0">
          <SheetHeader className="border-b px-4 py-3">
            <SheetTitle className="flex items-center gap-2 text-left">
              <BookOpen className="text-barq-yellow h-5 w-5" />
              Documentation
            </SheetTitle>
          </SheetHeader>
          <ScrollArea className="h-[calc(100vh-65px)]">
            <nav className="space-y-4 p-4">
              {navigation.categories.map((category) => (
                <CategoryGroup
                  key={category.id}
                  category={category}
                  pathname={pathname}
                  onNavigate={handleNavigate}
                />
              ))}
            </nav>
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </div>
  );
}
