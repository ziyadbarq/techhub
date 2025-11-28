/**
 * useConditionalField Hook
 * React hook for evaluating conditional logic on custom fields
 */

import { useMemo } from "react";
import type { FieldConditionalLogic } from "@/core/domain/entities/field-definition.entity";
import {
  evaluateConditionalLogic,
  getReferencedFields,
  type FieldValues,
  type ConditionalLogicResult,
} from "@/lib/custom-fields/conditional-logic";

export interface UseConditionalFieldOptions {
  /** The conditional logic configuration for the field */
  conditionalLogic: FieldConditionalLogic | null | undefined;
  /** Current values of all fields in the form */
  fieldValues: FieldValues;
  /** Whether the field is statically required (from field definition) */
  isStaticallyRequired?: boolean;
}

export interface UseConditionalFieldResult extends ConditionalLogicResult {
  /** Combined required state (static OR conditional) */
  isRequired: boolean;
  /** List of fields this field depends on for conditional logic */
  dependsOn: string[];
}

/**
 * Hook to evaluate and manage conditional field state
 *
 * @example
 * ```tsx
 * const { isVisible, isRequired, isDisabled, dependsOn } = useConditionalField({
 *   conditionalLogic: field.conditionalLogic,
 *   fieldValues: watch(), // from react-hook-form
 *   isStaticallyRequired: field.isRequired,
 * });
 *
 * if (!isVisible) return null;
 *
 * return (
 *   <Input disabled={isDisabled} required={isRequired} />
 * );
 * ```
 */
export function useConditionalField({
  conditionalLogic,
  fieldValues,
  isStaticallyRequired = false,
}: UseConditionalFieldOptions): UseConditionalFieldResult {
  // Get the fields this field depends on (stable reference)
  const dependsOn = useMemo(
    () => getReferencedFields(conditionalLogic),
    [conditionalLogic],
  );

  // Evaluate conditional logic
  const result = useMemo(
    () => evaluateConditionalLogic(conditionalLogic, fieldValues),
    [conditionalLogic, fieldValues],
  );

  // Combine static and conditional required state
  const isRequired = isStaticallyRequired || result.isConditionallyRequired;

  return {
    ...result,
    isRequired,
    dependsOn,
  };
}

/**
 * Hook to evaluate conditional logic for multiple fields at once
 * More efficient when you need to evaluate many fields
 */
export function useConditionalFields(
  fields: Array<{
    name: string;
    conditionalLogic: FieldConditionalLogic | null | undefined;
    isStaticallyRequired?: boolean;
  }>,
  fieldValues: FieldValues,
): Record<string, UseConditionalFieldResult> {
  return useMemo(() => {
    const results: Record<string, UseConditionalFieldResult> = {};

    for (const field of fields) {
      const result = evaluateConditionalLogic(
        field.conditionalLogic,
        fieldValues,
      );
      const dependsOn = getReferencedFields(field.conditionalLogic);

      results[field.name] = {
        ...result,
        isRequired:
          field.isStaticallyRequired || result.isConditionallyRequired,
        dependsOn,
      };
    }

    return results;
  }, [fields, fieldValues]);
}
