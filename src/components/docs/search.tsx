"use client";

/**
 * Documentation Search Component
 * Client-side search with glossary expansion and Cmd+K support
 *
 * Features:
 * - Glossary-aware search (synonyms and related terms)
 * - Relevance-based ranking
 * - Keyboard navigation
 * - Query highlighting in results
 */

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Search as SearchIcon,
  X,
  FileText,
  ArrowRight,
  CornerDownLeft,
} from "lucide-react";
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
import { expandSearchQuery } from "@/lib/docs/glossary";

interface SearchResult {
  slug: string;
  title: string;
  description: string;
  excerpt: string;
  score: number;
  matchType: "title" | "description" | "content";
}

interface SearchProps {
  docs: Array<{
    slug: string;
    title: string;
    description: string;
    content: string;
  }>;
}

/**
 * Calculate relevance score for a document
 */
function calculateRelevanceScore(
  doc: SearchProps["docs"][0],
  searchTerms: string[],
): { score: number; matchType: "title" | "description" | "content" } {
  let score = 0;
  let matchType: "title" | "description" | "content" = "content";

  const lowerTitle = doc.title.toLowerCase();
  const lowerDesc = doc.description.toLowerCase();
  const lowerContent = doc.content.toLowerCase();

  for (const term of searchTerms) {
    // Title matches are most valuable
    if (lowerTitle.includes(term)) {
      score += 10;
      if (lowerTitle === term) score += 5; // Exact title match bonus
      matchType = "title";
    }
    // Description matches are second
    if (lowerDesc.includes(term)) {
      score += 5;
      if (matchType === "content") matchType = "description";
    }
    // Content matches
    if (lowerContent.includes(term)) {
      score += 1;
      // Bonus for multiple occurrences
      const occurrences = (lowerContent.match(new RegExp(term, "g")) || [])
        .length;
      score += Math.min(occurrences * 0.5, 3);
    }
  }

  return { score, matchType };
}

/**
 * Extract and highlight excerpt around matched term
 */
function extractExcerpt(
  content: string,
  searchTerms: string[],
  maxLength: number = 150,
): string {
  const lowerContent = content.toLowerCase();

  // Find the first matching term
  let matchIndex = -1;
  let matchedTerm = "";

  for (const term of searchTerms) {
    const index = lowerContent.indexOf(term);
    if (index !== -1 && (matchIndex === -1 || index < matchIndex)) {
      matchIndex = index;
      matchedTerm = term;
    }
  }

  if (matchIndex === -1) {
    // No match found, return beginning of content
    return (
      content.slice(0, maxLength) + (content.length > maxLength ? "..." : "")
    );
  }

  // Extract context around match
  const contextBefore = 50;
  const start = Math.max(0, matchIndex - contextBefore);
  const end = Math.min(
    content.length,
    matchIndex + matchedTerm.length + maxLength - contextBefore,
  );

  let excerpt = "";
  if (start > 0) excerpt += "...";
  excerpt += content.slice(start, end);
  if (end < content.length) excerpt += "...";

  return excerpt;
}

export function Search({ docs }: SearchProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

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

  // Handle select function (defined before useEffect that uses it)
  const handleSelect = useCallback(
    (slug: string) => {
      setIsOpen(false);
      setQuery("");
      setResults([]);
      router.push(`/docs/${slug}`);
    },
    [router],
  );

  // Keyboard navigation within results
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((prev) => Math.max(prev - 1, 0));
          break;
        case "Enter":
          e.preventDefault();
          if (results[selectedIndex]) {
            handleSelect(results[selectedIndex].slug);
          }
          break;
        case "Escape":
          setIsOpen(false);
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, results, selectedIndex, handleSelect]);

  // Scroll selected item into view
  useEffect(() => {
    if (resultsRef.current && results.length > 0) {
      const selectedElement = resultsRef.current.children[
        selectedIndex
      ] as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: "nearest" });
      }
    }
  }, [selectedIndex, results.length]);

  // Search function with glossary expansion
  const performSearch = useCallback(
    (searchQuery: string) => {
      if (!searchQuery.trim()) {
        setResults([]);
        setSelectedIndex(0);
        return;
      }

      // Expand query with glossary synonyms
      const searchTerms = expandSearchQuery(searchQuery);

      const searchResults = docs
        .map((doc) => {
          const { score, matchType } = calculateRelevanceScore(
            doc,
            searchTerms,
          );

          if (score === 0) {
            return null;
          }

          // Extract excerpt around match
          const excerpt = extractExcerpt(doc.content, searchTerms);

          return {
            slug: doc.slug,
            title: doc.title,
            description: doc.description,
            excerpt,
            score,
            matchType,
          };
        })
        .filter((result): result is SearchResult => result !== null)
        .sort((a, b) => b.score - a.score) // Sort by relevance
        .slice(0, 10);

      setResults(searchResults);
      setSelectedIndex(0);
    },
    [docs],
  );

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      performSearch(query);
    }, 150);

    return () => clearTimeout(timeoutId);
  }, [query, performSearch]);

  // Get match type label
  const getMatchTypeLabel = (matchType: SearchResult["matchType"]) => {
    switch (matchType) {
      case "title":
        return "Title match";
      case "description":
        return "Description match";
      default:
        return "Content match";
    }
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
                ref={inputRef}
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
          <div ref={resultsRef} className="max-h-[400px] overflow-y-auto p-2">
            {query && results.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-muted-foreground text-sm">
                  No results found for &quot;{query}&quot;
                </p>
                <p className="text-muted-foreground mt-2 text-xs">
                  Try different keywords or check for typos
                </p>
              </div>
            ) : results.length > 0 ? (
              <div className="space-y-1">
                {results.map((result, index) => (
                  <button
                    key={result.slug}
                    onClick={() => handleSelect(result.slug)}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={cn(
                      "w-full rounded-md p-3 text-left transition-colors",
                      "focus:outline-none",
                      selectedIndex === index
                        ? "bg-muted"
                        : "hover:bg-muted/50",
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <FileText className="text-muted-foreground mt-1 h-4 w-4 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{result.title}</p>
                          {selectedIndex === index && (
                            <ArrowRight className="text-muted-foreground h-3 w-3" />
                          )}
                        </div>
                        <p className="text-muted-foreground mt-1 text-sm">
                          {result.description}
                        </p>
                        {result.excerpt && (
                          <p className="text-muted-foreground mt-1 line-clamp-2 text-xs">
                            {result.excerpt}
                          </p>
                        )}
                        <p className="text-muted-foreground/60 mt-2 text-xs">
                          {getMatchTypeLabel(result.matchType)}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center">
                <p className="text-muted-foreground text-sm">
                  Start typing to search...
                </p>
                <p className="text-muted-foreground mt-2 text-xs">
                  Search includes synonyms and related terms
                </p>
              </div>
            )}
          </div>

          {/* Keyboard hints footer */}
          {results.length > 0 && (
            <div className="border-border text-muted-foreground flex items-center gap-4 border-t px-4 py-2 text-xs">
              <span className="flex items-center gap-1">
                <kbd className="bg-muted rounded px-1.5 py-0.5">↑↓</kbd>
                Navigate
              </span>
              <span className="flex items-center gap-1">
                <CornerDownLeft className="h-3 w-3" />
                Select
              </span>
              <span className="flex items-center gap-1">
                <kbd className="bg-muted rounded px-1.5 py-0.5">esc</kbd>
                Close
              </span>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
