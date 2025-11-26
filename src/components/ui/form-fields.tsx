/**
 * Shared Form Field Components
 *
 * Reusable form field wrappers for react-hook-form integration.
 * Includes standard fields and searchable select variants.
 */

"use client";

import type { Control, FieldPath, FieldValues } from "react-hook-form";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  SearchableSelect,
  type SearchableSelectOption,
} from "@/components/ui/searchable-select";

/**
 * Base field props shared across all field components
 */
interface BaseFieldProps<TFieldValues extends FieldValues> {
  control: Control<TFieldValues>;
  name: FieldPath<TFieldValues>;
  label: string;
  description?: string;
  required?: boolean;
}

/**
 * Searchable select field props
 */
interface SearchableSelectFieldProps<TFieldValues extends FieldValues>
  extends BaseFieldProps<TFieldValues> {
  options: SearchableSelectOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  maxVisibleItems?: number;
  disabled?: boolean;
}

/**
 * Searchable Select Field Component
 *
 * A form-integrated searchable dropdown for large lists.
 * Use this for entity selectors (assets, persons, vendors, etc.)
 * where the list may have 10+ options.
 *
 * @example
 * ```tsx
 * <SearchableSelectField
 *   control={form.control}
 *   name="vendorId"
 *   label="Vendor"
 *   options={vendors.map(v => ({ value: v.id, label: v.name }))}
 *   required
 * />
 * ```
 */
export function SearchableSelectField<TFieldValues extends FieldValues>({
  control,
  name,
  label,
  description,
  required,
  options,
  placeholder,
  searchPlaceholder,
  emptyMessage,
  maxVisibleItems,
  disabled,
}: SearchableSelectFieldProps<TFieldValues>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>
            {label} {required && "*"}
          </FormLabel>
          <FormControl>
            <SearchableSelect
              options={options}
              value={field.value ?? undefined}
              onValueChange={field.onChange}
              placeholder={placeholder ?? `Select ${label.toLowerCase()}...`}
              searchPlaceholder={searchPlaceholder}
              emptyMessage={emptyMessage}
              maxVisibleItems={maxVisibleItems}
              disabled={disabled}
            />
          </FormControl>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

/**
 * Nullable searchable select field props
 */
interface NullableSearchableSelectFieldProps<TFieldValues extends FieldValues>
  extends BaseFieldProps<TFieldValues> {
  options: SearchableSelectOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  maxVisibleItems?: number;
  disabled?: boolean;
  noneLabel?: string;
}

/**
 * Nullable Searchable Select Field Component
 *
 * A form-integrated searchable dropdown that allows null selection.
 * Use this for optional foreign key relationships where the user
 * can choose "None" to clear the selection.
 *
 * @example
 * ```tsx
 * <NullableSearchableSelectField
 *   control={form.control}
 *   name="primaryOwnerId"
 *   label="Primary Owner"
 *   options={persons.map(p => ({ value: p.id, label: p.name }))}
 *   noneLabel="No owner assigned"
 * />
 * ```
 */
export function NullableSearchableSelectField<
  TFieldValues extends FieldValues,
>({
  control,
  name,
  label,
  description,
  required,
  options,
  placeholder,
  searchPlaceholder,
  emptyMessage,
  maxVisibleItems,
  disabled,
  noneLabel = "None",
}: NullableSearchableSelectFieldProps<TFieldValues>) {
  // Prepend "None" option to the list
  const optionsWithNone: SearchableSelectOption[] = [
    { value: "__none__", label: noneLabel },
    ...options,
  ];

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>
            {label} {required && "*"}
          </FormLabel>
          <FormControl>
            <SearchableSelect
              options={optionsWithNone}
              value={field.value ?? "__none__"}
              onValueChange={(value) =>
                field.onChange(value === "__none__" ? null : value)
              }
              placeholder={placeholder ?? `Select ${label.toLowerCase()}...`}
              searchPlaceholder={searchPlaceholder}
              emptyMessage={emptyMessage}
              maxVisibleItems={maxVisibleItems}
              disabled={disabled}
            />
          </FormControl>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

// Re-export types for convenience
export type { SearchableSelectOption };
