"use client";

/**
 * Documentation Search Component
 * Client-side search through documentation content
 */

import { useState, useEffect, useCallback } from "react";
import { Search as SearchIcon, X, FileText } from "lucide-react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface SearchResult {
  slug: string;
  title: string;
  description: string;
  excerpt: string;
}

interface SearchProps {
  docs: Array<{
    slug: string;
    title: string;
    description: string;
    content: string;
  }>;
}

export function Search({ docs }: SearchProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const router = useRouter();

  // Open search with Cmd+K or Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen(true);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Search function
  const performSearch = useCallback(
    (searchQuery: string) => {
      if (!searchQuery.trim()) {
        setResults([]);
        return;
      }

      const lowerQuery = searchQuery.toLowerCase();
      const searchResults = docs
        .map((doc) => {
          const titleMatch = doc.title.toLowerCase().includes(lowerQuery);
          const descMatch = doc.description.toLowerCase().includes(lowerQuery);
          const contentMatch = doc.content.toLowerCase().includes(lowerQuery);

          if (!titleMatch && !descMatch && !contentMatch) {
            return null;
          }

          // Extract excerpt around match
          const contentIndex = doc.content.toLowerCase().indexOf(lowerQuery);
          const excerptStart = Math.max(0, contentIndex - 50);
          const excerptEnd = Math.min(doc.content.length, contentIndex + 100);
          const excerpt =
            (excerptStart > 0 ? "..." : "") +
            doc.content.slice(excerptStart, excerptEnd) +
            (excerptEnd < doc.content.length ? "..." : "");

          return {
            slug: doc.slug,
            title: doc.title,
            description: doc.description,
            excerpt,
          };
        })
        .filter((result): result is SearchResult => result !== null)
        .slice(0, 10); // Limit to 10 results

      setResults(searchResults);
    },
    [docs],
  );

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      performSearch(query);
    }, 200);

    return () => clearTimeout(timeoutId);
  }, [query, performSearch]);

  const handleSelect = (slug: string) => {
    setIsOpen(false);
    setQuery("");
    setResults([]);
    router.push(`/docs/${slug}`);
  };

  return (
    <>
      {/* Search trigger button */}
      <Button
        variant="outline"
        className="text-muted-foreground relative w-full justify-start text-sm"
        onClick={() => setIsOpen(true)}
      >
        <SearchIcon className="mr-2 h-4 w-4" />
        <span>Search documentation...</span>
        <kbd className="bg-muted pointer-events-none absolute top-1/2 right-2 hidden -translate-y-1/2 items-center gap-1 rounded border px-1.5 font-mono text-[10px] font-medium opacity-100 select-none sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>

      {/* Search dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="gap-0 p-0 sm:max-w-2xl">
          <DialogHeader className="border-border border-b px-4 py-3">
            <DialogTitle className="sr-only">Search Documentation</DialogTitle>
            <div className="relative">
              <SearchIcon className="text-muted-foreground absolute top-1/2 left-0 h-4 w-4 -translate-y-1/2" />
              <Input
                placeholder="Search documentation..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="border-0 pr-10 pl-7 focus-visible:ring-0"
                autoFocus
              />
              {query && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute top-1/2 right-0 h-7 w-7 -translate-y-1/2 p-0"
                  onClick={() => {
                    setQuery("");
                    setResults([]);
                  }}
                >
                  <X className="h-4 w-4" />
                  <span className="sr-only">Clear</span>
                </Button>
              )}
            </div>
          </DialogHeader>

          {/* Search results */}
          <div className="max-h-[400px] overflow-y-auto p-2">
            {query && results.length === 0 ? (
              <div className="text-muted-foreground py-12 text-center text-sm">
                No results found for &quot;{query}&quot;
              </div>
            ) : results.length > 0 ? (
              <div className="space-y-1">
                {results.map((result) => (
                  <button
                    key={result.slug}
                    onClick={() => handleSelect(result.slug)}
                    className={cn(
                      "hover:bg-muted w-full rounded-md p-3 text-left transition-colors",
                      "focus:bg-muted focus:outline-none",
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <FileText className="text-muted-foreground mt-1 h-4 w-4 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="font-medium">{result.title}</p>
                        <p className="text-muted-foreground mt-1 text-sm">
                          {result.description}
                        </p>
                        {result.excerpt && (
                          <p className="text-muted-foreground mt-1 line-clamp-2 text-xs">
                            {result.excerpt}
                          </p>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-muted-foreground py-12 text-center text-sm">
                Start typing to search...
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
