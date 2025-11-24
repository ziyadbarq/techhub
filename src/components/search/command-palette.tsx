"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  FileText,
  User,
  Building2,
  Server,
  FileCheck,
  Package,
  Loader2,
} from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { globalSearchAction } from "@/interface-adapters/controllers/search.controller";
import type { SearchResultDTO } from "@/interface-adapters/dtos/search.dto";
import { getVisibleNavGroups, type NavItem } from "@/config/navigation";
import { usePermissions } from "@/hooks/use-permissions";
import { useFeatureFlags } from "@/hooks/use-feature-flags";

// Entity type icons mapping
const ENTITY_ICONS = {
  asset: FileText,
  person: User,
  vendor: Building2,
  "configuration-item": Server,
  contract: FileCheck,
  "license-product": Package,
  "asset-category": FileText,
  "asset-model": FileText,
  location: Building2,
  "stock-location": Building2,
} as const;

// Entity type display names
const ENTITY_LABELS = {
  asset: "Assets",
  person: "People",
  vendor: "Vendors",
  "configuration-item": "Configuration Items",
  contract: "Contracts",
  "license-product": "License Products",
  "asset-category": "Asset Categories",
  "asset-model": "Asset Models",
  location: "Locations",
  "stock-location": "Stock Locations",
} as const;

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const router = useRouter();
  const {
    permissions,
    isLoading: permissionsLoading,
    isError: permissionsError,
    hasNoPermissions,
  } = usePermissions();
  const { enabledFeatures, isLoading: featuresLoading } = useFeatureFlags();
  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState<SearchResultDTO[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const trimmedQuery = query.trim().toLowerCase();
  const requestIdRef = React.useRef(0);

  // Debounced search
  React.useEffect(() => {
    if (!trimmedQuery || trimmedQuery.length < 2) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    const timeoutId = setTimeout(async () => {
      const requestId = ++requestIdRef.current;
      setIsLoading(true);
      try {
        const response = await globalSearchAction({
          query: trimmedQuery,
          limit: 5,
        });

        if (requestId === requestIdRef.current) {
          if (response.success && response.data) {
            setResults(response.data);
          } else {
            setResults([]);
          }
        }
      } catch (error) {
        console.error("Search error:", error);
        if (requestId === requestIdRef.current) {
          setResults([]);
        }
      } finally {
        if (requestId === requestIdRef.current) {
          setIsLoading(false);
        }
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [trimmedQuery]);

  // Group results by entity type
  const groupedResults = React.useMemo(() => {
    const grouped: Record<string, SearchResultDTO[]> = {};
    for (const result of results) {
      if (!grouped[result.entityType]) {
        grouped[result.entityType] = [];
      }
      grouped[result.entityType].push(result);
    }
    return grouped;
  }, [results]);

  // Handle result selection
  const handleSelect = (url: string) => {
    router.push(url);
    onOpenChange(false);
    setQuery("");
    setResults([]);
  };

  // Visible navigation items filtered by permissions, feature flags, and query
  const visibleNavItems = React.useMemo(() => {
    if (
      permissionsLoading ||
      featuresLoading ||
      permissionsError ||
      hasNoPermissions
    ) {
      return [];
    }

    const flattenItems = (items: NavItem[]): NavItem[] =>
      items.flatMap((item) => {
        const { children, ...rest } = item;
        if (children && children.length > 0) {
          return [rest, ...flattenItems(children)];
        }
        return [rest];
      });

    return getVisibleNavGroups(permissions, { enabledFeatures }).flatMap(
      (group) => flattenItems(group.items),
    );
  }, [
    permissions,
    enabledFeatures,
    permissionsLoading,
    featuresLoading,
    permissionsError,
    hasNoPermissions,
  ]);

  const navigationResults = React.useMemo(() => {
    if (!trimmedQuery) return [];

    return visibleNavItems.filter((item) => {
      const haystack =
        `${item.title} ${item.description ?? ""} ${item.href}`.toLowerCase();
      return haystack.includes(trimmedQuery);
    });
  }, [trimmedQuery, visibleNavItems]);

  // Reset on close
  React.useEffect(() => {
    if (!open) {
      setQuery("");
      setResults([]);
    }
  }, [open]);

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <div className="relative">
        <CommandInput
          placeholder="Search navigation, assets, people..."
          value={query}
          onValueChange={setQuery}
        />
        {isLoading && (
          <Loader2 className="text-muted-foreground absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 animate-spin" />
        )}
      </div>
      <CommandList className="max-h-[60vh] min-h-[260px] overflow-y-auto">
        <CommandEmpty>
          {!trimmedQuery
            ? "Start typing to search navigation or records"
            : trimmedQuery.length < 2
              ? "Keep typing to search records (min 2 characters)"
              : "No results found"}
        </CommandEmpty>

        {navigationResults.length > 0 && (
          <CommandGroup heading="Navigation">
            {navigationResults.map((item) => {
              const Icon = item.icon || Search;
              return (
                <CommandItem
                  key={`nav-${item.href}`}
                  value={`${item.title} ${item.description ?? ""} ${item.href}`}
                  onSelect={() => handleSelect(item.href)}
                  className="flex items-center gap-2 px-2 py-3"
                >
                  <Icon className="h-4 w-4 shrink-0 opacity-50" />
                  <div className="flex flex-col gap-0.5 overflow-hidden">
                    <div className="truncate font-medium">{item.title}</div>
                    <div className="text-muted-foreground truncate text-xs">
                      {item.description ?? item.href}
                    </div>
                  </div>
                </CommandItem>
              );
            })}
          </CommandGroup>
        )}

        {Object.entries(groupedResults).map(([entityType, items]) => {
          const Icon =
            ENTITY_ICONS[entityType as keyof typeof ENTITY_ICONS] || Search;
          const label =
            ENTITY_LABELS[entityType as keyof typeof ENTITY_LABELS] ||
            entityType;

          return (
            <CommandGroup key={entityType} heading={label}>
              {items.map((result) => (
                <CommandItem
                  key={`${result.entityType}-${result.id}`}
                  value={`${result.title} ${result.subtitle || ""}`}
                  onSelect={() => handleSelect(result.url)}
                  className="flex items-center gap-2 px-2 py-3"
                >
                  <Icon className="h-4 w-4 shrink-0 opacity-50" />
                  <div className="flex flex-col gap-0.5 overflow-hidden">
                    <div className="truncate font-medium">{result.title}</div>
                    {result.subtitle && (
                      <div className="text-muted-foreground truncate text-xs">
                        {result.subtitle}
                      </div>
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          );
        })}
      </CommandList>
    </CommandDialog>
  );
}
