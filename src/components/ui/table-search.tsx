/**
 * TableSearch Component
 *
 * Reusable search input for tables with clear button and keyboard shortcuts.
 * Designed to work with useTableFilters hook.
 *
 * @example
 * ```tsx
 * const filters = useTableFilters({ ... });
 *
 * <TableSearch
 *   value={filters.searchTerm}
 *   onChange={filters.setSearchTerm}
 *   placeholder="Search by name or CI key..."
 *   loading={isLoading}
 * />
 * ```
 */

"use client";

import * as React from "react";
import { Search, X, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface TableSearchProps {
  /** Current search value */
  value: string;
  /** Callback when search value changes */
  onChange: (value: string) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Show loading indicator */
  loading?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Disabled state */
  disabled?: boolean;
}

export function TableSearch({
  value,
  onChange,
  placeholder = "Search...",
  loading = false,
  className,
  disabled = false,
}: TableSearchProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Handle clear button
  const handleClear = React.useCallback(() => {
    onChange("");
    inputRef.current?.focus();
  }, [onChange]);

  // Keyboard shortcut: Ctrl/Cmd + K to focus search
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className={cn("relative w-full max-w-sm", className)}>
      {/* Search icon */}
      <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />

      {/* Input */}
      <Input
        ref={inputRef}
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="pr-9 pl-9"
      />

      {/* Loading indicator or Clear button */}
      {loading ? (
        <Loader2 className="text-muted-foreground absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 animate-spin" />
      ) : value ? (
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={handleClear}
          className="absolute top-1/2 right-1 h-7 w-7 -translate-y-1/2"
          disabled={disabled}
          title="Clear search (Esc)"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Clear search</span>
        </Button>
      ) : null}

      {/* Keyboard hint (visible when not focused) */}
      {!value && (
        <kbd className="bg-muted text-muted-foreground pointer-events-none absolute top-1/2 right-3 hidden -translate-y-1/2 rounded border px-1.5 py-0.5 font-mono text-[10px] font-medium opacity-50 select-none sm:block">
          <span className="text-xs">⌘</span>K
        </kbd>
      )}
    </div>
  );
}
