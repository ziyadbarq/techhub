/**
 * Conditional Logic Evaluation Utility
 *
 * Evaluates field visibility, required, and disabled states based on other field values.
 * Used by custom fields to dynamically control field behavior at runtime.
 *
 * @module conditional-logic
 *
 * @example Basic Usage
 * ```typescript
 * import { evaluateConditionalLogic } from "@/lib/custom-fields/conditional-logic";
 *
 * const result = evaluateConditionalLogic(
 *   {
 *     visibility: [{ sourceField: "category", operator: "equals", value: "laptop" }],
 *     required: [{ sourceField: "status", operator: "equals", value: "active" }],
 *   },
 *   { category: "laptop", status: "active" }
 * );
 * // result = { isVisible: true, isConditionallyRequired: true, isDisabled: false }
 * ```
 *
 * @example With React Hook
 * ```tsx
 * import { useConditionalField } from "@/hooks/use-conditional-field";
 *
 * function MyField({ conditionalLogic, fieldValues }) {
 *   const { isVisible, isRequired, isDisabled } = useConditionalField({
 *     conditionalLogic,
 *     fieldValues,
 *     isStaticallyRequired: false,
 *   });
 *
 *   if (!isVisible) return null;
 *   return <Input disabled={isDisabled} required={isRequired} />;
 * }
 * ```
 *
 * @see {@link ConditionalRule} for rule structure
 * @see {@link ConditionalOperator} for available operators
 * @see useConditionalField hook for React integration
 */

import type {
  FieldConditionalLogic,
  ConditionalRule,
  ConditionalOperator,
} from "@/core/domain/entities/field-definition.entity";

/**
 * Result of evaluating conditional logic for a field
 */
export interface ConditionalLogicResult {
  /** Whether the field should be visible */
  isVisible: boolean;
  /** Whether the field is conditionally required */
  isConditionallyRequired: boolean;
  /** Whether the field should be disabled */
  isDisabled: boolean;
}

/**
 * Context for evaluating conditional logic
 * Contains the current values of all fields in the form
 */
export type FieldValues = Record<string, unknown>;

/**
 * Evaluate a single conditional rule against the current field values
 */
function evaluateRule(
  rule: ConditionalRule,
  fieldValues: FieldValues,
): boolean {
  const sourceValue = fieldValues[rule.sourceField];

  switch (rule.operator) {
    case "equals":
      return sourceValue === rule.value;

    case "notEquals":
      return sourceValue !== rule.value;

    case "contains":
      if (typeof sourceValue === "string" && typeof rule.value === "string") {
        return sourceValue.toLowerCase().includes(rule.value.toLowerCase());
      }
      if (Array.isArray(sourceValue)) {
        return sourceValue.includes(rule.value);
      }
      return false;

    case "notContains":
      if (typeof sourceValue === "string" && typeof rule.value === "string") {
        return !sourceValue.toLowerCase().includes(rule.value.toLowerCase());
      }
      if (Array.isArray(sourceValue)) {
        return !sourceValue.includes(rule.value);
      }
      return true;

    case "isEmpty":
      return (
        sourceValue === null ||
        sourceValue === undefined ||
        sourceValue === "" ||
        (Array.isArray(sourceValue) && sourceValue.length === 0)
      );

    case "isNotEmpty":
      return (
        sourceValue !== null &&
        sourceValue !== undefined &&
        sourceValue !== "" &&
        !(Array.isArray(sourceValue) && sourceValue.length === 0)
      );

    case "greaterThan":
      if (typeof sourceValue === "number" && typeof rule.value === "number") {
        return sourceValue > rule.value;
      }
      return false;

    case "lessThan":
      if (typeof sourceValue === "number" && typeof rule.value === "number") {
        return sourceValue < rule.value;
      }
      return false;

    case "greaterThanOrEqual":
      if (typeof sourceValue === "number" && typeof rule.value === "number") {
        return sourceValue >= rule.value;
      }
      return false;

    case "lessThanOrEqual":
      if (typeof sourceValue === "number" && typeof rule.value === "number") {
        return sourceValue <= rule.value;
      }
      return false;

    case "in":
      if (Array.isArray(rule.value)) {
        return rule.value.includes(sourceValue);
      }
      return false;

    case "notIn":
      if (Array.isArray(rule.value)) {
        return !rule.value.includes(sourceValue);
      }
      return true;

    default:
      return false;
  }
}

