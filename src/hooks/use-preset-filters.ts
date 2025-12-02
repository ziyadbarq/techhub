/**
 * usePresetFilters Hook
 *
 * Manages preset filter combinations with active state tracking.
 * Useful for providing quick-access filter buttons like "Prod Critical", "Unlinked Assets", etc.
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
 *     {
 *       key: 'unlinked',
 *       label: 'Unlinked Assets',
 *       description: 'Items without linked assets',
 *       filters: { assetLink: 'unlinked' },
 *     },
 *   ],
 *   onApply: (filters) => {
 *     tableFilters.setFilters(filters);
 *   },
 * });
 *
 * // Use in component
 * <Button onClick={() => presets.applyPreset('prod-critical')}>
 *   {presets.presets[0].label}
 * </Button>
 * ```
 */

"use client";

import { useCallback, useMemo, useState } from "react";

export interface PresetFilter<TFilters extends Record<string, unknown>> {
  /** Unique identifier for the preset */
  key: string;
  /** Display label for the preset */
  label: string;
  /** Optional description/tooltip text */
  description?: string;
  /** Filter values to apply when preset is activated */
  filters: Partial<TFilters>;
  /** Optional icon component */
  icon?: React.ComponentType<{ className?: string }>;
}

export interface UsePresetFiltersOptions<
  TFilters extends Record<string, unknown>,
> {
  /** Array of preset filter configurations */
  presets: PresetFilter<TFilters>[];
  /** Callback when a preset is applied */
  onApply: (filters: Partial<TFilters>) => void;
  /** Callback when presets are cleared */
  onClear?: () => void;
}

export interface UsePresetFiltersReturn<
  TFilters extends Record<string, unknown>,
> {
  /** Preset filter definitions */
  presets: PresetFilter<TFilters>[];
  /** Currently active preset key (null if none) */
  activePreset: string | null;
  /** Apply a preset by key */
  applyPreset: (key: string) => void;
  /** Clear active preset */
  clearPreset: () => void;
  /** Check if a specific preset is active */
  isPresetActive: (key: string) => boolean;
}

/**
 * Hook for managing preset filter combinations
 */
export function usePresetFilters<TFilters extends Record<string, unknown>>({
  presets,
  onApply,
  onClear,
}: UsePresetFiltersOptions<TFilters>): UsePresetFiltersReturn<TFilters> {
  const [activePreset, setActivePreset] = useState<string | null>(null);

  // Create a lookup map for faster preset access
  const presetMap = useMemo(() => {
    const map = new Map<string, PresetFilter<TFilters>>();
    for (const preset of presets) {
      map.set(preset.key, preset);
    }
    return map;
  }, [presets]);

  // Apply a preset by key
  const applyPreset = useCallback(
    (key: string) => {
      const preset = presetMap.get(key);
      if (!preset) {
        console.warn(`Preset with key "${key}" not found`);
        return;
      }

      setActivePreset(key);
      onApply(preset.filters);
    },
    [presetMap, onApply],
  );

  // Clear active preset
  const clearPreset = useCallback(() => {
    setActivePreset(null);
    if (onClear) {
      onClear();
    }
  }, [onClear]);

  // Check if a specific preset is active
  const isPresetActive = useCallback(
    (key: string) => activePreset === key,
    [activePreset],
  );

  return {
    presets,
    activePreset,
    applyPreset,
    clearPreset,
    isPresetActive,
  };
}
