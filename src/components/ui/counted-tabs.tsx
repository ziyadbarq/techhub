/**
 * Counted Tabs
 *
 * Shared tab renderer that hides tabs when their count is zero (after counts are
 * loaded) and keeps them visible while loading so the layout does not jump.
 */

"use client";

import { useState, type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

export interface CountedTabConfig {
  value: string;
  label: string;
  content: ReactNode;
  icon?: LucideIcon;
  count?: number | null;
  canView?: boolean;
  showWhenZero?: boolean;
  triggerClassName?: string;
}

interface CountedTabsProps {
  tabs: CountedTabConfig[];
  defaultValue: string;
  loading?: boolean;
  tabsClassName?: string;
  listClassName?: string;
}

export function CountedTabs({
  tabs,
  defaultValue,
  loading = false,
  tabsClassName,
  listClassName,
}: CountedTabsProps) {
  // null until the user picks a tab. Until then the active tab is derived on
  // every render, so a requested tab (e.g. ?tab=attachments) that only
  // becomes visible once permissions load is still the one that opens.
  const [selected, setSelected] = useState<string | null>(null);

  const visibleTabs = tabs.filter((tab) => {
    if (tab.canView === false) return false;

    const countValue = tab.count ?? 0;
    const hideForZero =
      !loading && tab.showWhenZero !== true && countValue <= 0;

    return !hideForZero;
  });

  const safeDefaultValue = visibleTabs.find((tab) => tab.value === defaultValue)
    ? defaultValue
    : visibleTabs[0]?.value || defaultValue;

  const activeValue =
    selected && visibleTabs.some((tab) => tab.value === selected)
      ? selected
      : safeDefaultValue;

  return (
    <Tabs
      value={activeValue}
      onValueChange={setSelected}
      className={tabsClassName}
    >
      <TabsList className={cn("flex-wrap", listClassName)}>
        {visibleTabs.map((tab) => {
          const Icon = tab.icon;
          const showBadge = typeof tab.count === "number" && tab.count > 0;

          return (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className={cn("gap-2", tab.triggerClassName)}
            >
              {Icon && <Icon className="h-4 w-4" />}
              <span>{tab.label}</span>
              {showBadge && (
                <Badge variant="secondary" className="ml-1 h-5 px-2 text-xs">
                  {tab.count}
                </Badge>
              )}
            </TabsTrigger>
          );
        })}
      </TabsList>

      {visibleTabs.map((tab) => (
        <TabsContent key={tab.value} value={tab.value}>
          {tab.content}
        </TabsContent>
      ))}
    </Tabs>
  );
}