/**
 * Evaluate multiple rules with AND/OR logic
 * Default behavior is AND (all rules must pass)
 */
function evaluateRules(
  rules: ConditionalRule[],
  fieldValues: FieldValues,
): boolean {
  if (rules.length === 0) return true;

  // Group rules by their combineWith logic
  // We evaluate groups: first rule starts a group, subsequent rules combine with previous
  let result = evaluateRule(rules[0], fieldValues);

  for (let i = 1; i < rules.length; i++) {
    const rule = rules[i];
    const ruleResult = evaluateRule(rule, fieldValues);
    const combineWith = rule.combineWith || "AND";

    if (combineWith === "OR") {
      result = result || ruleResult;
    } else {
      result = result && ruleResult;
    }
  }

  return result;
}

/**
 * Evaluate conditional logic for a field
 * Returns the visibility, required, and disabled states
 */
export function evaluateConditionalLogic(
  conditionalLogic: FieldConditionalLogic | null | undefined,
  fieldValues: FieldValues,
): ConditionalLogicResult {
  // Default: visible, not conditionally required, not disabled
  const defaultResult: ConditionalLogicResult = {
    isVisible: true,
    isConditionallyRequired: false,
    isDisabled: false,
  };

  if (!conditionalLogic) {
    return defaultResult;
  }

  // Evaluate visibility rules (field is visible when ALL rules pass)
  const isVisible = conditionalLogic.visibility
    ? evaluateRules(conditionalLogic.visibility, fieldValues)
    : true;

  // Evaluate required rules (field is required when ALL rules pass)
  const isConditionallyRequired = conditionalLogic.required
    ? evaluateRules(conditionalLogic.required, fieldValues)
    : false;

  // Evaluate disabled rules (field is disabled when ALL rules pass)
  const isDisabled = conditionalLogic.disabled
    ? evaluateRules(conditionalLogic.disabled, fieldValues)
    : false;

  return {
    isVisible,
    isConditionallyRequired,
    isDisabled,
  };
}

/**
 * Get all field names referenced in conditional logic
 * Useful for determining which fields trigger re-evaluation
 */
export function getReferencedFields(
  conditionalLogic: FieldConditionalLogic | null | undefined,
): string[] {
  if (!conditionalLogic) return [];

  const fields = new Set<string>();

  const addFieldsFromRules = (rules?: ConditionalRule[]) => {
    if (rules) {
      for (const rule of rules) {
        fields.add(rule.sourceField);
      }
    }
  };

  addFieldsFromRules(conditionalLogic.visibility);
  addFieldsFromRules(conditionalLogic.required);
  addFieldsFromRules(conditionalLogic.disabled);

  return Array.from(fields);
}

/**
 * Check if any field has conditional logic that depends on a specific field
 * Useful for optimizing re-renders
 */
export function hasConditionalDependency(
  conditionalLogic: FieldConditionalLogic | null | undefined,
  fieldName: string,
): boolean {
  const referencedFields = getReferencedFields(conditionalLogic);
  return referencedFields.includes(fieldName);
}

/**
 * Validate conditional logic configuration
 * Returns an array of error messages if invalid
 */
