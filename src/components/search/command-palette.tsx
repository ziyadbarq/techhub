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
  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState<SearchResultDTO[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);

  // Debounced search
  React.useEffect(() => {
    if (!query || query.length < 2) {
      setResults([]);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setIsLoading(true);
      try {
        const response = await globalSearchAction({
          query,
          limit: 5,
        });

        if (response.success && response.data) {
          setResults(response.data);
        } else {
          setResults([]);
        }
      } catch (error) {
        console.error("Search error:", error);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [query]);

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

  // Reset on close
  React.useEffect(() => {
    if (!open) {
      setQuery("");
      setResults([]);
    }
  }, [open]);

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        placeholder="Search assets, people, vendors..."
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        {isLoading ? (
          <div className="text-muted-foreground py-6 text-center text-sm">
            Searching...
          </div>
        ) : (
          <>
            <CommandEmpty>
              {query.length < 2
                ? "Type at least 2 characters to search"
                : "No results found"}
            </CommandEmpty>

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
                        <div className="truncate font-medium">
                          {result.title}
                        </div>
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
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}
