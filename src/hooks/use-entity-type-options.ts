"use client";

/**
 * Hook to get entity type options for SearchableSelect
 *
 * Returns a memoized array of options for the Entity Type dropdown
 * in Field Definition forms.
 *
 * @returns Array of SearchableSelectOption with format: "Display Name (Category)"
 *
 * @example
 * ```tsx
 * const entityTypeOptions = useEntityTypeOptions();
 * // Returns: [{ value: "Asset", label: "Asset (Asset Management)" }, ...]
 *
 * <SearchableSelect
 *   options={entityTypeOptions}
 *   value={field.value}
 *   onValueChange={field.onChange}
 * />
 * ```
 */

import { useMemo } from "react";
import type { SearchableSelectOption } from "@/components/ui/searchable-select";
import {
  getCustomFieldsEnabledEntities,
  ENTITY_CATEGORY_LABELS,
} from "@/lib/entity-registry";

export function useEntityTypeOptions(): SearchableSelectOption[] {
  return useMemo(() => {
    const entities = getCustomFieldsEnabledEntities();

    return entities.map((entity) => ({
      value: entity.key,
      label: `${entity.displayName} (${ENTITY_CATEGORY_LABELS[entity.category]})`,
    }));
  }, []);
}