export function validateConditionalLogic(
  conditionalLogic: FieldConditionalLogic,
  availableFields: string[],
): string[] {
  const errors: string[] = [];

  const validateRules = (
    rules: ConditionalRule[] | undefined,
    context: string,
  ) => {
    if (!rules) return;

    for (let i = 0; i < rules.length; i++) {
      const rule = rules[i];

      // Check if source field exists
      if (!availableFields.includes(rule.sourceField)) {
        errors.push(
          `${context} rule ${i + 1}: Source field "${rule.sourceField}" does not exist`,
        );
      }

      // Validate operator-specific requirements
      const requiresValue: ConditionalOperator[] = [
        "equals",
        "notEquals",
        "contains",
        "notContains",
        "greaterThan",
        "lessThan",
        "greaterThanOrEqual",
        "lessThanOrEqual",
        "in",
        "notIn",
      ];

      if (requiresValue.includes(rule.operator) && rule.value === undefined) {
        errors.push(
          `${context} rule ${i + 1}: Operator "${rule.operator}" requires a value`,
        );
      }

      // Validate 'in' and 'notIn' have array values
      if (
        (rule.operator === "in" || rule.operator === "notIn") &&
        !Array.isArray(rule.value)
      ) {
        errors.push(
          `${context} rule ${i + 1}: Operator "${rule.operator}" requires an array value`,
        );
      }
    }
  };

  validateRules(conditionalLogic.visibility, "Visibility");
  validateRules(conditionalLogic.required, "Required");
  validateRules(conditionalLogic.disabled, "Disabled");

  return errors;
}

/**
 * Format a conditional rule for display
 */
export function formatRule(rule: ConditionalRule): string {
  const operatorLabels: Record<ConditionalOperator, string> = {
    equals: "equals",
    notEquals: "does not equal",
    contains: "contains",
    notContains: "does not contain",
    isEmpty: "is empty",
    isNotEmpty: "is not empty",
    greaterThan: "is greater than",
    lessThan: "is less than",
    greaterThanOrEqual: "is greater than or equal to",
    lessThanOrEqual: "is less than or equal to",
    in: "is one of",
    notIn: "is not one of",
  };

  const operatorLabel = operatorLabels[rule.operator] || rule.operator;

  if (rule.operator === "isEmpty" || rule.operator === "isNotEmpty") {
    return `"${rule.sourceField}" ${operatorLabel}`;
  }

  const valueStr = Array.isArray(rule.value)
    ? `[${rule.value.join(", ")}]`
    : JSON.stringify(rule.value);

  return `"${rule.sourceField}" ${operatorLabel} ${valueStr}`;
}

/**
 * Format all conditional logic for display
 */
export function formatConditionalLogic(
  conditionalLogic: FieldConditionalLogic | null | undefined,
): string {
  if (!conditionalLogic) return "No conditional logic";

  const parts: string[] = [];

  if (conditionalLogic.visibility && conditionalLogic.visibility.length > 0) {
    const visibilityStr = conditionalLogic.visibility
      .map((rule, i) => {
        const ruleStr = formatRule(rule);
        return i > 0 ? `${rule.combineWith || "AND"} ${ruleStr}` : ruleStr;
      })
      .join(" ");
    parts.push(`Show when: ${visibilityStr}`);
  }

  if (conditionalLogic.required && conditionalLogic.required.length > 0) {
    const requiredStr = conditionalLogic.required
      .map((rule, i) => {
        const ruleStr = formatRule(rule);
        return i > 0 ? `${rule.combineWith || "AND"} ${ruleStr}` : ruleStr;
      })
      .join(" ");
    parts.push(`Require when: ${requiredStr}`);
  }

  if (conditionalLogic.disabled && conditionalLogic.disabled.length > 0) {
    const disabledStr = conditionalLogic.disabled
      .map((rule, i) => {
        const ruleStr = formatRule(rule);
        return i > 0 ? `${rule.combineWith || "AND"} ${ruleStr}` : ruleStr;
      })
      .join(" ");
    parts.push(`Disable when: ${disabledStr}`);
  }

  return parts.length > 0 ? parts.join("; ") : "No conditional logic";
}
