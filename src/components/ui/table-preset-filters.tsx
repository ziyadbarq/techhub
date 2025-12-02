/**
 * TablePresetFilters Component
 *
 * Preset filter button group with tooltips and "Clear all" functionality.
 * Designed to work with usePresetFilters hook.
 *
 * @example
 * ```tsx
 * const presets = usePresetFilters({
 *   presets: [
 *     {
 *       key: 'prod-critical',
 *       label: 'Prod Critical',
 *       description: 'Critical items in production',
 *       filters: { criticality: 'CRITICAL', environment: 'PROD' },
 *     },
 *   ],
 *   onApply: (filters) => tableFilters.setFilters(filters),
 * });
 *
 * <TablePresetFilters
 *   presets={presets.presets}
 *   activePreset={presets.activePreset}
 *   onApply={presets.applyPreset}
 *   onClear={presets.clearPreset}
 * />
 * ```
 */

"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PresetFilter } from "@/hooks/use-preset-filters";

export interface TablePresetFiltersProps<
  TFilters extends Record<string, unknown>,
> {
  /** Preset filter definitions */
  presets: PresetFilter<TFilters>[];
  /** Currently active preset key */
  activePreset?: string | null;
  /** Callback when a preset is applied */
  onApply: (key: string) => void;
  /** Callback when "Clear all" is clicked */
  onClear?: () => void;
  /** Show clear button */
  showClear?: boolean;
  /** Additional CSS classes */
  className?: string;
}

export function TablePresetFilters<TFilters extends Record<string, unknown>>({
  presets,
  activePreset,
  onApply,
  onClear,
  showClear = true,
  className,
}: TablePresetFiltersProps<TFilters>) {
  if (presets.length === 0) {
    return null;
  }

  return (
    <TooltipProvider delayDuration={300}>
      <div className={cn("flex flex-wrap items-center gap-2", className)}>
        {/* Preset buttons */}
        {presets.map((preset) => {
          const isActive = activePreset === preset.key;

          return (
            <Tooltip key={preset.key}>
              <TooltipTrigger asChild>
                <Button
                  variant={isActive ? "default" : "secondary"}
                  size="sm"
                  onClick={() => onApply(preset.key)}
                  className={cn("gap-2 text-xs", isActive && "shadow-sm")}
                >
                  {preset.icon && <preset.icon className="h-3.5 w-3.5" />}
                  {preset.label}
                </Button>
              </TooltipTrigger>
              {preset.description && (
                <TooltipContent>
                  <p className="max-w-xs text-sm">{preset.description}</p>
                </TooltipContent>
              )}
            </Tooltip>
          );
        })}

        {/* Clear all button */}
        {showClear && onClear && activePreset && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClear}
            className="gap-1 text-xs"
          >
            <X className="h-3.5 w-3.5" />
            Clear filters
          </Button>
        )}
      </div>
    </TooltipProvider>
  );
}
