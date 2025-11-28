/**
 * ConditionalCustomField Component
 * Wraps CustomFieldInput with conditional logic evaluation
 * Shows/hides/disables the field based on other field values
 */

"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { CustomFieldInput } from "./custom-field-input";
import type { EnrichedAssetCategoryFieldDTO } from "@/interface-adapters/presenters/asset-category-field.presenter";
import type { Control, FieldValues, Path } from "react-hook-form";
import { useConditionalField } from "@/hooks/use-conditional-field";
import type { FieldConditionalLogic } from "@/core/domain/entities/field-definition.entity";

interface ConditionalCustomFieldProps<TFieldValues extends FieldValues> {
  /** The field definition/configuration */
  field: EnrichedAssetCategoryFieldDTO;
  /** React Hook Form control */
  control: Control<TFieldValues>;
  /** Field name in the form */
  name: Path<TFieldValues>;
  /** Current values of all fields (for conditional evaluation) */
  allFieldValues: Record<string, unknown>;
  /** Optional className for the form item */
  className?: string;
  /** Whether to show the description */
  showDescription?: boolean;
}

/**
 * ConditionalCustomField - A form field that respects conditional logic
 *
 * This component:
 * 1. Evaluates conditional logic (visibility, required, disabled)
 * 2. Shows/hides the field based on visibility conditions
 * 3. Makes the field required based on required conditions
 * 4. Disables the field based on disabled conditions
 *
 * @example
 * ```tsx
 * <ConditionalCustomField
 *   field={categoryField}
 *   control={control}
 *   name={`attributes.${categoryField.fieldName}`}
 *   allFieldValues={watch()}
 * />
 * ```
 */
export function ConditionalCustomField<TFieldValues extends FieldValues>({
  field,
  control,
  name,
  allFieldValues,
  className,
  showDescription = true,
}: ConditionalCustomFieldProps<TFieldValues>) {
  // Parse conditional logic from the field
  const conditionalLogic = React.useMemo(() => {
    // The conditional logic might be stored in the field definition's metadata
    // or directly on the enriched field DTO
    const logic = (
      field as unknown as { conditionalLogic?: FieldConditionalLogic }
    ).conditionalLogic;
    return logic || null;
  }, [field]);

  // Evaluate conditional logic
  const { isVisible, isRequired, isDisabled } = useConditionalField({
    conditionalLogic,
    fieldValues: allFieldValues,
    isStaticallyRequired: field.isRequired,
  });

  // If not visible, don't render anything
  if (!isVisible) {
    return null;
  }

  return (
    <FormField
      control={control}
      name={name}
      rules={{
        required: isRequired ? `${field.fieldLabel} is required` : undefined,
      }}
      render={({ field: formField }) => (
        <FormItem className={cn("space-y-2", className)}>
          <FormLabel
            className={cn(
              isRequired &&
                "after:text-destructive after:ml-0.5 after:content-['*']",
            )}
          >
            {field.fieldLabel}
          </FormLabel>
          <FormControl>
            <CustomFieldInput
              field={field}
              value={formField.value}
              onChange={formField.onChange}
              disabled={isDisabled}
            />
          </FormControl>
          {showDescription && field.fieldDescription && (
            <FormDescription>{field.fieldDescription}</FormDescription>
          )}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

/**
 * Props for the ConditionalCustomFieldsSection component
 */
interface ConditionalCustomFieldsSectionProps<
  TFieldValues extends FieldValues,
> {
  /** List of enriched fields to render */
  fields: EnrichedAssetCategoryFieldDTO[];
  /** React Hook Form control */
  control: Control<TFieldValues>;
  /** Base name for nested fields (e.g., "attributes") */
  baseName?: string;
  /** Current values of all fields */
  allFieldValues: Record<string, unknown>;
  /** Grid columns for layout */
  columns?: 1 | 2 | 3;
  /** Optional className */
  className?: string;
}

/**
 * Renders multiple conditional custom fields in a section
 */
export function ConditionalCustomFieldsSection<
  TFieldValues extends FieldValues,
>({
  fields,
  control,
  baseName = "attributes",
  allFieldValues,
  columns = 2,
  className,
}: ConditionalCustomFieldsSectionProps<TFieldValues>) {
  const gridClass = {
    1: "grid-cols-1",
    2: "grid-cols-1 md:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
  }[columns];

  // Sort fields by uiOrder
  const sortedFields = React.useMemo(
    () => [...fields].sort((a, b) => a.uiOrder - b.uiOrder),
    [fields],
  );

  if (sortedFields.length === 0) {
    return null;
  }

  return (
    <div className={cn("grid gap-4", gridClass, className)}>
      {sortedFields.map((field) => (
        <ConditionalCustomField
          key={field.id}
          field={field}
          control={control}
          name={`${baseName}.${field.fieldName}` as Path<TFieldValues>}
          allFieldValues={allFieldValues}
        />
      ))}
    </div>
  );
}
